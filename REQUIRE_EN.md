# Authentication Setup Guide

**English** | [**简体中文**](./REQUIRE.md)

**1. Enable Authentication in `wrangler.toml`**

```toml
[vars]
REQUIRE_AUTH = "true"
# Note: Do NOT store AUTH_TOKEN under [vars] (plaintext exposure).
# It must be configured as a secret (encrypted at rest).
```

**2. Set the Token via Wrangler Secret (Encrypted Storage)**

```bash
npx wrangler secret put AUTH_TOKEN
# Enter your token when prompted, e.g.: cf-114514-ff
```

Alternatively, configure it via the Cloudflare Dashboard:

> **Cloudflare Dashboard** → **Compute** → **Workers & Pages** → `cf-email-api`
> → **Settings** → **Variables and Secrets**
> → **Add** → Set type to **Secret**, variable name to `AUTH_TOKEN`, and enter your token as the value.

**3. Client Integration Example**

```python
code = requests.get(
    "https://xxx.workers.dev/random123/code",
    headers={"Authorization": "Bearer cf_mail_s3cr3t_2026"}
).text
```

---

# Deep Dive: Authentication Middleware Flow (`REQUIRE_AUTH = "true"`)

When authentication is enabled, the middleware executes three sequential checks on every incoming request:

### Step 1: Check Whether Authentication Is Enabled

```typescript
const requireAuth = c.env.REQUIRE_AUTH === 'true';
if (!requireAuth) return next(); // Bypass auth entirely
```

Authentication is only enforced when `REQUIRE_AUTH` is explicitly set to `"true"` in `wrangler.toml`. All requests are allowed through unconditionally otherwise.

### Step 2: Verify the Server-Side Secret Is Configured

```typescript
const authToken = c.env.AUTH_TOKEN;
if (!authToken) {
  // Fail-closed: every request fails until the secret is provisioned
  return c.json(
    { error: 'unauthorized', message: 'Authentication not configured' },
    500
  );
}
```

Even when `REQUIRE_AUTH = "true"`, if `AUTH_TOKEN` has **not been provisioned via `npx wrangler secret put AUTH_TOKEN`**, every request fails with **HTTP 500 "Authentication not configured"**. The middleware is **fail-closed**: it never serves traffic while the secret is missing.

### Step 3: Validate the Token Provided by the Client

```typescript
const providedToken =
  c.req.header('Authorization')?.replace('Bearer ', '');
```

Only one token delivery method is supported:

| Method | Example |
|--------|---------|
| **HTTP Authorization Header** | `Authorization: Bearer YOUR_TOKEN` |

If the token is missing or does not match, the Worker returns **HTTP 401 Unauthorized**:

```json
{
  "error": "unauthorized",
  "message": "Invalid or missing authentication token",
  "timestamp": "2026-04-08T15:51:00.000Z"
}
```