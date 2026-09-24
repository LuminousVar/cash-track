# cash-track

Personal expense tracker powered by a Telegram bot. Send a receipt photo to the bot. Vision OCR reads it, DeepSeek parses it, and the result is saved to Google Sheets and shown on a SvelteKit dashboard.

> Built for a single user (or a small household). Self-hosted on Vercel, data lives in your own Google Sheet.

## Features

- **Telegram bot**: send a receipt photo, get an automatic reply with parsed details (merchant, total, category, items)
- **Vision OCR**: Google Cloud Vision extracts text from any receipt image
- **AI parsing**: DeepSeek (`deepseek-v4`) structures the raw text into clean JSON
- **Google Sheets backend**: all expenses stored in a spreadsheet you own and control
- **SvelteKit dashboard**: monthly chart, category breakdown, recent transactions, spending summary
- **Manual entry**: add expenses via the web form with per-item breakdown (name, qty, price)
- **Edit & delete**: fix a misread receipt from the dashboard, or undo the last entry straight from Telegram with `/hapus`
- **Item-level detail**: expand any transaction to see the parsed line items, and search across them
- **Budget management**: set a monthly limit, track progress with a visual gauge, view 12-month history
- **Budget alerts via Telegram**: get a notification when spending hits a configurable warning threshold (default 80%) and again when the budget is exceeded
- **Smart insight card**: rule-based analysis on the dashboard: spending status, trend vs last month, top category, and end-of-month projection
- **In-app settings**: configure all API keys and tokens directly from the `/pengaturan` page without touching env files
- **Dark mode**: toggle in the page header, remembers your preference
- **Auth**: login-protected dashboard with argon2id password hashing and signed session cookies
- **Demo mode**: works without any env vars for local preview (sample data shown)

## Why no database?

Most projects like this reach for Supabase, Neon, PlanetScale, or some other managed database the moment data needs to be stored. For a single-user expense tracker, that means creating accounts, managing connection strings, worrying about free tier limits, and dealing with cold start latency on every serverless invocation.

cash-track skips all of that. **Google Sheets is the database.** One row per expense, 14 columns, fully human-readable. You can open the spreadsheet, filter by month, edit a typo, export to CSV, or share it with someone, all without any tooling or SQL knowledge. The Sheets API is free within Google's generous quota and runs entirely on infrastructure you already have.

No ORM. No migrations. No connection pooling. No database URL to rotate. No paid plan that kicks in after 500MB. Your data lives in a file you own, not in a vendor's cloud you rent.

There is also a privacy angle. Expense data is personal. It tells a story about where you eat, what you buy, how you spend your money every day. With a managed database, that data sits on someone else's server under someone else's terms of service. With cash-track, every transaction goes directly into your own Google Sheet. Only you have access. You decide who sees it, when to delete it, and where it goes. No one else touches your data.

For a personal finance tracker that one person uses daily, this is exactly the right tradeoff.

## Stack

- [SvelteKit 2](https://kit.svelte.dev) + Svelte 5 (runes) · deployed on [Vercel](https://vercel.com)
- [Tailwind CSS v4](https://tailwindcss.com) via `@tailwindcss/vite`
- [Bun](https://bun.sh) as package manager & runtime
- Google Cloud Vision · Google Sheets API · DeepSeek API · Telegram Bot API · `@node-rs/argon2`

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
2. On row 1, add these **14 headers** in order (exact spelling matters):

```
timestamp  date  merchant  total  currency  category  payment_method  items  photo_url  raw_text  source  user  notes  id
```

> Upgrading an existing 13-column sheet? Add the `id` header and run
> `bun scripts/backfill-ids.js` once. It fills the column for every existing row.
> Rows without an `id` cannot be edited or deleted from the dashboard.

3. Copy the spreadsheet **ID** from the URL:
   `https://docs.google.com/spreadsheets/d/`**`<SHEET_ID>`**`/edit`

### 3. Google Service Account

1. Go to [Google Cloud Console](https://console.cloud.google.com) and create or select a project.
2. Enable **Google Sheets API** and **Cloud Vision API**.
3. Create a **Service Account** and generate a JSON key.
4. Share the spreadsheet with the service account email (give **Editor** access).
5. Convert the JSON key to a single line for the env var:
   ```bash
   cat service-account.json | tr -d '\n'
   ```

### 4. Telegram Bot

1. Message [@BotFather](https://t.me/BotFather), send `/newbot`, and copy the **token**.
2. Choose a **random secret token** (e.g. `openssl rand -hex 32`). It is used to validate webhook calls.
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
# Telegram
TELEGRAM_BOT_TOKEN=         # from @BotFather
TELEGRAM_SECRET_TOKEN=      # random string you chose
TELEGRAM_ALLOWED_IDS=       # comma-separated Telegram user IDs (e.g. 12345678)

# DeepSeek
DEEPSEEK_API_KEY=

# Google
GOOGLE_SERVICE_ACCOUNT=     # single-line JSON
GOOGLE_SHEET_ID=
GOOGLE_SHEET_TAB=Sheet1

# Budget
MONTHLY_BUDGET=9500000      # monthly spending limit (Rupiah)
BUDGET_WARN_PCT=80          # send a warning alert at this % of budget (default 80)
BUDGET_NOTIFY_CHAT_ID=      # Telegram chat ID to send budget alerts to (defaults to first ID in ALLOWED_IDS)

# Auth
AUTH_USERNAME=your-username
AUTH_PASSWORD_HASH=         # see step 7 below
SESSION_SECRET=             # random string >= 32 chars
```

> **Never commit `.env`**. Only `.env.example` belongs in the repo.
>
> Budget and API settings can also be changed at runtime from the **Pengaturan** page in the dashboard (no restart needed). On Vercel, changes persist per instance; use env vars for permanent config.

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
3. Set all env vars from step 6 in **Project > Settings > Environment Variables**.
4. Deploy.

### Register the Telegram webhook (one-time)

After deploy, run this once in your browser or with `curl` (replace the placeholders):

```
https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook?url=https://<your-app>.vercel.app/api/telegram&secret_token=<TELEGRAM_SECRET_TOKEN>
```

Telegram will confirm `{"ok":true,"result":true}`.

---

## Multi-user (optional)

By default, one user is configured via `AUTH_USERNAME` / `AUTH_PASSWORD_HASH`. To add more users, set `AUTH_USERS` (overrides the single-user vars):

```env
AUTH_USERS=[{"u":"alice","h":"$argon2id$..."},{"u":"bob","h":"$argon2id$..."}]
```

Generate each hash:
```bash
bun scripts/hash-password.js 'password-for-alice'
```

> In a `.env` file, wrap values containing `$` in **single quotes** or escape each `$` as `\$`. In Vercel dashboard, paste as-is.

---

## Telegram commands

| Command | What it does |
|---|---|
| *(send a photo)* | Runs OCR, parses, and saves it, then replies with the parsed summary and the entry's short ID |
| `/start` | Welcome message |
| `/hapus` | Delete your most recent Telegram-sourced entry |
| `/hapus <id>` | Delete a specific entry by the ID shown in the confirmation reply |

---

## Categories

Fixed set used by both the bot parser and the manual form:

`Makanan` · `Belanja` · `Transport` · `Tagihan` · `Kesehatan` · `Hiburan` · `Lainnya`

DeepSeek is instructed to always pick one of these; unrecognised expenses fall back to `Lainnya`.

---

## License

MIT
