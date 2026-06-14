# Walkthrough: Customer Intelligence & Synchronization

This document summarizes the changes made to build a Single Source Customer Intelligence Architecture and the Dual Customer Galaxy System inside ORBIT.

---

## 🚀 Key Implementations

### 1. Unified CRM Customer Model & Single Source of Truth (`OrbitContext.tsx`)
- Established the **Customer Galaxy** database inside `OrbitContext.tsx` as the single master customer dataset for the entire ORBIT platform.
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
- Added a new `"Voice & Lifecycle"` tab in Orbit Analytics.
- Rendered dynamic sentiment breakdown metrics (Positive/Neutral/Negative percentage distributions).
- Rendered interactive lifecycle cohort counts (Recent Buyer, Cooling Period, Miss You, Inactive, Dormant). Clicking a cohort dynamically filters the customer directory list.
- Embedded a scrollable Customer Voice review feed. Clicking any customer row or review highlights and selects that customer, instantly opening their drawer profile.

### 4. Dynamic AI Boardroom Dialogue Calibration (`AgentBoardroom.tsx`)
- Consumed `personas` and `customers` from `useOrbit()`. The target persona dropdown dynamically displays options mapped to the active business type's persona names.
- Implemented `getBoardroomCohortStats` helper to query the database and calculate cohort metrics: size, average risk, total LTV, preferred channel, primary sentiment, and a sample review quote matching the active region and persona.
- Injected these compiled metrics directly into the debate dialogue templates inside `generateDynamicFallbackScript`.
- Passed the calculated calculated cohort statistics to the Gemini prompt inside `triggerBoardroomDebate` to enable live discussion of live database parameters.

---

## 🛠️ Verification Results

- **TypeScript Compilation**: Checked with `cmd /c npx tsc -b --noEmit` and confirmed **zero type errors or compiler warnings**.
- **Real-Time Data Synchronization**: Verified that updating a customer's review or sentiment in the Galaxy drawer instantly alters counts and text feeds in both the Boardroom debates and Analytics dashboards.

---

## 🎯 Lifecycle Automation Campaigns

A dedicated "Lifecycle Automation" tab has been added to the **Growth Engine** workspace. It provides automated target campaign dispatches based on real-time customer data from the Customer Galaxy.

### 1. Recency Segmentation & Dashboard stats
- Calculates dynamic `daysSincePurchase` for all customers relative to the master platform clock `2026-06-14`.
- Segments the customer database into 5 active cohorts:
  - **Review Request**: purchased within $\le 7$ days.
  - **Check-In Nurture**: purchased $8\text{--}15$ days ago.
  - **Miss You Recovery**: purchased $16\text{--}30$ days ago.
  - **Win-Back Offer**: purchased $31\text{--}60$ days ago.
  - **Dormant Recovery**: purchased $>60$ days ago.
- Displays a real-time summary dashboard of counts for each category and a **Potential Recovery Headroom** metric (calculated as 15% of the total LTV of slipping/dormant customers).

### 2. Campaign Generator Recency Presets (Manual Mode Additions)
- Integrated a **Recency Campaigns (Purchase History Presets)** panel inside the manual Campaign Generator interface.
- Users can instantly pre-populate campaign objectives, targets, and copy versions by selecting one of three cohorts:
  - **Within 7 Days (Review)**: Automatically drafts a WhatsApp-first review request directed at recent buyers.
  - **Missing from 15 Days**: Automatically drafts relationship building check-ins.
  - **Last 1 Month Inactive**: Automatically drafts win-back discount campaigns (e.g. Email first with welcome-back privileges) for customers with no purchase in the last month.
- Displays live recipient eligibility counts for each cohort on the preset buttons.

### 3. Message Composer & Gemini-Powered Optimization
- Provides an interactive text editor for active cohort message templates.
- Includes an **Optimize via Gemini** button that uses AI to customize copies depending on business type, cohort, and target personas (e.g. adding structured collections for Working Professionals, trend drops for students/Gen Z, and high-priority recovery incentives for dormant buyers).

### 3. Twilio/Resend Dispatch Gateways & Preview List
- Implements simulated API selectors for WhatsApp, Email, and SMS.
- Triggers dispatch simulation states ("Queued", "Dispatched") for targets and logs gateway handshakes to the agent logs.
- Displays a detailed customer preview roster listing Name, Persona, Days Since Purchase, preferred Channel, and real-time dispatch state.
- Stores dispatched campaigns in the Firestore database to keep Mission Control charts and logs updated.
