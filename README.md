# cash-track

Personal expense tracker powered by a Telegram bot. Send a receipt photo → Vision OCR → DeepSeek parses it → saved to Google Sheets → visible on a SvelteKit dashboard.

## Features

- **Telegram bot** — send a receipt photo, get an automatic reply with parsed details
- **Vision OCR** — Google Cloud Vision extracts text from any receipt image
- **AI parsing** — DeepSeek structures the raw text (merchant, total, items, category, payment method)
- **Google Sheets backend** — all expenses stored in a spreadsheet you own
- **SvelteKit dashboard** — view spending, filter by category, see monthly charts
- **Manual entry** — add expenses via the web form (with per-item breakdown)
- **Dark mode** — toggle in sidebar, remembers your preference
- **Auth** — login-protected dashboard (argon2id password hashing)
- **Demo mode** — works without any env vars for local preview

## Stack

- [SvelteKit 2](https://kit.svelte.dev) + Svelte 5 (runes) · deployed on [Vercel](https://vercel.com)
- [Tailwind CSS v4](https://tailwindcss.com) via `@tailwindcss/vite`
- [Bun](https://bun.sh) as package manager & runtime
- Google Cloud Vision · Google Sheets API · DeepSeek API · Telegram Bot API

---

## Setup

### 1. Clone & install

```bash
git clone https://github.com/your-username/cash-track
cd cash-track
bun install
```

### 2. Google Spreadsheet

1. Create a new Google Spreadsheet.
2. On row 1, add these **13 headers** in order (exact spelling matters):

```
timestamp  date  merchant  total  currency  category  payment_method  items  photo_url  raw_text  source  user  notes
```

3. Copy the spreadsheet **ID** from the URL:
   `https://docs.google.com/spreadsheets/d/`**`<SHEET_ID>`**`/edit`

### 3. Google Service Account

1. Go to [Google Cloud Console](https://console.cloud.google.com) → create or select a project.
2. Enable **Google Sheets API** and **Cloud Vision API**.
3. Create a **Service Account** → generate a JSON key.
4. Share the spreadsheet with the service account email (give **Editor** access).
5. Convert the JSON key to a single line (or base64) for the env var:
   ```bash
   # single-line JSON (remove all newlines):
   cat service-account.json | tr -d '\n'
   # or base64:
   base64 -w 0 service-account.json
   ```

### 4. Telegram Bot

1. Message [@BotFather](https://t.me/BotFather) → `/newbot` → copy the **token**.
2. Choose a **random secret token** (e.g. `openssl rand -hex 32`) — used to validate webhook calls.
3. Get your **Telegram user ID** (message [@userinfobot](https://t.me/userinfobot)) and add it to `TELEGRAM_ALLOWED_IDS`.

   > **Important:** leave `TELEGRAM_ALLOWED_IDS` empty and the bot accepts messages from *anyone*. Always set it before going public.

### 5. DeepSeek API

Sign up at [platform.deepseek.com](https://platform.deepseek.com) and copy your API key.

### 6. Environment variables

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

```env
TELEGRAM_BOT_TOKEN=         # from @BotFather
TELEGRAM_SECRET_TOKEN=      # random string you chose
TELEGRAM_ALLOWED_IDS=       # comma-separated Telegram user IDs (e.g. 12345678,98765432)

DEEPSEEK_API_KEY=

GOOGLE_SERVICE_ACCOUNT=     # single-line JSON or base64
GOOGLE_SHEET_ID=
GOOGLE_SHEET_TAB=Sheet1
MONTHLY_BUDGET=9500000      # optional, shown in dashboard budget gauge

AUTH_USERNAME=your-username
AUTH_PASSWORD_HASH=         # see step 7 below
SESSION_SECRET=             # random string >=32 chars
```

> **Never commit `.env`** — only `.env.example` belongs in the repo.

### 7. Generate password hash

```bash
bun scripts/hash-password.js 'your-password'
```

Copy the printed `$argon2id$...` hash into `AUTH_PASSWORD_HASH`.

### 8. Run locally

```bash
bun run dev
```

Visit `http://localhost:5173`. Without env vars the dashboard runs in **demo mode** (no auth required, sample data shown).

---

## Deploy to Vercel

1. Push this repo to GitHub.
2. In [Vercel](https://vercel.com/new), import the repo.
3. Set all env vars from step 6 in **Project → Settings → Environment Variables**.
4. Deploy.

### Register the Telegram webhook (one-time)

After deploy, run this once (replace the placeholders):

```
https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook
  ?url=https://<your-app>.vercel.app/api/telegram
  &secret_token=<TELEGRAM_SECRET_TOKEN>
```

Paste it in your browser or use `curl`. Telegram will confirm `{"ok":true}`.

---

## Multi-user (optional)

By default, one user is configured via `AUTH_USERNAME` / `AUTH_PASSWORD_HASH`. To add more users, use `AUTH_USERS` (overrides the single-user env vars):

```env
AUTH_USERS=[{"u":"alice","h":"$argon2id$..."},{"u":"bob","h":"$argon2id$..."}]
```

Generate each hash with:
```bash
bun scripts/hash-password.js 'password-for-alice'
bun scripts/hash-password.js 'password-for-bob'
```

> In a `.env` file, if a hash contains `$` characters, wrap the value in **single quotes** or escape each `$` as `\$`. In the Vercel dashboard, paste as-is (no escaping needed).

---

## Categories

Fixed categories used by both the bot and the manual form:

`Makanan` · `Belanja` · `Transport` · `Tagihan` · `Kesehatan` · `Hiburan` · `Lainnya`

DeepSeek is instructed to always pick one of these; unrecognised expenses fall back to `Lainnya`.

---

## License

MIT
