# CF Email API

基于 Cloudflare Workers + Email Routing 的自定义域名验证码 API，全程依赖免费服务。

## 功能

- 通过 catch-all 规则接收 `*@yourdomain.com` 所有邮件
- `GET https://xxx.workers.dev/{prefix}/email` → 最新邮件完整 JSON
- `GET https://xxx.workers.dev/{prefix}/code` → 最新验证码纯文本

## 快速部署

### 1. 配置 Cloudflare Email Routing

1. Cloudflare Dashboard → 你的域名 → 电子邮箱 → 电子邮件路由
2. 开启 **Catch-all**，操作选择 **发送至 Worker**
3. 先完成步骤 2 部署 Worker 后再绑定

### 2. 创建 KV Namespace

```bash
wrangler kv namespace create EMAIL_KV
# 将输出的 id 填入 wrangler.toml 的 kv_namespaces.id
```

### 3. 部署

```bash
npm install
wrangler deploy
```

### 4. 绑定 Email Worker

部署完成后，在 Email Routing Catch-all 中选择刚部署的 Worker。

## 使用示例（注册机）

```python
import requests
import time

prefix = "random_" + str(int(time.time()))
email = f"{prefix}@yourdomain.com"

# ... 使用 email 注册账号 ...

# 等待邮件到达后获取验证码
time.sleep(5)
code = requests.get(f"https://xxx.workers.dev/{prefix}/code").text
print(f"验证码: {code}")
```

## 免费额度限制

| 资源 | 免费限制 | 项目影响 |
|------|---------|---------|
| Workers 请求 | 10万/天 | HTTP API 调用 |
| KV 读取 | 10万/天 | GET /email、GET /code |
| **KV 写入** | **1000/天** | **每封邮件 2 次写入，即每天约 500 封** |
| Workers AI 推理 | 1万/天 | 正则失败时的 AI 兜底 |

## 许可证

MIT
