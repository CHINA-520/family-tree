# 莫氏数字化族谱系统 (Mo Family Tree System)

一个基于 Cloudflare Workers + KV 数据库构建的轻量级、响应式数字化族谱档案管理系统。无需传统服务器，一键部署，全球加速访问。

## 🌟 项目亮点

- **全平台适配**：支持手机、平板、电脑端流畅访问，界面雅致。
- **多维度视图**：
  - **卡片视图**：直观展示成员核心信息（排行、生卒年、配偶、居住地）。
  - **树状视图**：经典的文本缩进式族谱，清晰展现辈分关系。
  - **成员列表**：支持全局搜索与打印，适合大宗数据核对。
  - **关系图表**：基于 D3.js 的动态可视化拓扑图，支持缩放与平移。
- **数据管理**：支持一键导出 Excel (.csv) 和原始 JSON 备份，确保家族资产永不丢失。
- **安全保障**：内置查看密码与编辑密码双重验证。
- **零成本运维**：完全运行在 Cloudflare 免费层级，无需支付任何服务器费用。

## 🚀 快速部署

1. **准备环境**：注册并登录 [Cloudflare](https://dash.cloudflare.com/)。
2. **创建数据库**：
   - 进入 `Workers & Pages` -> `KV`。
   - 创建名为 `MY_NOTES` 的 Namespace。
3. **创建程序**：
   - 创建一个新的 Worker，命名为 `mo-family-tree`。
   - 将本项目中的 `index.js`（或代码框中的代码）粘贴至编辑器。
4. **绑定 KV**：
   - 在 Worker 的 `Settings` -> `Variables` -> `KV Namespace Bindings` 中添加绑定。
   - **Variable name**: `MY_NOTES`
   - **KV namespace**: 选择你刚才创建的 `MY_NOTES`。
5. **完成部署**：保存并发布，访问分配的 `*.workers.dev` 域名即可使用。

## 🛠️ 技术栈

- **Frontend**: HTML5, CSS3 (Flex/Grid), JavaScript (ES6+)
- **Visuals**: [D3.js v7](https://d3js.org/) (用于关系图表渲染)
- **Backend**: [Cloudflare Workers](https://workers.cloudflare.com/) (Serverless)
- **Database**: [Cloudflare KV](https://developers.cloudflare.com/workers/runtime-apis/kv/) (键值对存储)

## 📝 使用说明

- **默认查看密码**：`666`
- **默认编辑密码**：`888`
- **录入技巧**：先点击右下角 `+` 号录入始祖。点击成员卡片进入详情页，点击“录入后代”可自动关联父子关系并自动计算代别。

## 📜 许可证

本项目采用 [MIT License](LICENSE) 开源。仅供家族内部交流使用，请勿用于商业用途。

---
*万代昌盛 · 莫氏宗亲会 敬制*
