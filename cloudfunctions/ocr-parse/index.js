const crypto = require('crypto')
const https = require('https')

const SECRET_ID  = '你的腾讯云SecretId'
const SECRET_KEY = '你的腾讯云SecretKey'
const HOST = 'ocr.tencentcloudapi.com'
const SERVICE = 'ocr'
const VERSION = '2018-11-19'
const ACTION = 'GeneralBasicOCR'

function sha256(msg) { return crypto.createHash('sha256').update(msg).digest('hex') }
function hmacSha256(key, msg) { return crypto.createHmac('sha256', key).update(msg).digest() }
function hmacSha256Hex(key, msg) { return crypto.createHmac('sha256', key).update(msg).digest('hex') }

exports.main = async (event) => {
  console.log('开始OCR识别，图片大小:', (event.image || '').length)

  try {
    const payload = JSON.stringify({ ImageBase64: event.image })

    // TC3-HMAC-SHA256 签名
    const now = Math.floor(Date.now() / 1000)
    const date = new Date(now * 1000).toISOString().slice(0, 10)
    const algorithm = 'TC3-HMAC-SHA256'
    const credentialScope = date + '/' + SERVICE + '/tc3_request'

    const canonicalHeaders = 'content-type:application/json\nhost:' + HOST + '\n'
    const signedHeaders = 'content-type;host'
    const hashedPayload = sha256(payload)
    const canonicalRequest = 'POST\n/\n\n' + canonicalHeaders + '\n' + signedHeaders + '\n' + hashedPayload

    const stringToSign = algorithm + '\n' + now + '\n' + credentialScope + '\n' + sha256(canonicalRequest)

    const kDate = hmacSha256('TC3' + SECRET_KEY, date)
    const kService = hmacSha256(kDate, SERVICE)
    const kSigning = hmacSha256(kService, 'tc3_request')
    const signature = hmacSha256Hex(kSigning, stringToSign)

    const auth = algorithm + ' '
      + 'Credential=' + SECRET_ID + '/' + credentialScope + ', '
      + 'SignedHeaders=' + signedHeaders + ', '
      + 'Signature=' + signature

    const result = await new Promise((ok, no) => {
      const req = https.request({
        hostname: HOST,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': auth,
          'Host': HOST,
          'X-TC-Action': ACTION,
          'X-TC-Version': VERSION,
          'X-TC-Timestamp': now,
          'X-TC-Region': 'ap-guangzhou'
        }
      }, res => {
        let d = ''
        res.on('data', c => d += c)
        res.on('end', () => {
          try { ok(JSON.parse(d)) } catch(e) { no(e) }
        })
      })
      req.on('error', no)
      req.write(payload)
      req.end()
    })

    console.log('OCR返回:', JSON.stringify(result).slice(0, 500))

    if (result.Response.Error) {
      return { success: false, error: result.Response.Error.Message, data: {} }
    }

    const detections = result.Response.TextDetections || []
    const fullText = detections.map(d => d.DetectedText).join('\n')

    console.log('识别文字=', fullText)

    const data = parseOrder(fullText)

    console.log('解析结果=', JSON.stringify(data))
    console.log('hasAny=', !!(data.room || data.startDate || data.amount || data.phone))

    const hasAny = data.room || data.startDate || data.amount || data.phone
    if (!hasAny) {
      return { success: false, error: '未能从截图中识别到订单信息，请手动录入', rawText: fullText, data }
    }

    return { success: true, data, rawText: fullText }

  } catch (err) {
    console.error('云函数异常:', err)
    return { success: false, error: err.message, data: {} }
  }
}

function parseOrder(text) {
  const now = new Date()
  const year = now.getFullYear()

  // === 日期 ===
  let startDate = '', endDate = ''

  // 格式1: 6月13日-6月14日
  const cnRange = text.match(/(\d{1,2})\s*月\s*(\d{1,2})\s*日?\s*[-~至到]\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日?/i)
  console.log('日期匹配=', cnRange)
  if (cnRange) {
    startDate = `${year}-${String(cnRange[1]).padStart(2,'0')}-${String(cnRange[2]).padStart(2,'0')}`
    endDate   = `${year}-${String(cnRange[3]).padStart(2,'0')}-${String(cnRange[4]).padStart(2,'0')}`
  }

  // 格式2: 2026.06.09-2026.06.10 或 2026-06-09 或 2026/06/09
  if (!startDate) {
    const dRE = /\d{4}[.\-\/]\d{1,2}[.\-\/]\d{1,2}/g
    const dates = text.match(dRE) || []
    startDate = dates[0] ? dates[0].replace(/\./g, '-') : ''
    endDate   = dates[1] ? dates[1].replace(/\./g, '-') : ''
  }

  // === 金额: 直接抓 ¥ 后面的数字 ===
  let amount = ''
  const amt = text.match(/(\d+\.\d{1,2})/)
  console.log('金额匹配=', amt)
  if (amt) { amount = amt[1] }

  // === 手机号 ===
  const phone = (text.match(/1[3-9]\d{9}/) || [])[0] || ''

  // === 入住人姓名 ===
  const name = (text.match(/(?:入住人|实际入住人|姓名|名字|客户|租客|联系人|预订人)[:：]?\s*([一-龥]{2,4})/) || [])[1] || ''

  // === 房号 ===
  let room = ''
  const rm = text.match(/([ABC][栋棟]\s*-?\s*\d{2,3}[室房]?)/)
  if (rm) room = rm[1]
  if (!room) {
    const rm2 = text.match(/\b([A-Ca-c])\s*[-栋棟]?\s*(\d{2,3})\b/)
    if (rm2) room = rm2[1].toUpperCase() + '栋-' + rm2[2]
  }

  return { room, startDate, endDate, amount, phone, name,
    source: (text.match(/(微信|美团|携程|飞猪|Booking|Airbnb|爱彼迎)/i) || [])[1] || ''
  }
}
