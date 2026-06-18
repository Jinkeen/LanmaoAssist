# 懒猫房东管理 🐱

面向 B 端房东的轻量级租赁管理 SaaS，覆盖房源台账、租务签单、OCR 智能录入与经营数据看板。纯管理端，不涉及租客侧交互。

## 功能

- **房源概览** — 已出租/空房/待清洁统计，收租提醒
- **房源管理** — 房产和房间 CRUD（云数据库）
- **签单** — 手动录入租房订单
- **续租** — 延长租期，自动计算费用
- **截图录入** — 上传订单截图 → 腾讯云 OCR → 自动填表
- **数据看板** — 周/月/年收入统计，折线图+柱状图
- **密码锁** — 本地生成随机密码 + WiFi 信息一键复制；预留 TTLock 通通锁 API 扩展能力（蓝牙插件 `wx43d5971c94455481` + 云端 OpenAPI V3，支持远程下发限时密码，需开发者账号 + 网关）
- **账单** — 收入汇总

## 技术栈

- 微信小程序原生开发（WXML / WXSS / JS）
- 微信云开发（云数据库 + 云函数 + 云存储）
- 腾讯云 OCR（通用印刷体识别）

## 项目结构

```
├── pages/           # 页面
│   ├── index/       # 首页看板
│   ├── rooms/       # 房源列表
│   ├── sign/        # 签单
│   ├── renew/       # 续租
│   ├── bills/       # 账单
│   ├── dashboard/   # 数据看板
│   ├── password/    # 密码锁
│   ├── remind/      # 收租提醒
│   ├── meter/       # 抄表
│   └── profile/     # 个人中心
├── cloudfunctions/  # 云函数
│   └── ocr-parse/   # OCR 识别（腾讯云）
├── app.js           # 小程序入口
├── app.json         # 小程序配置
└── app.wxss         # 全局样式
```

## 开始使用

### 前置条件

1. 微信小程序账号（需开通云开发）
2. 腾讯云账号（用于 OCR，需开通文字识别服务）
3. TTLock 开发者账号（用于远程密码下发，持续调试中）

### 配置

1. 克隆项目后用微信开发者工具打开
2. 修改 `project.config.json` 中的 `appid` 为你的小程序 AppID
3. 在云开发控制台创建集合：
   - `properties` — 房产
   - `rooms` — 房间
   - `orders` — 订单
4. OCR 功能：编辑 `cloudfunctions/ocr-parse/index.js`，替换腾讯云密钥：
   ```js
   const SECRET_ID  = '你的SecretId'
   const SECRET_KEY = '你的SecretKey'
   ```
5. 右键 `cloudfunctions/ocr-parse` → 上传并部署

### 数据库集合权限

建议设为"所有用户可读，仅创建者可写"。

## License

MIT
