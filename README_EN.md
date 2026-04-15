<div align="center">
<h1 align="center">CF Email API</h1>

**English** | [**简体中文**](./README.md)

<p align="center">
<a href="https://github.com/Xxx91n/CF-Email-API/blob/main/LICENSE" target="_self">
<img alt="MIT License" src="https://img.shields.io/badge/License-MIT-yellow.svg" />
</a>
<a href="https://workers.cloudflare.com/" target="_self">
<img alt="Cloudflare Workers" src="https://img.shields.io/badge/Cloudflare-Workers-F38020?logo=cloudflare&logoColor=white" />
</a>

A custom domain email verification code API based on Cloudflare Workers + Email Routing, fully relying on free services.

Designed for personal registration bots/automation scripts, no complex authentication required, just one GET request to get the verification code.

*⚠Note: This project is for personal use only, high concurrency scenarios are not supported. Please use it in legal scenarios, the author assumes no legal responsibility!*
</p>
</div>

## Features

- Receive all emails via catch-all rule `*@yourdomain.com`
- Regex + AI hybrid verification code extraction (supports Chinese/English/Japanese/Korean)
- Simple HTTP API, no complex authentication
- Configurable TTL, automatic expiration cleanup
- KV storage, free tier can handle ~500 emails/day
- Workers AI intelligent fallback, improves verification code extraction accuracy

## API Endpoints

| Endpoint | Method | Description | Response Format |
|----------|--------|-------------|-----------------|
| `/{prefix}/email` | GET | Get latest email full content | JSON |
| `/{prefix}/code` | GET | Get latest verification code | Plain Text |
| `/` | GET | Health check | JSON |

## Deployment

### Option 1: Quick Deploy (Recommended)

Click the button below to auto-fork and deploy:

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/Xxx91n/CF-Email-API)

```bash
# Select KV namespace, must enter:
EMAIL_KV
```

### Option 2: Manual Deploy

#### 1. Clone Project

```bash
git clone https://github.com/Xxx91n/CF-Email-API.git
cd CF-Email-API
npm install
```

#### 2. Login to Cloudflare

```bash
npx wrangler login
```

#### 3. Create KV Namespace

```bash
npx wrangler kv namespace create EMAIL_KV
# Put the output id into wrangler.toml, customize parameters as needed
```

#### 4. Deploy

```bash
npx wrangler deploy
```

### Configure Cloudflare Email Routing

1. Cloudflare Dashboard → Domains → Overview → Add Domain, add your domain, DNS auto-deployed.
2. Cloudflare Dashboard → Compute → Email → Email Routing → + Onboard Domain.
3. Select your domain, Routing Rules → Enable **Catch-all**, edit it, Action: **Send to a Worker**, Destination: select deployed `cf-email-api` Worker.
4. Save

### Configure Auto-Update on Upstream Sync

Add `CLOUDFLARE_API_TOKEN` in GitHub repository:

1. Login to [**Cloudflare Dashboard**](https://dash.cloudflare.com/), select "[**API Tokens**](https://dash.cloudflare.com/profile/api-tokens)" tab, click "Create Token".
2. Use template "Edit Cloudflare Workers", ensure permission `Account.Workers Scripts:Edit`, resource limits: "All accounts" and "All zones", then create token.
3. Copy the generated API token (shown only once, save it securely).
4. Open GitHub repository page, go to **Settings > Secrets and variables > Actions**.
5. Click **New repository secret** button.
6. In **Name** input, enter `CLOUDFLARE_API_TOKEN` (must match deployment script).
7. In **Secret** input, paste the Cloudflare API token.
8. Click **Add secret** to complete.

Now GitHub Actions workflow can reference this secret via `${{ secrets.CLOUDFLARE_API_TOKEN }}` for automated deployment updates.

## Configuration Options

| Variable | Default | Description |
|----------|---------|-------------|
| `DEFAULT_TTL` | `600` | Email expiration time (seconds) |
| `DEFAULT_TTL_UNIT` | `seconds` | TTL unit (also supports: minutes, hours, days) |
| `ENABLE_AI` | `true` | Enable AI fallback extraction |
| `REQUIRE_AUTH` | `false` | Require authentication |
| `FILTER_MODE` | `none` | Sender filter mode (none/whitelist/blacklist) |
| `FILTER_LIST` | `""` | Filter list, comma-separated domains (e.g. `@openai.com,@github.com`) |

> **If REQUIRE_AUTH is true, see [**document**](./REQUIRE_EN.md)**.

### Sender Filter Mode

| Mode | Description | Use Case |
|------|-------------|----------|
| `none` | No filter, accept all emails (default) | Debugging, open use |
| `whitelist` | Only accept emails from listed domains | Limit to specific providers, block spam |
| `blacklist` | Reject emails from listed domains | Block specific spam sources |

**Configuration Example (wrangler.toml):**

```toml
# Whitelist mode: only accept OpenAI and Grok emails
FILTER_MODE = "whitelist"
FILTER_LIST = "@openai.com,@x.ai"

# Blacklist mode: reject specific domains
FILTER_MODE = "blacklist"
FILTER_LIST = "@spam.com,@trash.net"
```

## Usage Examples

### Bot Integration (Python)

```python
import requests
import time
import random
import string

# Generate random email prefix
prefix = ''.join(random.choices(string.ascii_lowercase + string.digits, k=8))
email = f"{prefix}@yourdomain.com"

# Use email to register account
# ... your registration logic ...

# Wait for email arrival
time.sleep(5)

# Get verification code
code = requests.get(f"https://your-worker.workers.dev/{prefix}/code").text
print(f"Verification code: {code}")
```

### cURL Test

```bash
# Get verification code
curl https://your-worker.workers.dev/{prefix}/code

# Get full email
curl https://your-worker.workers.dev/{prefix}/email
```

## Free Tier Limits

| Resource | Free Limit | Project Impact |
|----------|------------|----------------|
| Workers Requests | 100k/day | HTTP API calls |
| KV Reads | 100k/day | GET /email, GET /code |
| **KV Writes** | **1000/day** | **2 writes per email, ~500 emails/day** |
| Workers AI Inference | 10k/day | AI fallback when regex fails |

> For higher throughput, upgrade to Workers Paid ($5/month), write limit becomes 1M/month

## Supported Verification Code Formats

### Numeric Codes
- English: `Verification code: 123456`, `Your code is 123456`, `OTP: 123456`
- Chinese: `验证码：123456`, `一次性密码：123456`, `动态验证码：847291`
- Japanese: `認証コード：123456`
- Korean: `인증번호: 123456`
- Grouped format: `1 2 3 4 5 6`, `123-456`

### Alphanumeric Codes
- GitHub style: `A3F9K2` (6-10 character alphanumeric)
- API key style: `X7Yz9AbC` (mixed case)

### URL Parameter Codes
- Link parameters: `?code=847291`, `?token=A1B2C3`
- Verification links: `https://example.com/verify?code=ABC123`

### AI Semantic Fallback
- Workers AI automatically extracts when regex fails

## Verified Platforms

- OpenAI
- Grok

## Tech Stack

- **Runtime**: Cloudflare Workers
- **Framework**: Hono v4
- **Language**: TypeScript
- **Storage**: Cloudflare KV
- **AI**: Workers AI (llama-3.3-70b-instruct-fp8-fast)
- **Email Parsing**: postal-mime

## Contributing

Submit an [issue](https://github.com/Xxx91n/CF-Email-API/issues) or [PR](https://github.com/Xxx91n/CF-Email-API/pulls).

## License

[MIT](LICENSE)

## Acknowledgments

- [Hono](https://hono.dev/) - Lightweight Web Framework
- [postal-mime](https://postal-mime.postalsys.com/) - MIME Parser Library
- [temp-email](https://github.com/TonnyWong1052/temp-email) - Referenced TonnyWong1052's project for more complete verification code handling mechanism, thanks!
- [Cloudflare Workers](https://workers.cloudflare.com/)
