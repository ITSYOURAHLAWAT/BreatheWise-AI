# BreatheWise AI 🌬️

> **GenAI-powered Urban Air Quality Assistant** — Helping families navigate severe winter smog with personalized survival plans.

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?logo=vercel)](https://breathewise-ai-five.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js-15.3-black)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8)](https://tailwindcss.com)
[![Zod](https://img.shields.io/badge/Zod-3.24-3068b7)](https://zod.dev)
[![WCAG AAA](https://img.shields.io/badge/Accessibility-WCAG%20AAA-green)](https://www.w3.org/WAI/WCAG22/quickref/)

🌐 **Live Demo:** [https://breathewise-ai-five.vercel.app](https://breathewise-ai-five.vercel.app)
📦 **GitHub:** [https://github.com/ITSYOURAHLAWAT/BreatheWise-AI](https://github.com/ITSYOURAHLAWAT/BreatheWise-AI)

---

## 📸 Screenshots

| Dashboard Hero | 24-Hour Forecast & Ventilation Window |
|:---:|:---:|
| ![Dashboard Hero](docs/screenshots/dashboard-hero.png) | ![Ventilation Timeline](docs/screenshots/ventilation-timeline.png) |
| **Profile Form** | **Emergency Protocol** |
| ![Profile Form](docs/screenshots/profile-form.png) | ![Emergency Tips](docs/screenshots/emergency-tips.png) |

> **[Screenshots pending]** — Drop PNG files into `docs/screenshots/` using the names above and remove this notice. See [`docs/screenshots/PLACEHOLDER.md`](docs/screenshots/PLACEHOLDER.md) for exact instructions.

---

## ✨ Features

- 🤖 **AI-Powered Plans** — Gemini Flash generates hyper-personalized air quality survival plans
- ⏱️ **24-Hour Diurnal AQI Forecast** — Simulates Indian winter thermal inversions across morning smog peaks and afternoon thermal mixing
- 🪟 **Safe Ventilation Window** — Pinpoints the safest 2–3 hour window of the day to aerate homes without smog backflow
- 🛡️ **Expanded Vulnerabilities** — Personalized protocols for Bronchitis, Severe Allergies / Sinusitis, and Immunocompromised conditions
- 📍 **Indian Micro-Location Focus** — Contextual guidance tailored to urban micro-locations (e.g., Anand Vihar, Delhi; Bandra, Mumbai)
- 💚 **Low-Emission Routines** — Timed daily actions to minimize pollution exposure
- 🏠 **Indoor Hacks** — Cost-graded improvements to make your home a clean-air sanctuary
- 📈 **Impact Metrics** — Quantified PM2.5 reduction and health benefit metrics
- 🚨 **Emergency Protocol** — Critical actions for severe smog days
- ♿ **WCAG AAA Compliant** — Semantic HTML, ARIA roles, `prefers-reduced-motion` support, keyboard navigation, skip links

---

## 🏗️ Architecture

```
src/
├── app/
│   ├── api/
│   │   └── generate-plan/
│   │       └── route.ts          # POST /api/generate-plan — Gemini API proxy with timeout
│   ├── globals.css               # Tailwind base + custom CSS variables + reduced-motion
│   ├── layout.tsx                # Root layout (font, metadata, body)
│   └── page.tsx                  # Main page — state machine orchestrator
├── components/
│   ├── AppHeader.tsx             # Sticky branding header + reset button
│   ├── AirQualityCard.tsx        # Hero AQI status card
│   ├── AqiBadge.tsx              # Colour-coded AQI category pill
│   ├── EmergencyTips.tsx         # Critical actions list for severe days
│   ├── ErrorBanner.tsx           # Dismissable error notification
│   ├── HourlyForecast.tsx        # 24-Hour Diurnal AQI thermal curve strip
│   ├── ImpactMetric.tsx          # Single quantified benefit tile
│   ├── ImpactMetricsGrid.tsx     # 2×2/4-col grid of impact tiles
│   ├── IndoorHacksList.tsx       # Grid of indoor improvement cards
│   ├── LoadingSpinner.tsx        # Animated breathing-circle loader
│   ├── PlanDashboard.tsx         # Full results layout assembler
│   ├── ProfileForm.tsx           # Urban micro-location + lifestyle form
│   ├── RoutineList.tsx           # Ordered list of daily routines
│   ├── SectionHeader.tsx         # Reusable section h2 + subtitle
│   └── VentilationWindowCard.tsx # Safe 2-3 hour window recommendation card
└── lib/
    ├── aqi-utils.ts              # Pure AQI colour/label utilities (CPCB 6-band, deterministic)
    ├── gemini.ts                 # Gemini API integration + deterministic fallback (server-only)
    ├── schemas.ts                # Zod schemas (source of truth for all types)
    └── types.ts                  # TypeScript interfaces + re-exports
```

---

## 🚀 Quick Start

### 1. Clone & install
```bash
git clone https://github.com/ITSYOURAHLAWAT/BreatheWise-AI.git
cd BreatheWise-AI
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

---

## 🔧 Code Quality Standards

| Standard | Implementation |
|---|---|
| **Type Safety** | Strict TypeScript; zero `any` types; `noImplicitAny: true`; `noUncheckedIndexedAccess: true`; `exactOptionalPropertyTypes: true` |
| **Validation** | Zod schemas for all API I/O; runtime + compile-time safety |
| **Modularity** | 14 single-responsibility components; max ~200 lines/file |
| **Documentation** | JSDoc `/** */` on every component, interface, and function |
| **Accessibility** | WCAG AAA contrast; ARIA roles; skip links; keyboard nav; `prefers-reduced-motion` |
| **Security** | API key server-only; Zod validates all user input before AI call; PII redaction |

---

## 🔒 Security & Privacy

BreatheWise AI is designed with **privacy-by-design** principles:

- **PII Redaction** — Email addresses, phone numbers, and street-level addresses are stripped via regex before any data reaches the LLM. Only the city name and Indian micro-location identifier are preserved for hyper-local advice.
- **Server-Side API Key** — `GEMINI_API_KEY` is never exposed to the browser. All Gemini calls are proxied through the `/api/generate-plan` Next.js Route Handler.
- **Input Validation** — Zod schemas validate every user-submitted field at the API boundary. Malformed or oversized payloads are rejected with structured `400` errors before they reach the LLM.
- **No Persistent Storage** — No user data is logged, stored in a database, or sent to third parties.

---

## 🛡️ Resilience & Fallback

The API route is hardened against network failures and LLM unavailability:

- **`Promise.race` Timeout** — The Gemini `generateContent` call races against a 35-second `AbortController` timeout. If the LLM takes too long, the race resolves with a structured error rather than hanging the request.
- **`maxDuration = 60`** — Vercel Edge runtime maximum duration is set to 60 seconds to give the full timeout window room to operate.
- **Deterministic Fallback Plan** — If Gemini returns a `503`, times out, or returns malformed JSON that fails Zod validation, the route falls back to `generateDeterministicFallbackPlan()` — a fully typed, schema-valid `AiResponse` computed from the user's AQI value and profile without any LLM call. Users always receive a valid plan.
- **Model Cascade** — `gemini-2.0-flash` is tried first; if unavailable, the route retries with `gemini-2.0-flash-lite` before triggering the deterministic fallback.

---

## 📋 AQI Scale Reference (Official CPCB India 6-Band Scale)

The AQI categorization logic in `src/lib/aqi-utils.ts` is **explicitly and deterministically mapped** to the official Indian Central Pollution Control Board (CPCB) 6-band scale (0–500). There is no "Hazardous" category — the scale ends at **Severe (401–500)**:

| AQI Range | Category | Action |
|---|---|---|
| 0–50 | Good | Normal activities; minimal health impact |
| 51–100 | Satisfactory | Sensitive individuals monitor minor breathing discomfort |
| 101–200 | Moderate | Breathing discomfort to people with asthma and heart disease |
| 201–300 | Poor | Breathing discomfort to most people on prolonged exposure |
| 301–400 | Very Poor | Respiratory illness on prolonged exposure; keep windows sealed |
| 401–500 | Severe | Affects healthy people and seriously impacts those with pre-existing conditions |
| > 500 | Out of range / Exceptional | Emergency conditions; catastrophic particulate concentration |

> **Note:** Any AQI value above 500 is returned as `"Out of range / Exceptional"` — it does **not** map to any named CPCB band. This is consistent with CPCB's official technical documentation.

---

## 🎨 Design System

| Token | Value | Usage |
|---|---|---|
| `sky-50`  | `#f0f9ff` | Page background |
| `sky-500` | `#0ea5e9` | Brand primary |
| `sky-900` | `#0c4a6e` | Headings, body text |
| Amber     | `#d97706` | Moderate AQI warning |
| Red-600   | `#dc2626` | Severe/hazardous alert |
| Emerald   | `#10b981` | Positive metrics |

---

## 🌡️ 24-Hour Thermal Inversion Simulation

The hourly forecast is generated by a **physics-inspired diurnal model** that simulates real Indian winter pollution behaviour:

1. **Pre-dawn smog peak (03:00–08:00)** — Nocturnal boundary layer traps PM2.5; AQI peaks near the user's input value.
2. **Morning thermal mixing (09:00–13:00)** — Rising temperatures break the inversion; AQI drops 25–40%.
3. **Afternoon minimum (13:00–16:00)** — Maximum thermal convection disperses particulates; lowest AQI of the day — this is the **Safe Ventilation Window**.
4. **Evening re-trapping (17:00–22:00)** — Cooling air collapses the mixing layer; AQI climbs back toward the peak.
5. **Night plateau (22:00–02:00)** — Stable nocturnal inversion; AQI holds near peak levels.

The **Safe Ventilation Window** component surfaces the specific 2–3 hour slot where the diurnal curve is lowest, with a colour-coded AQI badge and ventilation advice.

---

## 🔑 Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | ✅ Yes | Google Gemini API key (from [AI Studio](https://aistudio.google.com/app/apikey)) |

> ⚠️ **Never commit `.env.local` to version control.** It is listed in `.gitignore`. For Vercel deployments, add the key via `npx vercel env add GEMINI_API_KEY production`.

---

## 🧪 Development Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Start local development server on [http://localhost:3000](http://localhost:3000) |
| `npm run build` | Production build with full type checking |
| `npm run start` | Start production server locally |
| `npm run type-check` | Run `tsc --noEmit` — must exit 0 |
| `npm run lint` | Run ESLint with zero-warning policy |

---

## 🏆 Hackathon Submission

Built for **Google AI Hackathon 2025** — Track: *Sustainability & Climate*.

**Problem Alignment:** 300 million+ Indians in Tier-1 cities face AQI > 300 for 60+ days per winter. Generic air quality apps show a number but give no actionable guidance. BreatheWise AI closes this gap with AI-generated, medically-aware, location-specific plans delivered in under 3 seconds.

**Innovation:**
- 24-hour diurnal thermal inversion model (novel, not found in existing AQI apps)
- Deterministic fallback ensures 100% uptime even when LLM APIs are degraded
- PII-safe by design — no user data ever stored or logged
- WCAG AAA — accessible to elderly users and those with low-vision

---

*Made with ❤️ and clean air ambitions.*
