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
wrangler secret put AUTH_TOKEN
# Enter your token when prompted, e.g.: cf-114514-ff
```

Alternatively, configure it via the Cloudflare Dashboard:

> **Cloudflare Dashboard** → **Compute** → **Workers & Pages** → `cf-email-api`
> → **Settings** → **Variables and Secrets**
> → **Add** → Set type to **Secret**, variable name to `AUTH_TOKEN`, and enter your token as the value.

**3. Client Integration Example**

```python
# Method 1: URL query parameter
code = requests.get(
    "https://xxx.workers.dev/random123/code",
    params={"token": "cf_mail_s3cr3t_2026"}
).text

# Method 2: Authorization header
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
if (!authToken) return next(); // Fail-open: allow requests if secret is not set
```

Even when `REQUIRE_AUTH = "true"`, if `AUTH_TOKEN` has **not been provisioned via `wrangler secret put AUTH_TOKEN`**, requests will still pass through. This is an intentional **fail-open** safety mechanism to prevent accidental self-lockout.

### Step 3: Validate the Token Provided by the Client

```typescript
const providedToken =
  c.req.query('token') ||
  c.req.header('Authorization')?.replace('Bearer ', '');
```

Two token delivery methods are supported (**use either one**):

| Method | Example |
|--------|---------|
| **URL Query Parameter** | `GET /random123/code?token=YOUR_TOKEN` |
| **HTTP Authorization Header** | `Authorization: Bearer YOUR_TOKEN` |

If the token is missing or does not match, the Worker returns **HTTP 401 Unauthorized**:

```json
{
  "error": "unauthorized",
  "message": "Invalid or missing authentication token",
  "timestamp": "2026-04-08T15:51:00.000Z"
}
```