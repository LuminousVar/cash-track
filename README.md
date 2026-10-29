# cash-track

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="static/logo/cashtrack-lockup-dark.svg">
  <img alt="cashtrack" src="static/logo/cashtrack-lockup.svg" height="40">
</picture>

Personal expense tracker powered by a Telegram bot. Send a receipt photo to the bot. Vision OCR reads it, DeepSeek parses it, and the result is saved to Google Sheets and shown on a SvelteKit dashboard.

> Built for a single user (or a small household). Self-hosted on Vercel, data lives in your own Google Sheet.

## Features

- **Telegram bot**: send a receipt photo, get an automatic reply with parsed details (merchant, total, category, items) and the remaining budget
- **Quick text entry**: no receipt? Type `kopi 25rb` or `parkir 5000 transport tunai` to the bot and it is recorded right away. The category is guessed when you leave it out
- **`/sisa`**: ask the bot for the remaining budget, today's spending, and the safe amount per day
- **Daily summary**: every evening (about 20:00 WIB) the bot sends today's total, the remaining budget, and the per-day allowance until payday, with a nudge when nothing was recorded that day
- **Vision OCR**: Google Cloud Vision extracts text from any receipt image
- **AI parsing**: DeepSeek (`deepseek-flash`) structures the raw text into clean JSON
- **Google Sheets backend**: all expenses stored in a spreadsheet you own and control
- **SvelteKit dashboard**: remaining budget with a safe daily allowance, category breakdown, recent transactions, yearly report
- **Manual entry**: add expenses via the web form with per-item breakdown (name, qty, price)
- **Edit & delete**: fix or delete a misread receipt from the web app, or undo the last entry straight from Telegram with `/hapus`
- **Item-level detail**: expand any transaction to see the parsed line items, and search across them
- **Budget management**: set a monthly limit, track progress with a visual gauge, view 12-month history
- **Budget alerts via Telegram**: get a notification when spending hits a configurable warning threshold (default 80%) and again when the budget is exceeded, once per period
- **Budget status**: remaining budget, per-day allowance until the next payday, end-of-period projection, and change vs the previous period
- **Spending trend chart**: cumulative spending this period vs the previous period, day by day, against the budget line, with hover and keyboard readouts
- **Monthly comparison chart**: one stacked bar per period of the year, split by category, with the budget line and a marker for the same period last year. Hover (or tap on mobile) for a breakdown and the change vs the previous period, hover a legend item to highlight one category, click a bar to open its transactions
- **Merchant logos**: transactions show the logo of the merchant (Indomaret, Alfamidi, Gojek, BCA, Netflix, Anthropic, and about 170 other Indonesian and international brands); unknown merchants get a category icon
- **Goals**: savings targets (future needs, wants, emergency fund) with deadline, progress, the amount to set aside per month, and an estimated completion date based on recent deposits. Deposits are kept separate from expenses and never touch the budget
- **PDF report per period**: download a print-ready A4 report (summary, trend chart, category and payment breakdown, full transaction list) from the **Laporan** page, starting on the last day of the period (the 24th with `CYCLE_START_DAY=25`)
- **Settings page**: shows which integrations are configured (API keys stay in env vars), theme, and bot help
- **Light, dark, or system theme**: remembered per browser
- **Install as an app**: add it to the home screen from Chrome or Safari and it opens full screen with its own icon (PWA, no offline cache)
- **Auth**: login-protected dashboard with argon2id password hashing, signed session cookies that end when the browser closes, a 30-minute idle timeout, a 12-hour maximum session, and a lockout after 5 failed logins
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
- PDF reports: headless Chromium via `@sparticuz/chromium` + `puppeteer-core`, layout based on the [Kami](https://github.com/tw93/kami) equity-report template, set in [Charis SIL](https://software.sil.org/charis/) (OFL)

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
>
> Goals live in two more tabs, `Goals` and `GoalLog`, and settings from the **Anggaran** page in a
> `Config` tab. The app creates all three on first use.

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
MONTHLY_BUDGET=1000000      # monthly spending limit (Rupiah)
BUDGET_WARN_PCT=80          # send a warning alert at this % of budget (default 80)
BUDGET_NOTIFY_CHAT_ID=      # Telegram chat ID to send budget alerts to (defaults to first ID in ALLOWED_IDS)
CYCLE_START_DAY=1           # payday, 1-28 (see "Payday budget period" below)

# Daily summary
CRON_SECRET=                # random string; leave empty to disable (see "Daily summary" below)

# Auth
AUTH_USERNAME=your-username
AUTH_PASSWORD_HASH=         # see step 7 below
SESSION_SECRET=             # random string >= 32 chars
```

> **Never commit `.env`**. Only `.env.example` belongs in the repo.
>
> The budget target, warning threshold, alert chat ID, and daily summary switch can also be changed from the **Anggaran** page (no restart needed). They are saved in the `Config` tab of the same spreadsheet, so they survive restarts and redeploys; the env vars are the fallback when a value is not set there. API keys are read from env vars only.

### 7. Generate password hash

```bash
bun scripts/hash-password.js 'your-password'
```

Copy the printed `$argon2id$...` hash into `AUTH_PASSWORD_HASH`. In a local `.env`, write every `$` as `\$` (Vite expands `$` even inside single quotes). On Vercel, paste the raw hash.

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

## Payday budget period (optional)

By default "this month" means the calendar month. If you get paid on, say, the 25th, set `CYCLE_START_DAY=25`. Each period then runs from the 25th to the 24th of the next month and is named after the month the salary pays for: 25 Sep to 24 Oct is the **October** period.

The dashboard, budget page, Telegram budget alerts, monthly chart, reports, and the month filter on the expense list all follow the period. "Today" is computed in WIB (Asia/Jakarta), so the period switches at midnight local time, not UTC.

---

## Daily summary

`vercel.json` schedules `/api/cron/daily` at 13:00 UTC (20:00 WIB). On the Hobby plan Vercel runs it at some point within that hour. The message goes to the same chat as the budget alerts (`BUDGET_NOTIFY_CHAT_ID`, or the first ID in `TELEGRAM_ALLOWED_IDS`).

1. Set `CRON_SECRET` in Vercel (any random string, e.g. `openssl rand -hex 32`). Vercel sends it as `Authorization: Bearer <CRON_SECRET>`; without it the route always answers 401.
2. Redeploy. The job shows up under **Project > Settings > Cron Jobs**, where it can also be run by hand.
3. Turn it off or on from the **Anggaran** page.

To trigger it yourself: `curl -H "Authorization: Bearer <CRON_SECRET>" https://<your-app>/api/cron/daily`.

---

## PDF reports

The **Laporan** page lists every period of the year with a PDF button. A period's report unlocks on its last day (WIB), so with payday on the 25th the October report (25 Sep - 24 Oct) is available from 24 Oct. The header button always points at the latest available report.

PDFs are rendered on demand by `/laporan/pdf/<YYYY-MM>`, which runs as its own Vercel function (it bundles Chromium, about 70MB; the rest of the app stays small). The first download after a cold start takes a few seconds.

- `@sparticuz/chromium` and `puppeteer-core` are pinned to the same Chrome major (153). Upgrade them together.
- `@sparticuz/chromium` only runs on Linux x64. On macOS, point `CHROME_PATH` at a local Chrome or Chromium binary for development.

---

## Sessions

A session ends when any of these happens: the browser is closed, 30 minutes pass without activity, or 12 hours pass since login. The idle limit is checked on the server, so a browser that restores its tabs after a restart still has to log in again. While you are reading a page without clicking around, the page pings the server every few minutes to keep the session alive, and logs itself out after 30 minutes without input.

`SESSION_SECRET` is required in production; without it, login is refused instead of falling back to a guessable key. Rotating it logs everyone out.

---

## Install on your phone

The app ships a web manifest and icons, so it can be installed as a PWA:

- **Android (Chrome)**: menu, then **Install app** (or **Add to Home screen**).
- **iPhone (Safari)**: Share, then **Add to Home Screen**.

There is deliberately no service worker: an offline cache could show a stale budget. The installed app follows the same session rules as the browser (see Sessions), so expect to log in again when you open it after a while.

---

## Logo

A squared lowercase c with one green block where its lower stroke ends: the end of a period, and where today sits in it. Built on a 256 grid with a 44-unit stroke, so at 16px every stroke is exactly 4px.

| File | Use |
|---|---|
| `src/lib/components/Logo.svelte` | the logo in the app (follows the theme; `size`, `wordmark` props) |
| `static/logo/cashtrack-mark*.svg` | symbol: colour, dark-background, black, white |
| `static/logo/cashtrack-lockup*.svg` | symbol + wordmark (Inter SemiBold, outlined), same variants |
| `src/lib/assets/favicon.svg`, `static/favicon.ico` | browser tab |
| `static/icons/` | apple-touch-icon (180), PWA icons (192, 512), maskable (512) |

Colours: ink `#18181b`, green `#15803d` on light backgrounds; `#f4f4f5` and `#22c55e` on dark. In one colour, the block takes the same colour as the c. For the Telegram bot's profile photo, send `static/icons/maskable-512.png` to @BotFather with `/setuserpic` (it survives the circular crop).

---

## Merchant logos

Brands and their aliases live in `src/lib/brands.js`. Matching is per whole word with the longest alias winning, so "ShopeeFood" maps to Shopee and "Toko Mandiri Jaya" does not map to Bank Mandiri. Aliases that are also common words (`dana`, `steam`, `xl`) only match when the merchant name is exactly that word.

Logos are downloaded once and committed to `static/brands/`; the app never calls a third-party service at runtime. To add a brand, add an entry to `brands.js` and run:

```bash
bun scripts/fetch-brand-logos.js          # only brands without a logo
bun scripts/fetch-brand-logos.js --force  # re-download everything
```

Sources, in order: Simple Icons (`si`), Wikimedia Commons (`wiki`), the App Store icon (`app`), the brand's own site, then Google's favicon service. Raster logos are normalised to 128px WebP through Chromium. Brands without a usable logo show their initials.

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

> In a local `.env` file, escape every `$` in a hash as `\$`. Single quotes do **not** help: Vite's env expansion still rewrites the value. In the Vercel dashboard or CLI, paste the raw hash without `\`.

---

## Telegram commands

| Command | What it does |
|---|---|
| *(send a photo)* | Runs OCR, parses, and saves it, then replies with the parsed summary, the entry's short ID, and the remaining budget |
| *(type an expense)* | `kopi 25rb`, `parkir 5000 transport`, `makan siang warteg 22.000 tunai`, `grab 18k kemarin`. A description plus an amount (`25rb`, `25.000`, `1,5jt`). After the amount you can add a category (`makan`, `belanja`, `transport`, `tagihan`, `kesehatan`, `hiburan`, `investasi`, `lainnya`), a payment method (`tunai`, `qris`, `tf`, `debit`, `cc`, `gopay`/`ovo`/`dana`), and `kemarin` for yesterday. Without a category, DeepSeek picks one. `/hapus` undoes it like any other Telegram entry |
| `/sisa` | Remaining budget for the current period, spending today, and the safe amount per day until payday |
| `/start` | Welcome message |
| `/hapus` | Delete your most recent Telegram-sourced entry |
| `/hapus <id>` | Delete a specific entry by the ID shown in the confirmation reply |
| `/goals` | List goals with progress and the amount needed per month |
| `/nabung <amount> <goal>` | Record a deposit, e.g. `/nabung 500rb laptop` (amounts like `250000`, `250.000`, `100rb`, `1,5jt` all work; the goal name can be partial, and can be left out if there is only one goal) |
| `/tarik <amount> <goal>` | Record a withdrawal from a goal |

---

## Categories

Fixed set used by both the bot parser and the manual form:

`Makanan & Minuman` · `Belanja` · `Transport` · `Tagihan` · `Kesehatan` · `Hiburan` · `Investasi` · `Lainnya`

DeepSeek is instructed to always pick one of these; unrecognised expenses fall back to `Lainnya`. Rows that still say `Makanan` (the old name) are read as `Makanan & Minuman`, so existing sheets need no changes.

`Investasi` (mutual funds, stocks, gold, crypto) is recorded but not counted as spending: it does not reduce the remaining budget, does not trigger budget alerts, and is shown separately on the dashboard, the report page, and in the PDF.

---

## License

MIT
