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
- 📊 **Authoritative CPCB NAQI Engine** — Exact piecewise breakpoint interpolation conforming to the official Indian Central Pollution Control Board standard with mandatory 3-pollutant sufficiency checks
- 🛰️ **Atmospheric Model Telemetry** — Real-time European Copernicus / ECMWF CAMS atmospheric data via Open-Meteo with explicit provenance, location coordinates, and data freshness tracking
- 🪟 **Scientific Safe Ventilation Engine** — Multi-parameter atmospheric dispersion analysis (PBLH, wind speed, RH, PM2.5) with uncertainty confidence ratings, 24-hour contiguous intervals, and indoor CO2 vs. aerosol infiltration trade-offs
- ⚖️ **Statutory CAQM GRAP Regulation Integration** — Real-time Graded Response Action Plan (Stages I–IV) tracking with vehicular restrictions (BS-III Petrol/BS-IV Diesel bans), construction halt alerts, and school advisories
- 🏥 **Delhi-NCR Emergency Pulmonology Directory** — Verified tertiary respiratory emergency centers (AIIMS, Safdarjung, VPCI, Medanta, etc.), 1-touch emergency dispatch hotlines (112, 102/108), and clinical red-flag respiratory triage guidelines
- 🌐 **Bilingual Intelligence** — Full English & हिंदी (Hindi) plan generation support with translated technical terms
- ⏱️ **24-Hour Diurnal AQI Forecast** — Simulates Indian winter thermal inversions across morning smog peaks and afternoon thermal mixing
- 🛡️ **Expanded Vulnerabilities** — Personalized protocols for Bronchitis, Severe Allergies / Sinusitis, and Immunocompromised conditions
- 📍 **Delhi-NCR Micro-Location Hotspots** — Quick-selector for known hot spots (Anand Vihar, Jahangirpuri, RK Puram, Rohini, Noida Sec-62, Cyber City Gurugram)
- 💚 **Low-Emission Routines** — Timed daily actions to minimize pollution exposure
- 🏠 **Indoor Hacks** — Cost-graded improvements to make your home a clean-air sanctuary
- 📈 **Impact Metrics** — Quantified PM2.5 reduction and health benefit metrics
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
│   ├── AppHeader.tsx                 # Sticky branding header + reset button
│   ├── AirQualityCard.tsx            # Hero AQI status card + provenance attribution
│   ├── AqiBadge.tsx                  # Colour-coded AQI category pill
│   ├── EmergencyDirectorySection.tsx # Verified tertiary pulmonology centers & 112/102 hotlines
│   ├── EmergencyTips.tsx             # Critical actions list for severe days
│   ├── ErrorBanner.tsx               # Dismissable error notification
│   ├── GrapAlertCard.tsx             # Statutory CAQM GRAP restrictions & vehicle bans
│   ├── HourlyForecast.tsx            # 24-Hour Diurnal AQI thermal curve strip
│   ├── ImpactMetric.tsx              # Single quantified benefit tile
│   ├── ImpactMetricsGrid.tsx         # 2×2/4-col grid of impact tiles
│   ├── IndoorHacksList.tsx           # Grid of indoor improvement cards
│   ├── LoadingSpinner.tsx            # Animated breathing-circle loader
│   ├── PlanDashboard.tsx             # Full results layout assembler
│   ├── ProfileForm.tsx               # Micro-location form + hotspot chips + Hindi toggle
│   ├── RoutineList.tsx               # Ordered list of daily routines
│   ├── SectionHeader.tsx             # Reusable section h2 + subtitle
│   └── VentilationWindowCard.tsx     # Multi-interval ventilation timeline & indoor CO2 guidance
└── lib/
    ├── aqi-utils.ts                  # Pure AQI colour/label utilities (CPCB 6-band, deterministic)
    ├── cpcb-aqi.ts                   # Official CPCB NAQI formula & 3-pollutant sufficiency engine
    ├── emergency-directory.ts        # Delhi-NCR emergency hospital registry & clinical triage
    ├── environmental-service.ts      # Open-Meteo European Copernicus / ECMWF CAMS service
    ├── gemini.ts                     # Gemini API integration + deterministic fallback (server-only)
    ├── grap-regulations.ts           # Statutory CAQM GRAP Stage I–IV regulation engine
    ├── schemas.ts                    # Zod schemas (source of truth for all types)
    ├── types.ts                      # TypeScript interfaces + re-exports
    └── ventilation-engine.ts         # Multi-parameter atmospheric dispersion & safe ventilation model
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
| `npm test` | Run complete Node test runner suite (36 unit & integration tests) |

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
