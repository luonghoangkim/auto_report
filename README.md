# AutoReport — Team Daily Report Manager

A production-ready web app for team leaders to collect, parse, and report on team daily work.

---

## Features

- **Google OAuth** sign-in (no email/password)
- **Paste daily reports** from multiple team members at once (any format)
- **AI-powered parsing** — deterministic rule-based parser (no paid API needed) + pluggable AI providers
- **Preview & edit** parsed results before saving
- **Task tracking** — grouped by PIC, progress %, status (todo/doing/review/done)
- **Deduplication** — prevents importing the same report batch twice
- **Task normalization** — fuzzy matching merges duplicate tasks across reports
- **Weekly / Monthly / Project reports** — generated automatically
- **DOCX export** — download professional Word documents
- **Full MongoDB persistence** — all raw text preserved for audit

---

## Quick Start

### 1. Prerequisites

- Node.js 18+
- MongoDB (Atlas free tier or local)
- Google Cloud Console project with OAuth 2.0 credentials

### 2. Set up environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<generate with: openssl rand -base64 32>

GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret

MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/autoreport
# or local: mongodb://localhost:27017/autoreport

AI_PROVIDER=deterministic   # no API key needed
```

### 3. Set up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials
2. Create OAuth 2.0 Client ID (Web application)
3. Add Authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
4. Copy Client ID and Client Secret into `.env.local`

### 4. Install & run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## AI Provider Configuration

The app works **without any paid AI API** by default.

| `AI_PROVIDER` | Description | API Key Needed |
|---|---|---|
| `deterministic` | Rule-based regex parser (default) | ❌ No |
| `mock` | Static fixture data for testing | ❌ No |
| `openai` | (Placeholder) OpenAI GPT | ✅ Yes |
| `gemini` | (Placeholder) Google Gemini | ✅ Yes |

Switch by changing `AI_PROVIDER` in `.env.local` — no code changes needed.

---

## User Flow

```
Login → Projects → Open Project → Paste Reports → Parse → Review/Edit → Save
                                                                         ↓
                                                               Task List (grouped by PIC)
                                                                         ↓
                                                               Generate Report → Download DOCX
```

---

## Daily Report Format

The parser handles any format. Examples that work:

**Vietnamese bullet style:**
```
Tên: Nguyễn Văn A
Ngày: 15/04/2024
Công việc:
- [FE] Thiết kế màn hình login – 80%
- [BE] Fix bug API auth – 100%
Vấn đề: Server staging lỗi
Kế hoạch: Hoàn thiện dashboard
```

**English numbered style:**
```
Name: John Smith
Date: 2024-04-15
Tasks:
1. [Backend] User authentication API - 100%
2. [Frontend] Login page design - 75%
Issues: Staging server connection timeout
Next: Complete dashboard integration
```

**Freestyle mixed:**
```
**Trần Thị B** - Apr 15
✓ API đăng nhập xong (100%)
✓ Viết test cho auth module (60%)
→ Cần review trước khi merge
```

Paste multiple members separated by `---` or just blank lines.

---

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Vanilla CSS (custom design system)
- **Auth:** NextAuth.js v5 (Google OAuth)
- **Database:** MongoDB + Mongoose
- **AI Layer:** Pluggable (deterministic by default)
- **Parser:** Custom regex + heuristics + Fuse.js fuzzy matching
- **Export:** `docx` npm package (pure JS, no external tools)

---

## Project Structure

```
src/
├── app/
│   ├── (protected)/          # Auth-guarded pages
│   │   ├── dashboard/
│   │   ├── projects/
│   │   │   └── [id]/
│   │   │       ├── page.tsx      # Import reports
│   │   │       ├── tasks/        # Task list
│   │   │       └── reports/      # Generate + export
│   ├── api/                  # API routes
│   │   ├── auth/[...nextauth]/
│   │   ├── projects/[id]/
│   │   ├── reports/parse/
│   │   ├── reports/save/
│   │   ├── tasks/
│   │   ├── generate/[type]/
│   │   └── export/
│   ├── login/
│   └── globals.css           # Design system
├── lib/
│   ├── mongodb.ts            # DB connection singleton
│   ├── auth.ts               # NextAuth config
│   ├── models/               # Mongoose schemas
│   ├── ai/                   # AI abstraction layer
│   │   ├── types.ts          # Provider interface
│   │   ├── index.ts          # Factory
│   │   └── providers/        # deterministic | mock | openai | gemini
│   ├── parser/               # Parsing pipeline
│   │   ├── splitReports.ts   # Detect member boundaries
│   │   ├── extractFields.ts  # Extract name/date/tasks/etc.
│   │   └── normalizeTask.ts  # Dedup + fuzzy merge
│   └── export/
│       └── docx.ts           # DOCX generation
└── components/
    └── layout/
        ├── Sidebar.tsx
        ├── Toast.tsx
        └── Providers.tsx
```

---

## Adding a Weekly Report Template

In the Reports page, you can provide a custom template. Use these placeholders:

```
{{PROJECT}}       - Project name
{{FROM}}          - Start date
{{TO}}            - End date
{{MEMBERS}}       - Team members list
{{DONE_TASKS}}    - Completed tasks
{{ONGOING_TASKS}} - In-progress tasks
{{ISSUES}}        - Issues / blockers
{{SUPPORT}}       - Support needed
{{NEXT_TASKS}}    - Planned for next week
```

---

## MongoDB Schemas

| Model | Key Fields |
|---|---|
| `User` | googleId, name, email, avatarUrl |
| `Project` | name, description, createdBy, status |
| `DailyReport` | projectId, rawText, rawHash, reportDate, createdBy |
| `ParsedReport` | dailyReportId, memberReports[], aiProvider, parseStatus |
| `Task` | projectId, title, picName, progress, status, history[] |
| `ReportExport` | projectId, type, dateRange, content, fileName |

---

## Seed / Sample Data

A sample daily report is built into the app — click **"Load sample"** in the Import Reports screen.

For a full seed script, run:

```bash
# (Create seed/seed.ts if needed — see seed/sample-reports.txt for examples)
```

---

## Production Deployment

```bash
# Build
npm run build

# Start
npm start
```

For Vercel deployment:
1. Set all environment variables in Vercel dashboard
2. Update `NEXTAUTH_URL` to your production URL
3. Update Google OAuth redirect URI to production URL
