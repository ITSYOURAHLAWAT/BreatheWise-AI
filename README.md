# BreatheWise AI 🌬️

> **GenAI-powered Urban Air Quality Assistant** — Helping families navigate severe winter smog with personalized survival plans.

[![Next.js](https://img.shields.io/badge/Next.js-15.3-black)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8)](https://tailwindcss.com)
[![Zod](https://img.shields.io/badge/Zod-3.24-3068b7)](https://zod.dev)

## ✨ Features

- 🤖 **AI-Powered Plans** — Gemini 2.0 Flash generates hyper-personalized air quality survival plans
- 📊 **7-Day Forecast** — Realistic AQI projections with day-by-day smog outlook
- 💚 **Low-Emission Routines** — Timed daily actions to minimize pollution exposure
- 🏠 **Indoor Hacks** — Cost-graded improvements to make your home a clean-air sanctuary
- 📈 **Impact Metrics** — Quantified PM2.5 reduction and health benefit metrics
- 🚨 **Emergency Protocol** — Critical actions for hazardous AQI days
- ♿ **WCAG AAA Compliant** — Semantic HTML, ARIA roles, keyboard navigation, skip links

## 🏗️ Architecture

```
src/
├── app/
│   ├── api/
│   │   └── generate-plan/
│   │       └── route.ts          # POST /api/generate-plan — Gemini API proxy
│   ├── globals.css               # Tailwind base + custom CSS variables
│   ├── layout.tsx                # Root layout (font, metadata, body)
│   └── page.tsx                  # Main page — state machine orchestrator
├── components/
│   ├── AppHeader.tsx             # Sticky branding header + reset button
│   ├── AirQualityCard.tsx        # Hero AQI status card
│   ├── AqiBadge.tsx              # Colour-coded AQI category pill
│   ├── EmergencyTips.tsx         # Critical actions list for hazardous days
│   ├── ErrorBanner.tsx           # Dismissable error notification
│   ├── ImpactMetric.tsx          # Single quantified benefit tile
│   ├── ImpactMetricsGrid.tsx     # 2×2/4-col grid of impact tiles
│   ├── IndoorHacksList.tsx       # Grid of indoor improvement cards
│   ├── LoadingSpinner.tsx        # Animated breathing-circle loader
│   ├── PlanDashboard.tsx         # Full results layout assembler
│   ├── ProfileForm.tsx           # City + lifestyle input form
│   ├── RoutineList.tsx           # Ordered list of daily routines
│   ├── SectionHeader.tsx         # Reusable section h2 + subtitle
│   └── WeeklyForecast.tsx        # Horizontal 7-day AQI strip
└── lib/
    ├── aqi-utils.ts              # Pure AQI colour/label utilities
    ├── gemini.ts                 # Gemini API integration (server-only)
    ├── schemas.ts                # Zod schemas (source of truth for types)
    └── types.ts                  # TypeScript interfaces + re-exports
```

## 🚀 Quick Start

### 1. Clone & install
```bash
git clone <repo-url>
cd breathewise-ai
npm install
```

### 2. Configure environment
```bash
cp .env.example .env.local
# Edit .env.local and add your GEMINI_API_KEY
```

Get your free API key at [Google AI Studio](https://aistudio.google.com/app/apikey).

### 3. Run development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 4. Build for production
```bash
npm run build
npm start
```

## 🔧 Code Quality Standards

| Standard | Implementation |
|---|---|
| **Type Safety** | Strict TypeScript; zero `any` types; `noImplicitAny: true` |
| **Validation** | Zod schemas for all API I/O; runtime + compile-time safety |
| **Modularity** | 14 single-responsibility components; max ~200 lines/file |
| **Documentation** | JSDoc `/** */` on every component, interface, and function |
| **Accessibility** | WCAG AAA contrast; ARIA roles; skip links; keyboard nav |
| **Security** | API key server-only; Zod validates all user input before AI call |

## 🎨 Design System

| Token | Value | Usage |
|---|---|---|
| `sky-50`  | `#f0f9ff` | Page background |
| `sky-500` | `#0ea5e9` | Brand primary |
| `sky-900` | `#0c4a6e` | Headings, body text |
| Amber     | `#d97706` | Moderate AQI warning |
| Red-600   | `#dc2626` | Severe/hazardous alert |
| Emerald   | `#10b981` | Positive metrics |

## 📋 AQI Scale Reference (CPCB India)

| AQI Range | Category | Action |
|---|---|---|
| 0–50 | Good | Normal activities |
| 51–100 | Satisfactory | Sensitive groups take care |
| 101–200 | Moderate | Reduce prolonged outdoor exertion |
| 201–300 | Poor | Avoid outdoor activities |
| 301–400 | Very Poor | Stay indoors |
| 401–500 | Severe | Emergency measures |
| 500+ | Hazardous | Evacuate or shelter-in-place |

## 🔑 Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | ✅ Yes | Google Gemini API key |
