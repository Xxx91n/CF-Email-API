# 完整配置步骤
[**English**](./REQUIRE_EN.md) | **简体中文**

**1. `wrangler.toml` 开启鉴权**
```toml
[vars]
REQUIRE_AUTH = "true"
# 注意：AUTH_TOKEN 不能放在 [vars] 里（明文暴露），必须用 secret
```

**2. 通过 Secret 设置 Token（加密存储）**
```bash
wrangler secret put AUTH_TOKEN
# 输入你的 Token，例如：cf-114514-ff
或者
Cloudflare Dashboard → 计算 → Workers & Pages → cf-email-api → 设置 → 变量和机密
→ 添加 → 类型选择"密钥"，变量名称填写"AUTH_TOKEN"，值填写你的 Token。
```

**3. 注册机调用方式**
```python
# 方式一：URL 参数
code = requests.get(
    "https://xxx.workers.dev/random123/code",
    params={"token": "cf_mail_s3cr3t_2026"}
).text

# 方式二：Header
code = requests.get(
    "https://xxx.workers.dev/random123/code",
    headers={"Authorization": "Bearer cf_mail_s3cr3t_2026"}
).text
```

***
# 解析：`REQUIRE_AUTH = "true"` 时的验证流程

 中间件按以下顺序执行三步检查：

### 第一步：检查是否启用鉴权

```typescript
const requireAuth = c.env.REQUIRE_AUTH === 'true';
if (!requireAuth) return next(); // 直接放行
```

只有 `wrangler.toml` 中 `REQUIRE_AUTH = "true"` 时才进入鉴权流程，否则所有请求无条件放行。

### 第二步：检查服务端是否配置了 Token

```typescript
const authToken = c.env.AUTH_TOKEN;
if (!authToken) return next(); // 兜底：Token 未配置也放行
```

即使 `REQUIRE_AUTH = "true"`，如果你**没有通过 `wrangler secret put AUTH_TOKEN` 设置 Token**，请求依然会被放行。这是一个安全兜底设计，防止锁死自己。

### 第三步：校验请求携带的 Token

```typescript
const providedToken =
  c.req.query('token') ||
  c.req.header('Authorization')?.replace('Bearer ', '');
```

支持两种传 Token 方式（**二选一即可**）：

| 方式 | 示例 |
|------|------|
| **URL 查询参数** | `GET /random123/code?token=你的TOKEN` |
| **HTTP Header** | `Authorization: Bearer 你的TOKEN` |

Token 不匹配或缺失时，返回 **HTTP 401**：
```json
{
  "error": "unauthorized",
  "message": "Invalid or missing authentication token",
  "timestamp": "2026-04-08T15:51:00.000Z"
}
```