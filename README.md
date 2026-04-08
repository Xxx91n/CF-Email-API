# CF Email API

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/Xxx91n/CF-Email-API)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-F38020?logo=cloudflare&logoColor=white)](https://workers.cloudflare.com/)

基于 Cloudflare Workers + Email Routing 的自定义域名验证码 API，全程依赖免费服务。

专为注册机/自动化脚本设计，无需认证，一个 GET 请求直取验证码。

## ✨ 功能特性

- 📧 通过 catch-all 规则接收 `*@yourdomain.com` 所有邮件
- 🔍 正则 + AI 混合验证码提取（支持中/英/日/韩多语言）
- 🚀 极简 HTTP API，无需认证
- ⏱️ 可配置 TTL，自动过期清理
- 💾 KV 存储，免费额度每天可处理 ~500 封邮件
- 🤖 Workers AI 智能兜底，提高验证码提取准确率

## 📋 API 端点

| 端点 | 方法 | 描述 | 返回格式 |
|------|------|------|----------|
| `/{prefix}/email` | GET | 获取最新邮件完整内容 | JSON |
| `/{prefix}/code` | GET | 获取最新验证码 | 纯文本 |
| `/` | GET | 健康检查 | JSON |

## 🚀 快速部署

### 方式一：一键部署（推荐）

点击下方按钮，自动 Fork 并部署：

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/Xxx91n/CF-Email-API)

### 方式二：手动部署

#### 1. 克隆项目

```bash
git clone https://github.com/Xxx91n/CF-Email-API.git
cd CF-Email-API
npm install
```

#### 2. 登录 Cloudflare

```bash
npx wrangler login
```

#### 3. 创建 KV Namespace

```bash
npx wrangler kv namespace create EMAIL_KV
# 将输出的 id 填入 wrangler.toml
```

#### 4. 部署

```bash
npx wrangler deploy
```

#### 5. 配置 Email Routing

1. Cloudflare Dashboard → 你的域名 → 电子邮箱 → 电子邮件路由
2. 开启 **Catch-all**，操作选择 **发送至 Worker**
3. 选择已部署的 `cf-email-api` Worker
4. 保存

## 📖 使用示例

### 注册机集成（Python）

```python
import requests
import time
import random
import string

# 生成随机邮箱前缀
prefix = ''.join(random.choices(string.ascii_lowercase + string.digits, k=8))
email = f"{prefix}@yourdomain.com"

# 使用邮箱注册账号
# ... 你的注册逻辑 ...

# 等待邮件到达
time.sleep(5)

# 获取验证码
code = requests.get(f"https://your-worker.workers.dev/{prefix}/code").text
print(f"验证码: {code}")
```

### cURL 测试

```bash
# 获取验证码
curl https://your-worker.workers.dev/test123/code

# 获取完整邮件
curl https://your-worker.workers.dev/test123/email
```

## ⚙️ 配置选项

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `DEFAULT_TTL` | `600` | 邮件过期时间（秒） |
| `DEFAULT_TTL_UNIT` | `seconds` | TTL 单位 |
| `ENABLE_AI` | `true` | 是否启用 AI 兜底提取 |
| `REQUIRE_AUTH` | `false` | 是否需要认证 |

## 📊 免费额度限制

| 资源 | 免费限制 | 项目影响 |
|------|---------|---------|
| Workers 请求 | 10万/天 | HTTP API 调用 |
| KV 读取 | 10万/天 | GET /email、GET /code |
| **KV 写入** | **1000/天** | **每封邮件 2 次写入，即每天约 500 封** |
| Workers AI 推理 | 1万/天 | 正则失败时的 AI 兜底 |

> 💡 如需更高吞吐，可升级至 Workers Paid（$5/月），写入限额变为 100 万次/月

## 🔧 支持的验证码格式

- ✅ 英文：`Verification code: 123456`、`Your code is 123456`、`OTP: 123456`
- ✅ 中文：`验证码：123456`、`一次性密码：123456`、`动态验证码：847291`
- ✅ 日文：`認証コード：123456`
- ✅ 韩文：`인증번호: 123456`
- ✅ 分组格式：`1 2 3 4 5 6`、`123-456`
- ✅ AI 语义理解兜底

## 📝 技术栈

- **运行时**: Cloudflare Workers
- **框架**: Hono v4
- **语言**: TypeScript
- **存储**: Cloudflare KV
- **AI**: Workers AI (llama-3.3-70b-instruct-fp8-fast)
- **邮件解析**: postal-mime

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

[MIT](LICENSE)

## 🙏 致谢

- [Hono](https://hono.dev/) - 轻量级 Web 框架
- [postal-mime](https://postal-mime.postalsys.com/) - MIME 解析库
- [Cloudflare Workers](https://workers.cloudflare.com/) - Serverless 平台
