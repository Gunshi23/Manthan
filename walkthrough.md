# Walkthrough: Customer Intelligence & Synchronization

This document summarizes the changes made to build a Single Source Customer Intelligence Architecture, the Dual Customer Galaxy System, the Regional Intelligence Engine, the Navigation Restructure, and the Onboarding Questionnaire update inside Manthan.

---

## 🚀 Key Implementations

### 1. Unified CRM Customer Model & Single Source of Truth (`OrbitContext.tsx`)
- Established the **Customer Galaxy** database inside `OrbitContext.tsx` as the single master customer dataset for the entire Manthan platform.
- Extended the `Customer` interface with core CRM/lifecycle fields:
  - `customerId`, `persona`, `totalSpent`, `lastPurchaseDate`, `riskScore`, `lifetimeValue`, `ordersCount`, `customerSentiment`, `reviews`, `sentiment`, `lifecycleStage`, and `growthOpportunity`.
- Implemented dynamic database enrichment in `getEnrichedCustomers` that computes purchase totals, last purchase dates, and maps customer nodes to their dynamic persona names and lifecycle categories.
- Implemented global selection sync using `selectedCustomerId` and `setSelectedCustomerId`.
- Implemented a global database updater `updateCustomer` that updates customer attributes locally and persists updates via `localStorage`, triggering instant downstream updates to all visual boards.

### 2. Dual Customer Galaxy View (`CustomerGalaxy.tsx`)
- Powered both the visual space constellation view and the tabular CRM list view using the unified dataset from context.
- Implemented space realignments (Segment, Persona, Risk Level, Revenue Contribution) with smooth gliding animations.
- Implemented search, column sorting, pagination, and unified left-panel filters in the List View.
- Added sentiment editing dropdowns and dynamic review additions in the customer profile drawer. Any updates immediately invoke `updateCustomer`, propagating changes globally.

### 3. Voice & Lifecycle Analytics (`OrbitAnalytics.tsx`)
- Added a new `"Voice & Lifecycle"` tab in Manthan Analytics.
- Rendered dynamic sentiment breakdown metrics (Positive/Neutral/Negative percentage distributions).
- Rendered interactive lifecycle cohort counts (Recent Buyer, Cooling Period, Miss You, Inactive, Dormant). Clicking a cohort dynamically filters the customer directory list.
- Embedded a scrollable Customer Voice review feed. Clicking any customer row or review highlights and selects that customer, instantly opening their drawer profile.

### 4. Dynamic AI Boardroom Dialogue Calibration (`AgentBoardroom.tsx`)
- Consumed `personas` and `customers` from `useOrbit()`. The target persona dropdown dynamically displays options mapped to the active business type's persona names.
- Implemented `getBoardroomCohortStats` helper to query the database and calculate cohort metrics: size, average risk, total LTV, preferred channel, primary sentiment, and a sample review quote matching the active region and persona.
- Injected these compiled metrics directly into the debate dialogue templates inside `generateDynamicFallbackScript`.
- Passed the calculated cohort statistics to the Gemini prompt inside `triggerBoardroomDebate` to enable live discussion of live database parameters.

### 5. Regional Intelligence Engine (`RegionalIntelligence.tsx`)
- Extended the customer data model to support geography metrics: `city`, `state`, `pincode`, and `country`.
- Added a new 6-tab **Regional Intelligence** dashboard:
  - **Geo-Insights**: Real-time revenue maps, top performing, emerging, and low performing regional grids.
  - **Geo-Personas**: Location-based customer archetype overlays (e.g. North Delhi Students, Mumbai Professionals) displaying revenue contribution and growth indices.
  - **Opportunity Radar**: Multi-axis opportunity analysis pinpointing geo-specific demand shifts and regional market risks.
  - **Regional Seasons**: Local calendar events (e.g. Diwali in Lucknow) mapped to target personas and lifecycle stages, with instant growth-engine campaign linkages.
  - **Regional Boardroom**: Collaborative agent alignment debates focused on regional market dynamics.
  - **City Drill-Down**: In-depth profiling of customer segments, lifecycles, and preferences for 10 key Indian metropolitan hubs.

### 6. Workflow-Driven Navigation Restructure (`AppShell.tsx`, `App.tsx`)
- Restructured the sidebar navigation hierarchy into a 6-phase growth workflow sequence:
  - **HUB** (Command Center)
  - **DATA** (Customer Galaxy, Personas)
  - **INTELLIGENCE** (Seasonal Intel, Regional Intel, Competitor Intel)
  - **STRATEGY** (Opportunity Radar, Boardroom)
  - **EXECUTION** (Growth Engine, Mission Control)
  - **ANALYTICS** (Analytics, Future Simulator)
- Integrated subtle visual flow connectors, step index badges, and unique phase-based color glow systems in the sidebar.
- Added a dynamic **Workflow Progress bar** showing active step progress (e.g. Step 3/11).
- Implemented a sticky **Workflow Breadcrumb Strip** at the top of the interface displaying the active stage, step indices, and a mini clickable navigation ribbon representing the full growth workflow.

### 7. Conditional Onboarding Questionnaire Flow (`BusinessProfileSetup.tsx`)
- Conditionalized the onboarding questionnaire to target live dataset uploads only:
  - **Live Workspace (File Upload)**: Once the raw CSV/JSON/XLSX file is processed and analyzed, the system initiates the 4-step wizard questionnaire (credentials, scale, targets, and operating style) followed by the AI Decoded Brand DNA Briefing panel.
  - **Demo Workspace (One-Click Selection)**: Bypasses the questionnaire and boots directly to setup/dashboard views, preserving the frictionless demo experience ("else keep it same").
- Smart Autocompletion: Extracted attributes from the parsed dataset (e.g., detected category, primary channels, customer counts) are mapped to pre-populate the questionnaire steps automatically, providing a fast-track tailored wizard.

---

## 🛠️ Verification Results

- **TypeScript Compilation**: Checked with `cmd /c npx tsc -b --noEmit` and confirmed **zero type errors or compiler warnings**.
- **Real-Time Data Synchronization**: Verified that updating a customer's review or sentiment in the Galaxy drawer instantly alters counts and text feeds in both the Boardroom debates and Analytics dashboards.
- **Onboarding Pipeline Flow**: Verified that picking demo workspaces directly loads the application, whereas dragging and dropping files transitions the user through the Manthan Analyzer pipeline and subsequently opens the personalized Brand DNA questionnaire pages.

---

## 🎨 Light Theme ("Executive Mode") Implementation

We implemented a complete Light Theme for Manthan (branded as **Executive Mode**) that provides a premium SaaS aesthetic (similar to Stripe and Linear) while maintaining the original dark theme completely unaltered.

### Key Changes
1. **Dynamic Styles System**: Expanded `src/index.css` to define the `.light` theme properties using CSS custom variables mapping to Tailwind colors.
2. **Persistence Layer**: Configured `AppShell.tsx` to save theme selections to `localStorage` and restore them automatically on boot.
3. **Workspace Adaptations**: Tuned all dashboard visual layouts (Future Simulator, Competitor Intel, Growth Engine, Onboarding setup, Customer Galaxy, and Analytics directories) to adapt cleanly with slate text, white cards, and light gridlines.
4. **SVG Chart Enhancements**: Upgraded custom SVG gridlines, legends, and hover tooltips in `OrbitAnalytics.tsx` to remain fully readable in Light mode.

### Verification
- Ran TypeScript checks (`npx tsc`) showing **0 errors**.
- Ran production build compilation (`npm run build`) successfully.

