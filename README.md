<div align="center">
<h1 align="center">CF Email API</h1>

[**English**](./README_EN.md) | **简体中文**

<p align="center">
<a href="https://github.com/Xxx91n/CF-Email-API/blob/main/LICENSE" target="_self">
 <img alt="Latest GitHub release" src="https://img.shields.io/badge/License-MIT-yellow.svg" />
</a>
<a href="https://workers.cloudflare.com/" target="_self">
 <img alt="Cloudflare Workers" src="https://img.shields.io/badge/Cloudflare-Workers-F38020?logo=cloudflare&logoColor=white" />
</a>

基于 Cloudflare Workers + Email Routing 的自定义域名邮笱验证码 API，全程依赖免费服务。

专为个人注册机/自动化脚本设计，无需复杂鉴权，一个 GET 请求直取验证码。

*⚠注意：该项目仅个人使用，不支持高并发场景，请在合法场景内使用，作者不承担任何法律责任！*
</p>
</div>


## 功能特性

- 通过 catch-all 规则接收 `*@yourdomain.com` 所有邮件
- 正则 + AI 混合验证码提取（支持中/英/日/韩多语言）
- 极简 HTTP API，无需复杂认证
- 可配置 TTL，自动过期清理
- KV 存储，免费额度每天可处理 ~500 封邮件
- Workers AI 智能底底，提高验证码提取准确率

## API 端点

| 端点 | 方法 | 描述 | 返回格式 |
|------|------|------|----------|
| `/{prefix}/email` | GET | 获取最新邮件完整内容 | JSON |
| `/{prefix}/code` | GET | 获取最新验证码 | 纯文本 |
| `/` | GET | 健康检查 | JSON |

## 部署

### 方式一：快速部署（推荐）

点击下方按鈕，自动 Fork 并部署：

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/Xxx91n/CF-Email-API)

```bash
# Select KV 命名空间 必须填入：
EMAIL_KV
```

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
# 将输出的 id 填入 wrangler.toml，同时可自定义修改参数
```

#### 4. 部署

```bash
npx wrangler deploy
```

### 配置 cloudflare Email Routing

1. Cloudflare Dashboard → Domains → Overview → 加入域 ，添加你的域名，并自动部署DNS。
2. Cloudflare Dashboard → 计算 → 电子邮件服务 → 电子邮件路由 → + Onboard Domain。
3. 选择你的域名，Routing Rules → 开启 **Catch-all**，并编辑，操作选择 Action : **Send to a Worker**，Destination 选择已部署的 `cf-email-api` Worker。
4. 保存

### 配置 同步上游更新时，自动更新你的 Workers
在 GitHub 仓库中添加 `CLOUDFLARE_API_TOKEN` 

1. 登录 [**dash Cloudflare**](https://dash.cloudflare.com/) ，选择 "[**API 令牌**](https://dash.cloudflare.com/profile/api-tokens)" 选项卡，点击 “创建令牌” 。
3. 使用模板“编辑 Cloudflare Workers”，确保权限 `Account.Workers Scripts:Edit`，资源限制选择“所有账户”和“所有区域”，然后创建令牌。
4. 复制生成的 API 令牌（仅显示一次，请妥善保存）。
5. 打开 GitHub 仓库页面，进入 **Settings > Secrets and variables > Actions**。
6. 点击右侧 **New repository secret** 按鈕。
7. 在 **Name** 输入框中输入 `CLOUDFLARE_API_TOKEN`（名称需与部署脚本中引用的一致）。
8. 在 **Secret** 输入框中粘贴之前复制的 Cloudflare API 令牌。
9. 点击 **Add secret** 完成添加。 

此后，GitHub Actions 工作流即可通过 `${{ secrets.CLOUDFLARE_API_TOKEN }}` 引用该密鑰，实现自动化部署更新。


## 参数配置选项

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `DEFAULT_TTL` | `600` | 邮件过期时间（秒） |
| `DEFAULT_TTL_UNIT` | `seconds` | TTL 单位（其余支持的参数：minutes、hours、days） |
| `ENABLE_AI` | `true` | 是否启用 AI 兜底提取 |
| `REQUIRE_AUTH` | `false` | 是否需要认证 |
| `FILTER_MODE` | `none` | 发件人过滤模式（none/whitelist/blacklist） |
| `FILTER_LIST` | `""` | 过滤列表，逗号分隔的域名（如 `@openai.com,@github.com`） |

>若配置 REQUIRE_AUTH 为 true ，查看后续配置 [**文档**](./REQUIRE.md)

### 发件人过滤模式说明

| 模式 | 说明 | 使用场景 |
|------|------|----------|
| `none` | 不过滤，接收所有邮件（默认） | 调试、全开放使用 |
| `whitelist` | 仅接收列表中域名的邮件 | 限制只接收特定服务商邮件，杜绝垃圾邮件 |
| `blacklist` | 拒收列表中域名的邮件 | 屏蔽特定垃圾邮件来源 |

**配置示例（wrangler.toml）：**

```toml
# 白名单模式：只接收 OpenAI 和 Grok 的邮件
FILTER_MODE = "whitelist"
FILTER_LIST = "@openai.com,@x.ai"

# 黑名单模式：拒收特定域名
FILTER_MODE = "blacklist"
FILTER_LIST = "@spam.com,@trash.net"
```


## 简易使用示例

### 注册机集成（Python）

```python
import requests
import time
import random
import string

# 生成随机邮笱前缀
prefix = ''.join(random.choices(string.ascii_lowercase + string.digits, k=8))
email = f"{prefix}@yourdomain.com"

# 使用邮笱注册账号
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
curl https://your-worker.workers.dev/{prefix}/code

# 获取完整邮件
curl https://your-worker.workers.dev/{prefix}/email
```


## 免费额度限制

| 资源 | 免费限制 | 项目影响 |
|------|---------|---------|
| Workers 请求 | 10万/天 | HTTP API 调用 |
| KV 读取 | 10万/天 | GET /email、GET /code |
| **KV 写入** | **1000/天** | **每封邮件 2 次写入，即每天约 500 封** |
| Workers AI 推理 | 1万/天 | 正则失败时的 AI 底底 |

> 如需更高吸吐，可升级至 Workers Paid（5$/月），写入限额变为 100 万次/月

## 支持的验证码格式

### 纯数字验证码
- 英文：`Verification code: 123456`、`Your code is 123456`、`OTP: 123456`
- 中文：`验证码：123456`、`一次性密码：123456`、`动态验证码：847291`
- 日文：`認証コード：123456`
- 韩文：`인증번호: 123456`
- 分组格式：`1 2 3 4 5 6`、`123-456`

### 字母数字混合验证码
- GitHub 风格：`A3F9K2`（6-10位字母数字混合）
- API 密鑰风格：`X7Yz9AbC`（大小写混合）

### URL 参数验证码
- 链接参数：`?code=847291`、`?token=A1B2C3`
- 验证链接：`https://example.com/verify?code=ABC123`

### AI 语义理解底底
- 正则匹配失败时自动调用 Workers AI 提取

## 已验证支持的平台

- OpenAI
- Grok

## 技术栈

- **运行时**: Cloudflare Workers
- **框架**: Hono v4
- **语言**: TypeScript
- **存储**: Cloudflare KV
- **AI**: Workers AI (llama-3.3-70b-instruct-fp8-fast)
- **邮件解析**: postal-mime

## 贡献

提交 [issue](https://github.com/Xxx91n/CF-Email-API/issues) 或 [PR](https://github.com/Xxx91n/CF-Email-API/pulls)。

## 许可证

[MIT](LICENSE)

## 致谢

- [Hono](https://hono.dev/) - 轻量级 Web 框架
- [postal-mime](https://postal-mime.postalsys.com/) - MIME 解析库
- [temp-email](https://github.com/TonnyWong1052/temp-email) -  参考 TonnyWong1052 的项目得到更完整的验证码处理机制，感谢！
- [Cloudflare Workers](https://workers.cloudflare.com/)
