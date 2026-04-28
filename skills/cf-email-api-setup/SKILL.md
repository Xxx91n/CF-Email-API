---
name: cf-email-api-setup
description: "Use when setting up, deploying, or configuring the CF Email API project — a Cloudflare Workers-based email verification code API. Triggers on: deploy CF Email API, setup email verification, configure Cloudflare Workers, create KV namespace, setup Email Routing, configure whitelist/blacklist filter, update wrangler.toml, install dependencies, or troubleshoot deployment issues."
compatibility:
  - OS: macOS, Linux, Windows
  - Node.js: ">=18"
  - Wrangler: ">=3"
  - Cloudflare Account with Email Routing enabled
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
---

# CF Email API Setup

Deploy and configure a Cloudflare Workers-based email verification code API that receives emails via Email Routing and extracts verification codes via HTTP API.

## When to Use

- User says "deploy CF Email API" or "setup email verification API"
- User needs to configure Cloudflare Workers with Email Routing
- User wants to create KV namespace for email storage
- User asks about whitelist/blacklist filter configuration
- User needs help with wrangler.toml configuration
- **Not for**: Modifying extraction algorithms, debugging code logic

## Quick Reference

| Task | Command/Method |
|------|---------------|
| Install dependencies | `npm install` |
| Login to Cloudflare | `npx wrangler login` or set `CLOUDFLARE_API_TOKEN` |
| Create KV namespace | `npx wrangler kv namespace create EMAIL_KV` |
| Deploy Worker | `npx wrangler deploy` |
| Verify deployment | `curl https://<worker-url>/` |
| View logs | `npx wrangler tail` |

## Installation & Setup

**DONE WHEN:** Worker is accessible at `https://<worker-name>.<subdomain>.workers.dev` and returns `{"status":"ok"}` on GET `/`

### Prerequisites

1. **Cloudflare Account** (free tier works)
   - Sign up at https://dash.cloudflare.com/sign-up

2. **Domain on Cloudflare**
   - Add domain: Dashboard → Domains → Add Domain
   - Update nameservers at your registrar

3. **API Token** (for CI/CD or headless deployment)
   - Create at: https://dash.cloudflare.com/profile/api-tokens
   - Use template: "Edit Cloudflare Workers"
   - Permissions: `Account.Workers Scripts:Edit`
   - Resources: All accounts, All zones

### Step 1: Get the Code

```bash
git clone https://github.com/Xxx91n/CF-Email-API.git
cd CF-Email-API
npm install
```

### Step 2: Authenticate with Cloudflare

**Option A: Browser Login (interactive)**
```bash
npx wrangler login
```

**Option B: API Token (headless/CI)**
```bash
export CLOUDFLARE_API_TOKEN="your-token-here"
```

### Step 3: Create KV Namespace

```bash
npx wrangler kv namespace create EMAIL_KV
```

**DONE WHEN:** Output shows `id = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"`

Copy this id into `wrangler.toml`:
```toml
[[kv_namespaces]]
binding = "EMAIL_KV"
id = "your-kv-namespace-id-here"
```

### Step 4: Deploy

```bash
npx wrangler deploy
```

**DONE WHEN:** Output shows `Deployed cf-email-api triggers` with your Worker URL.

### Step 5: Configure Email Routing

1. Cloudflare Dashboard → Your Domain → Email → Email Routing
2. Enable Email Routing if not already
3. Go to Routing Rules → Catch-all → Edit
4. Action: **Send to a Worker**
5. Destination: Select `cf-email-api`
6. Save

**DONE WHEN:** Sending test email to `anything@yourdomain.com` returns verification code via API.

## Configuration

### Environment Variables (wrangler.toml)

| Variable | Default | Description |
|----------|---------|-------------|
| `DEFAULT_TTL` | `600` | Email storage TTL in seconds |
| `DEFAULT_TTL_UNIT` | `seconds` | TTL unit: `seconds`, `minutes`, `hours`, `days` |
| `ENABLE_AI` | `true` | Enable AI fallback for code extraction |
| `REQUIRE_AUTH` | `false` | Require API token for access |
| `FILTER_MODE` | `none` | Filter mode: `none`, `whitelist`, `blacklist` |
| `FILTER_LIST` | `""` | Comma-separated domains (e.g., `@openai.com,@github.com`) |

### Filter Mode Examples

**Whitelist (only accept from listed domains):**
```toml
FILTER_MODE = "whitelist"
FILTER_LIST = "@openai.com,@github.com,@x.ai"
```

**Blacklist (block listed domains):**
```toml
FILTER_MODE = "blacklist"
FILTER_LIST = "@spam.com,@trash.net"
```

## Common Mistakes

| Error | Cause | Fix |
|-------|-------|-----|
| `KV namespace not found` | Missing or wrong KV ID | Run `wrangler kv namespace create EMAIL_KV` and update `wrangler.toml` |
| `Worker not receiving emails` | Email Routing not bound | Check Dashboard → Email Routing → Catch-all → Worker selection |
| `404 on /code` | No email received yet | Send test email and wait 5-10 seconds |
| `Authentication failed` | Invalid API token | Regenerate token at dash.cloudflare.com/profile/api-tokens |
| `wrangler: command not found` | Dependencies not installed | Run `npm install` |

## Gotchas

- **KV Write Limit**: Free tier = 1,000 writes/day. Each email = 2 writes. That's ~500 emails/day max.
- **Email Delay**: Cloudflare Email Routing may take 5-15 seconds to deliver.
- **AI Fallback**: Uses `@cf/meta/llama-3.3-70b-instruct-fp8-fast`. Free tier = 10,000 inferences/day.
- **Domain Required**: You MUST own a domain added to Cloudflare. Cannot use `workers.dev` subdomain for email.
- **Email Routing Setup**: Must complete domain onboarding (MX records) before Catch-all works.

## API Usage

After deployment:
```
GET https://<worker-url>/<email-prefix>/code    → verification code (plain text)
GET https://<worker-url>/<email-prefix>/email   → full email JSON
GET https://<worker-url>/                       → health check
```

Example:
```bash
# Get verification code
curl https://cf-email-api.example.workers.dev/test123/code

# Get full email
curl https://cf-email-api.example.workers.dev/test123/email
```

***
> Repository: https://github.com/Xxx91n/CF-Email-API
> Cloudflare Docs: https://developers.cloudflare.com/email-routing/
