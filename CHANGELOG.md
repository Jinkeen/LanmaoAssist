# 更新日志

## v1.0 (2026-06)

### 迭代一：前端界面

搭建全部 16 个页面骨架（WXML / WXSS / JS），包括看板、房源、签单、账单、续租、退房、抄表、提醒、密码锁、房产管理等。

**遇到的问题与解决：**
- Tab bar 图标文件不存在 → 去掉 `iconPath`，纯文字标签
- `showShadowRootInWxmlPanel` 配置项在小程序宿主编译时报 `wx://not-found` → 在 `project.private.config.json` 中关闭该选项
- WXML 模板尝试在视图层调用 `new Date()` 导致运行时错误 → 将日期计算逻辑全部移到 JS 的 `calcPreview()` 方法中

---

### 迭代二：房产数据库搭建

实现房产（properties）和房间（rooms）的云数据库 CRUD，包含新增、编辑、删除功能。房间类型支持大床房 / 双人床。

**遇到的问题与解决：**
- 云数据库查询返回 `errCode: -1` → 在 `project.config.json` 中添加 `"cloud": true` 声明，并在云控制台手动创建 `properties` 和 `rooms` 集合
- 字段名映射导致 `roomNumber` 查询失败 → 统一数据库字段命名，确保前后端一致
- 字符串操作报 `Cannot read properties of undefined (reading 'trim')` → 所有字符串取值处添加 `(xxx || '').trim()` 防御性写法

---

### 迭代三：房源连通云数据库

房源列表页接入云数据库，按房产名称分类筛选，支持搜索过滤。

**遇到的问题与解决：**
- 云数据库字段权限导致小程序端查询被拒 → 将集合权限设为"所有用户可读，仅创建者可写"
- 只查部分字段时未指定 `field()` 导致冗余数据传输 → 使用 `db.collection('rooms').field({ propertyName: true, roomNumber: true }).get()` 精简查询

---

### 迭代四：截图录入 UI

实现截图上传 → OCR 解析 → 自动填入签单表的完整链路。最终方案为：图片读 base64 → 云函数调用腾讯云 OCR → 正则提取结构化字段（房号、日期、金额、手机）。

**遇到的问题与解决：**
- 云函数依赖 `axios` 导致部署失败（蓝色报错）→ 替换为 Node.js 原生 `https` 模块
- `wx-server-sdk@3.0.4` 子依赖 `tunnel-agent` 在云端运行时解析不到 → 多次重装 node_modules，最终改用零依赖方案（纯 `crypto` + `https`）
- DeepSeek Vision API 接口 `deepseek-chat` 返回 `unknown variant 'image_url', expected 'text'`，不支持图片输入 → 切换为腾讯云 OCR GeneralBasicOCR，使用 TC3-HMAC-SHA256 签名调用
- 腾讯云子账号提示"服务未开通" → 换用主账号 SecretId/SecretKey，并在控制台开通文字识别服务
- OCR 返回文字后正则匹配失败（格式不对齐）→ 多次迭代正则表达式：中文日期 `6月13日-6月14日`、带小数金额 `¥136.17`、入住人姓名精确提取

---

### 技术栈
- 微信小程序原生开发（WXML / WXSS / JS）
- 微信云开发（云数据库 + 云函数 + 云存储）
- 腾讯云 OCR（通用印刷体识别）
- TTLock 通通锁（API 扩展预留，持续调试中）

> 注：本项目初期开发阶段因误将微信开发者工具（1.1GB+）纳入 Git 追踪，开源前重建了仓库。原始 commit 节点（"前端界面 → 房产数据库搭建 → 房源连通云数据库 → 截图录入 UI"）因此丢失，仅保留最终代码。此 CHANGELOG 作为版本迭代的书面替代记录。
