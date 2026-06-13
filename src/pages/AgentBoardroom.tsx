import React, { useState, useEffect, useRef } from "react";
import { useOrbit } from "../context/OrbitContext";
import { callGeminiAPI, parseGeminiJson } from "../utils/gemini";
import { 
  Zap, MessageSquare, Cpu, Users, BarChart2, Sparkles, 
  Radio, CheckCircle2, Activity, ChevronDown, ChevronUp, 
  Terminal, Play, Pause, Square
} from "lucide-react";
import { AgentCardModal } from "../components/AgentCardModal";
import { PageHeaderHUD } from "../components/PageHeaderHUD";

/* ─────────────────────────────────────────────────────────────
   TYPES
 ───────────────────────────────────────────────────────────── */
interface BoardroomMessage {
  agent: "Polaris" | "Nova" | "Vega" | "Atlas" | "Luna";
  message: string;
  confidence: number;
  reasoning: string;
  timestamp: string;
  stats?: string;
}

/* ─────────────────────────────────────────────────────────────
   CONSTANTS (15-MESSAGE EXPANDED FALLBACK SCRIPTS)
 ───────────────────────────────────────────────────────────── */
const SCENARIOS = [
  {
    name: "Inactive Customer Win-Back",
    description: "Re-engaging dormant segment VIPs with customized credits drop.",
    script: [
      // ROUND 1: DISCOVERY & SCANS
      { 
        agent: "Polaris" as const, 
        message: "Sector scan complete. I've discovered 432 high-ltv customers showing zero activity for 90 days. Churn risk clusters at 78% in group B.", 
        confidence: 94, 
        reasoning: "Dormancy pattern triggers match historical slippage thresholds. Customer DNA marks: 'VIP', 'Organic Preferred'.",
        stats: "432 targets flagged"
      },
      {
        agent: "Luna" as const,
        message: "Transaction history audited. Out of these 432 profiles, 150 VIPs have substantial unused loyalty points. This is prime win-back leverage.",
        confidence: 93,
        reasoning: "Queried transaction ledger. Filtered active balances > ₹200. Cross-checked with last transaction timestamp.",
        stats: "150 credit VIPs mapped"
      },
      { 
        agent: "Vega" as const, 
        message: "Revenue opportunity is evaluated at ₹1.2L. Calculating ROI projections gives 3.8x baseline return under current parameters.", 
        confidence: 87, 
        reasoning: "60-feature regression model runs. Estimated conversion threshold is 28% model yields. Risk delta: -4.5%.",
        stats: "₹1.2L opp · 3.8x ROI"
      },
      { 
        agent: "Nova" as const, 
        message: "Personalized win-back layout generated. Selecting urgency-framed copy variants optimized for WhatsApp delivery.", 
        confidence: 91, 
        reasoning: "A/B test archives show urgency copy yields 23% higher CTR on mobile channel segments over classic email formats.",
        stats: "WhatsApp template ready"
      },
      { 
        agent: "Atlas" as const, 
        message: "Optimal delivery window computed. Dispatch nodes responsive. Ready to route campaign. Awaiting authorization.", 
        confidence: 96, 
        reasoning: "Channel capacity analysis reports 0ms queue latency. Dispatch time locked to Tuesday 10:30 AM timezone peaks.",
        stats: "Dispatch ready"
      },
      // ROUND 2: ANALYSIS & REFINEMENT
      {
        agent: "Polaris" as const,
        message: "Refining segment filters. If we exclude users who had high support-ticket frequencies before going cold, we reduce churn feedback loops.",
        confidence: 92,
        reasoning: "Cohort adjustment: removed 32 users who registered complaints in their last 30 active days.",
        stats: "Segment set to 400"
      },
      {
        agent: "Luna" as const,
        message: "Agreed. Excluding those 32 users reduces coupon abuse risk by 14% and shifts our focus to purely satisfied-but-idle accounts.",
        confidence: 91,
        reasoning: "Compared support tickets with promotional redemption behavior. Coupon sensitivity index is lower for frustrated accounts.",
        stats: "Risk delta: -14%"
      },
      {
        agent: "Vega" as const,
        message: "Recalculating conversion curve. The refined segment of 400 VIPs pushes expected conversion rate up to 34%, yielding ₹1.35L.",
        confidence: 90,
        reasoning: "Run adjusted regression model on 400 cohort size. Confidence interval narrows from 72-88% to 78-91%.",
        stats: "₹1.35L opp · 4.2x ROI"
      },
      {
        agent: "Nova" as const,
        message: "Adjusting copy layout. I will add a dynamic list of their top three past purchased items to trigger high-context recall.",
        confidence: 93,
        reasoning: "Personalized purchase histories embedded in WhatsApp cards show 45% higher engagement compared to generic copy.",
        stats: "Dynamic copy updated"
      },
      {
        agent: "Atlas" as const,
        message: "Throttling parameters configured. I will schedule a fallback SMS route for profiles with invalid WhatsApp numbers.",
        confidence: 95,
        reasoning: "SMS fallback API latency check completed. Gateway rate-limits set to 50 TPS to avoid carrier spam blocks.",
        stats: "SMS fallback armed"
      },
      // ROUND 3: FINAL CONSENSUS
      {
        agent: "Polaris" as const,
        message: "Final target list compiled and verified. All 400 profiles have clean segment attributes. Polaris consensus reached.",
        confidence: 97,
        reasoning: "Finalized database view export. Schema validation returned 100% success rate on segment criteria.",
        stats: "400 VIPs finalized"
      },
      {
        agent: "Luna" as const,
        message: "Loyalty point balance query verified. Token balances mapped directly to checkout gateways. Luna consensus reached.",
        confidence: 96,
        reasoning: "Executed endpoint handshake. Token validator responded with zero errors across the active cohort.",
        stats: "Token mapping complete"
      },
      {
        agent: "Vega" as const,
        message: "Revenue models finalized. Net value recovery is optimized. Vega consensus reached.",
        confidence: 92,
        reasoning: "Final simulation run. Expected revenue: ₹1.35L, expected margin: 82%. P-value: < 0.01.",
        stats: "ROI: 4.2x locked"
      },
      {
        agent: "Nova" as const,
        message: "Creative templates and assets generated and locked in storage CDN. Nova consensus reached.",
        confidence: 94,
        reasoning: "Compiled layouts, compressed image assets, verified link redirection parameters.",
        stats: "Creatives locked"
      },
      {
        agent: "Atlas" as const,
        message: "Campaign queue armed. Automated dispatch nodes are active and await manual launch approval. Atlas consensus reached.",
        confidence: 98,
        reasoning: "Webhook handlers tested, queue listener initialized, campaign status set to standby-ready.",
        stats: "Campaign fully armed"
      }
    ]
  },
  {
    name: "Quantum Deck Cross-Sell",
    description: "Targeting tech-enthusiasts for cross-selling upgrades.",
    script: [
      // ROUND 1: DISCOVERY & SCANS
      { 
        agent: "Polaris" as const, 
        message: "Scanning active Loyalist graphs. Identified 120 tech cohort profiles matching 'Early Adopter' and 'Quantum Deck' affinity tags.", 
        confidence: 93, 
        reasoning: "Cross-cohort behavior models match upgrade velocity indexes. Average LTV baseline: ₹3,500.",
        stats: "120 early adopters flagged"
      },
      {
        agent: "Luna" as const,
        message: "Cross-referenced active cohorts. Mapped 45 early adopters who recently purchased accessory bundles but haven't upgraded their core deck.",
        confidence: 94,
        reasoning: "Analyzed peripheral catalog purchase timestamps and correlated with active hardware IDs.",
        stats: "45 accessory owners found"
      },
      { 
        agent: "Vega" as const, 
        message: "Opportunity projection sets conversion yields at 42%. Predicted revenue generated is ₹2.4L. Churn correlation risk is negligible.", 
        confidence: 90, 
        reasoning: "Likelihood score computed via random forest. Customer buying capacity shows 1.5x scale multiplier.",
        stats: "₹2.4L forecast · 42% yield"
      },
      { 
        agent: "Nova" as const, 
        message: "Generated high-fidelity RCS card copy with embedded upgrade pathways and rich interactive visuals.", 
        confidence: 89, 
        reasoning: "RCS rich templates return 3.4x higher conversion metrics compared to plain SMS text nodes on tech segments.",
        stats: "RCS Rich Cards generated"
      },
      { 
        agent: "Atlas" as const, 
        message: "Routing channels confirmed. Pre-sales dispatch cadence scheduled. Delivery buffers cleared for launch.", 
        confidence: 95, 
        reasoning: "Scheduling is configured with pre-sale notification +48h follow-up cadences. Webhooks armed.",
        stats: "Launch armed"
      },
      // ROUND 2: REFINEMENT
      {
        agent: "Polaris" as const,
        message: "Filtering target group to isolate users with a session count of >5 in the past 14 days, maximizing immediate purchase intent.",
        confidence: 92,
        reasoning: "Cohort adjustment: focused on high-engagement user profiles to avoid fatigue warnings.",
        stats: "Segment set to 95"
      },
      {
        agent: "Luna" as const,
        message: "For the remaining 25 low-session profiles, I suggest sending a customized loyalty discount code to re-engage them through the purchase path.",
        confidence: 91,
        reasoning: "Promotion triggers for cold segments yield 18% higher activation rates based on Loyalist records.",
        stats: "25 discount targets"
      },
      {
        agent: "Vega" as const,
        message: "Running profit simulations. A 10% discount for the 25 low-session profiles boosts overall campaign conversion to 48%, increasing revenue to ₹2.65L.",
        confidence: 90,
        reasoning: "Run pricing elasticity models. Conversion gains outweigh margin compression.",
        stats: "₹2.65L forecast · 48% yield"
      },
      {
        agent: "Nova" as const,
        message: "Created a secondary, high-urgency A/B copy variant for the discount cohort emphasizing the 48-hour discount window.",
        confidence: 92,
        reasoning: "Fears-of-missing-out copy templates yield 31% higher CTR on tech segments.",
        stats: "Variant B generated"
      },
      {
        agent: "Atlas" as const,
        message: "Adjusted dispatch paths. Profiles will be split automatically into two queues to prevent discount code leakage.",
        confidence: 94,
        reasoning: "Database dispatch routing mapped to dynamic coupon API nodes.",
        stats: "Split queues active"
      },
      // ROUND 3: FINAL CONSENSUS
      {
        agent: "Polaris" as const,
        message: "Finalized both target groups. Segments synced and schemas validated. Polaris consensus reached.",
        confidence: 97,
        reasoning: "Final schema check returned no null values for customer parameters.",
        stats: "Segments finalized"
      },
      {
        agent: "Luna" as const,
        message: "Checked active coupons in database. Promotion codes are registered and active. Luna consensus reached.",
        confidence: 95,
        reasoning: "Handshake completed with promotion code service, code validated successfully.",
        stats: "Coupon codes verified"
      },
      {
        agent: "Vega" as const,
        message: "Final yield curve locked. ROI index is optimized at 4.6x. Vega consensus reached.",
        confidence: 91,
        reasoning: "Simulation model finalized, p-value verified at < 0.01.",
        stats: "ROI: 4.6x locked"
      },
      {
        agent: "Nova" as const,
        message: "RCS layouts and fallback templates packaged and uploaded to CDN. Nova consensus reached.",
        confidence: 93,
        reasoning: "Layout validation checked against Android and iOS display parameters.",
        stats: "Creatives finalized"
      },
      {
        agent: "Atlas" as const,
        message: "Webhook listeners active, delivery pipelines ready, and queues armed for Tuesday. Atlas consensus reached.",
        confidence: 97,
        reasoning: "Queue listeners initialized, message template IDs registered.",
        stats: "Dispatch armed"
      }
    ]
  },
  {
    name: "VIP Churn Mitigation",
    description: "Mitigating high churn probabilities in premium segments.",
    script: [
      // ROUND 1: DISCOVERY & SCANS
      { 
        agent: "Polaris" as const, 
        message: "Critical Warning: Slipping Away VIP cohort segment displays a 78% attrition hazard rating. 18 accounts are marked active danger.", 
        confidence: 95, 
        reasoning: "Risk spikes match critical indicators: 30-day session decline + repeated cart abandonments on core items.",
        stats: "18 critical VIP nodes"
      },
      {
        agent: "Luna" as const,
        message: "Support logs audited. 6 of these slipping VIPs have unresolved customer service tickets regarding recent transaction delays.",
        confidence: 94,
        reasoning: "Scanned support ticket DB, matched customer emails with open tickets and categorized as high-severity.",
        stats: "6 open ticket VIPs"
      },
      { 
        agent: "Vega" as const, 
        message: "Averted churn value calculated at ₹85,000. Suggested campaign ROI threshold: 4.2x. WhatsApp has highest recovery rate.", 
        confidence: 88, 
        reasoning: "Customer recovery probability is 64% when reached within a 24h window. SMS acts as fallback channel node.",
        stats: "₹85K value saved · 4.2x ROI"
      },
      { 
        agent: "Nova" as const, 
        message: "Generated personalized re-engagement layouts, injecting past purchases and dedicated loyalty recovery values.", 
        confidence: 92, 
        reasoning: "Loyalty compensation structures decrease VIP exit rates by 40% based on historical mitigation loops.",
        stats: "Dynamic copy personalized"
      },
      { 
        agent: "Atlas" as const, 
        message: "Operations dispatch pipeline verified. Trigger buffers loaded. Channels ready for automatic activation.", 
        confidence: 97, 
        reasoning: "Webhook handlers mapped. Automatic dispatcher active. Real-time delivery monitors online.",
        stats: "Operational loop armed"
      },
      // ROUND 2: REFINEMENT
      {
        agent: "Polaris" as const,
        message: "Cross-referencing notifications settings. 4 of the critical VIPs have disabled marketing push alerts.",
        confidence: 91,
        reasoning: "Checked notification token status in segment database.",
        stats: "4 push-disabled VIPs"
      },
      {
        agent: "Luna" as const,
        message: "We should bypass push alerts and route them via transactional support emails, citing their open support tickets directly.",
        confidence: 93,
        reasoning: "Support emails have 95% open rate on active accounts compared to standard push notifications.",
        stats: "Email fallback mapped"
      },
      {
        agent: "Vega" as const,
        message: "Modeling email fallback yields. Reaching these 4 users via transactional support paths preserves a 72% overall cohort recovery probability.",
        confidence: 90,
        reasoning: "Adjusted recovery tree. Transactional emails yield 1.8x higher response than promotional nodes.",
        stats: "72% recovery rate"
      },
      {
        agent: "Nova" as const,
        message: "Created custom, high-priority email templates that integrate recent support ticket IDs and agent notes.",
        confidence: 91,
        reasoning: "Support ticket references in subjects boost open rate by 34%.",
        stats: "Support email template ready"
      },
      {
        agent: "Atlas" as const,
        message: "Mapped high-priority transactional SMTP endpoints to bypass standard promotional queue throttling.",
        confidence: 96,
        reasoning: "Configured specific SMTP headers to classify as high priority transactional emails.",
        stats: "VIP priority route active"
      },
      // ROUND 3: FINAL CONSENSUS
      {
        agent: "Polaris" as const,
        message: "Target profiles verified, push-disabled indicators updated in database. Polaris consensus reached.",
        confidence: 96,
        reasoning: "Final segment definitions updated in core DB.",
        stats: "VIP list compiled"
      },
      {
        agent: "Luna" as const,
        message: "Support ticket link webhooks tested and listening for resolution triggers. Luna consensus reached.",
        confidence: 95,
        reasoning: "Validated target endpoints, webhook listening status active.",
        stats: "Ticket hooks verified"
      },
      {
        agent: "Vega" as const,
        message: "Revised value recovery projection finalized at ₹61,200. Vega consensus reached.",
        confidence: 92,
        reasoning: "Final regression simulation finished.",
        stats: "Recovery: ₹61.2K locked"
      },
      {
        agent: "Nova" as const,
        message: "All personalized copies and support templates checked and signed off. Nova consensus reached.",
        confidence: 94,
        reasoning: "Draft copy signed with dynamic parameter keys.",
        stats: "Copy templates approved"
      },
      {
        agent: "Atlas" as const,
        message: "VIP mitigation dispatch pipeline armed and ready for trigger events. Atlas consensus reached.",
        confidence: 98,
        reasoning: "SMTP configurations validated and queue pipeline running.",
        stats: "Mitigation pipeline live"
      }
    ]
  },
  {
    name: "Growth Recovery & Reactivation",
    description: "Luna recovers dormant revenue and leakage through automated re-engagement.",
    script: [
      // ROUND 1: DISCOVERY & SCANS
      { 
        agent: "Polaris" as const, 
        message: "Dormant user scan finished. I have mapped 712 churn-risk accounts with no login events in 120 days. Historical average basket value: ₹4,200.", 
        confidence: 95, 
        reasoning: "Dormancy behavior triggers are confirmed across customer segments with active historical purchases but flatline 120-day web session logs.",
        stats: "712 idle profiles mapped"
      },
      { 
        agent: "Luna" as const, 
        message: "I've cross-referenced those 712 accounts. 284 profiles are high-affinity recovery candidates with abandoned checkouts. Leakage recovery protocols initialized.", 
        confidence: 96, 
        reasoning: "Analyzing abandonment pathways. High recovery probability detected due to previous checkout tokens remaining in local basket cache.",
        stats: "284 recovery targets found"
      },
      { 
        agent: "Vega" as const, 
        message: "Evaluating recoverable revenue delta. Estimated recovery pipeline stands at ₹1.8L. Calculating a 4.1x ROI projection on targeted incentives.", 
        confidence: 89, 
        reasoning: "Calculated with a 35% expected reactivation rate based on localized conversion coefficients and custom incentive weightings.",
        stats: "₹1.8L opp · 4.1x ROI"
      },
      { 
        agent: "Nova" as const, 
        message: "Re-engagement creatives compiled. Injecting dynamic discount codes and cart restoring links into personalized SMS and email variants.", 
        confidence: 92, 
        reasoning: "Dynamic recovery links coupled with custom urgency discounts drive 34% higher reactivation margins over standard generic email alerts.",
        stats: "Multi-channel templates"
      },
      { 
        agent: "Atlas" as const, 
        message: "Distribution paths cleared. Automated reactivation campaign queues armed. Initiating dispatch buffers upon manager approval.", 
        confidence: 97, 
        reasoning: "Gateway handshake verified. Throttling active to avoid carrier rate limits.",
        stats: "Reactivation queue armed"
      },
      // ROUND 2: REFINEMENT
      {
        agent: "Polaris" as const,
        message: "Inventory check completed. 90 of these abandoned carts contain items that are currently out of stock.",
        confidence: 92,
        reasoning: "Cross-checked product IDs against inventory management database.",
        stats: "90 stock alerts"
      },
      {
        agent: "Luna" as const,
        message: "I will query the recommendation API to find active alternatives for out-of-stock items and inject them dynamically.",
        confidence: 94,
        reasoning: "Mapping alternative SKU IDs using product category and buyer history.",
        stats: "Alternative mapping active"
      },
      {
        agent: "Vega" as const,
        message: "Recalculating revenue curve. Replacing items leads to a minor 4% conversion drop, but keeps 100% of target profiles active.",
        confidence: 91,
        reasoning: "Estimated substitution factor sets conversion stability at 96% of control.",
        stats: "₹1.72L revised opp"
      },
      {
        agent: "Nova" as const,
        message: "Re-generating template blocks to display dynamically mapped replacement items with a 'Recommended for You' tag.",
        confidence: 92,
        reasoning: "Recommendation tags increase click-through metrics by 22% in A/B archives.",
        stats: "Copy block updated"
      },
      {
        agent: "Atlas" as const,
        message: "Stock verification hooks integrated. Dispatcher will double check inventory cache before sending messages.",
        confidence: 95,
        reasoning: "Connected real-time stock lookup service hook into the sending middleware.",
        stats: "Inventory cache linked"
      },
      // ROUND 3: FINAL CONSENSUS
      {
        agent: "Polaris" as const,
        message: "Target list of 284 profiles finalized, stock fallback profiles flagged. Polaris consensus reached.",
        confidence: 96,
        reasoning: "Final segment view built, attributes exported to CSV and loaded to cache.",
        stats: "284 profiles ready"
      },
      {
        agent: "Luna" as const,
        message: "Dynamic recommendation parameters verified and connected to checkout flow. Luna consensus reached.",
        confidence: 95,
        reasoning: "Handshake verified with recomendation API, return value mapped.",
        stats: "Checkout hooks verified"
      },
      {
        agent: "Vega" as const,
        message: "Yield model locked at ₹1.72L with 3.9x ROI projection. Vega consensus reached.",
        confidence: 92,
        reasoning: "Finalized revenue models under refined inventory inputs.",
        stats: "ROI: 3.9x locked"
      },
      {
        agent: "Nova" as const,
        message: "All dynamic blocks and checkout link variables validated. Nova consensus reached.",
        confidence: 94,
        reasoning: "Double checked link shortener webhooks, dynamic variables are functional.",
        stats: "Templates approved"
      },
      {
        agent: "Atlas" as const,
        message: "Reactivation campaign dispatch schedule confirmed. Queues armed for launch. Atlas consensus reached.",
        confidence: 98,
        reasoning: "Scheduled queues created, dispatch nodes are active in standby.",
        stats: "Launch armed"
      }
    ]
  }
];

const AGENT_META = {
  Polaris: { 
    role: "Audience Intelligence", 
    color: "#3B82F6", 
    border: "border-blue-500/20", 
    bg: "bg-blue-500/5", 
    text: "text-blue-400",
    icon: Users,
    x: 120, y: 35
  },
  Vega: { 
    role: "Predictive Analytics", 
    color: "#8B5CF6", 
    border: "border-violet-500/20", 
    bg: "bg-violet-500/5", 
    text: "text-violet-400",
    icon: BarChart2,
    x: 201, y: 94
  },
  Nova: { 
    role: "Campaign Creator", 
    color: "#EC4899", 
    border: "border-pink-500/20", 
    bg: "bg-pink-500/5", 
    text: "text-pink-400",
    icon: Sparkles,
    x: 170, y: 189
  },
  Atlas: { 
    role: "Operations Dispatch", 
    color: "#22C55E", 
    border: "border-green-500/20", 
    bg: "bg-green-500/5", 
    text: "text-green-400",
    icon: Radio,
    x: 70, y: 189
  },
  Luna: { 
    role: "Growth Recovery Agent", 
    color: "#F59E0B", 
    border: "border-amber-500/20", 
    bg: "bg-amber-500/5", 
    text: "text-amber-400",
    icon: Activity,
    x: 39, y: 94
  }
};

/* ─────────────────────────────────────────────────────────────
   AGENT BOARDROOM
 ───────────────────────────────────────────────────────────── */
export const AgentBoardroom: React.FC = () => {
  const { addAgentLog, config, businessType } = useOrbit();
  const [selectedScenario, setSelectedScenario] = useState(0);
  const [debateActive, setDebateActive] = useState(false);
  const [debateMsgs, setDebateMsgs] = useState<BoardroomMessage[]>([]);
  const [activeSpeaker, setActiveSpeaker] = useState<"Polaris" | "Nova" | "Vega" | "Atlas" | "Luna" | null>(null);

  /* selected agent profile card state */
  const [selectedAgent, setSelectedAgent] = useState<"Polaris" | "Vega" | "Nova" | "Atlas" | "Luna" | null>(null);

  /* Accordion state for deep reasoning */
  const [openReasoning, setOpenReasoning] = useState<Record<number, boolean>>({});

  /* Consensus Checklist state */
  const [consensus, setConsensus] = useState({
    segmentFound: false,
    leaksRecovered: false,
    roiForecasted: false,
    copyGenerated: false,
    dispatchArmed: false
  });

  /* Telemetry activity ticker */
  const [telemetry, setTelemetry] = useState<string[]>([]);

  /* ─────────────────────────────────────────────────────────────
     NEW DEBATE CONTROL & TOPIC STATES
  ───────────────────────────────────────────────────────────── */
  const [debateSpeed, setDebateSpeed] = useState<"normal" | "fast" | "instant">("normal");
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [debateScript, setDebateScript] = useState<BoardroomMessage[]>([]);
  const [currentStepIdx, setCurrentStepIdx] = useState<number>(-1);
  const [elapsedTimeInCurrentStep, setElapsedTimeInCurrentStep] = useState<number>(0);
  const [isThinking, setIsThinking] = useState<boolean>(false);

  // Dynamic scenario descriptors
  const [currentScenarioName, setCurrentScenarioName] = useState<string>(SCENARIOS[0].name);
  const [currentScenarioDescription, setCurrentScenarioDescription] = useState<string>(SCENARIOS[0].description);

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [debateMsgs, isThinking]);

  const addTelemetry = (msg: string) => {
    setTelemetry(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 15));
  };

  // Speed and time calculation
  const totalDuration = debateSpeed === "normal" ? 300 : debateSpeed === "fast" ? 60 : 15;
  const numMessages = Math.max(1, debateScript.length);
  const secondsPerMessage = totalDuration / numMessages;
  const totalElapsedSeconds = debateActive && currentStepIdx >= 0 
    ? currentStepIdx * secondsPerMessage + (elapsedTimeInCurrentStep / 1000) 
    : 0;
  const timeLeft = debateActive 
    ? Math.max(0, Math.ceil(totalDuration - totalElapsedSeconds)) 
    : totalDuration;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  /* ─────────────────────────────────────────────────────────────
     DEBATE SIMULATOR TIMER MACHINE
  ───────────────────────────────────────────────────────────── */
  useEffect(() => {
    if (!debateActive || isPaused || currentStepIdx === -1 || debateScript.length === 0) {
      return;
    }

    const stepDurationMs = secondsPerMessage * 1000;
    const thinkingDurationMs = stepDurationMs * 0.3; // 30% thinking, 70% speaking

    const interval = setInterval(() => {
      setElapsedTimeInCurrentStep(prev => {
        const nextTime = prev + 100;
        
        // Check if agent should transition from thinking to speaking
        if (prev < thinkingDurationMs && nextTime >= thinkingDurationMs) {
          setIsThinking(false);
          const msg = debateScript[currentStepIdx];
          if (msg) {
            setDebateMsgs(msgs => {
              // Only add if it's not already added
              if (msgs.length <= currentStepIdx) {
                addAgentLog(msg.agent, msg.message, "chat");
                addTelemetry(`${msg.agent.toUpperCase()} is presenting: "${msg.message.substring(0, 45)}..."`);
                
                // Update consensus
                setConsensus(c => {
                  const newC = { ...c };
                  if (msg.agent === "Polaris") newC.segmentFound = true;
                  else if (msg.agent === "Luna") newC.leaksRecovered = true;
                  else if (msg.agent === "Vega") newC.roiForecasted = true;
                  else if (msg.agent === "Nova") newC.copyGenerated = true;
                  else if (msg.agent === "Atlas") newC.dispatchArmed = true;
                  return newC;
                });

                // Auto-expand reasoning for the latest message
                setOpenReasoning(o => ({ ...o, [currentStepIdx]: true }));

                return [...msgs, {
                  ...msg,
                  timestamp: new Date().toLocaleTimeString()
                }];
              }
              return msgs;
            });
          }
        }

        // Check if message step finished
        if (nextTime >= stepDurationMs) {
          clearInterval(interval);
          setElapsedTimeInCurrentStep(0);
          
          setCurrentStepIdx(curr => {
            const nextStep = curr + 1;
            if (nextStep >= debateScript.length) {
              // Debate fully complete!
              setDebateActive(false);
              setActiveSpeaker(null);
              setIsThinking(false);
              addTelemetry("Boardroom consensus reached. Operational directive armed.");
              return -1;
            } else {
              // Transition to next agent
              setIsThinking(true);
              const nextMsg = debateScript[nextStep];
              if (nextMsg) {
                setActiveSpeaker(nextMsg.agent);
                addTelemetry(`${nextMsg.agent.toUpperCase()} is checking database and running algorithms...`);
              }
              return nextStep;
            }
          });
          return 0;
        }

        return nextTime;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [debateActive, isPaused, currentStepIdx, debateScript, secondsPerMessage]);

  /* Initialize Debate Scenario */
  const triggerBoardroomDebate = async () => {
    if (debateActive) return;
    
    // Auto-change topic on every initialization
    let nextScenario = selectedScenario;
    if (SCENARIOS.length > 1) {
      while (nextScenario === selectedScenario) {
        nextScenario = Math.floor(Math.random() * SCENARIOS.length);
      }
      setSelectedScenario(nextScenario);
    }
    
    const fallbackScenario = SCENARIOS[nextScenario];
    let activeName = fallbackScenario.name;
    let activeDesc = fallbackScenario.description;

    // Temporarily set details, will update dynamically if Gemini succeeds
    setCurrentScenarioName(activeName);
    setCurrentScenarioDescription(activeDesc);

    setDebateActive(true);
    setDebateMsgs([]);
    setActiveSpeaker(null);
    setOpenReasoning({});
    setConsensus({
      segmentFound: false,
      leaksRecovered: false,
      roiForecasted: false,
      copyGenerated: false,
      dispatchArmed: false
    });
    setIsPaused(false);
    setElapsedTimeInCurrentStep(0);

    addTelemetry("Connecting neural executive nodes...");

    let generatedScript: BoardroomMessage[] = [];

    try {
      if (config.geminiKey) {
        addTelemetry("Querying Gemini to generate a unique random boardroom topic and debate...");
        try {
          const sys = `You are the ORBIT Neural Boardroom coordinator.
1. Generate an entirely unique random business marketing scenario name and description for an e-commerce or retail SaaS platform. Avoid standard churn or win-back topics if possible; think of interesting growth, seasonal sales, cart recovery, inventory surplus, VIP loyalty campaigns, localization, or holiday events.
2. Simulate a detailed, multi-round debate among 5 AI agents for this new scenario.
The debate MUST consist of exactly 15 messages (3 rounds where the 5 agents: Polaris, Luna, Vega, Nova, and Atlas speak in sequence) discussing, analyzing, challenging, and aligning on a strategy.

The agents are:
- Polaris (Audience Intelligence): Analyzes cohorts and identifies target groups.
- Luna (Recovery): Audits transaction logs, customer records, and identifies leakages.
- Vega (Predictive Analytics): Forecasts yields, ROI, and models conversion curves.
- Nova (Campaign Creator): Designs creative drops, copy variations, and messaging layouts.
- Atlas (Operations Dispatch): Verifies API channels, routes delivery pathways, and arms dispatch.

Format your response as a single valid JSON object matching this schema:
{
  "scenarioName": "Name of the generated scenario (e.g., 'Diwali Inventory Clearance')",
  "scenarioDescription": "Description of the scenario (1-2 sentences)",
  "messages": [
    {
      "agent": "Polaris" | "Luna" | "Vega" | "Nova" | "Atlas",
      "message": "speech in character (1-2 sentences)",
      "confidence": number,
      "reasoning": "thought process and algorithmic reasoning details",
      "stats": "short metric or stat (e.g. '432 profiles')"
    },
    ...
  ]
}
Do not return any markdown code block formatting. Only return the raw JSON object.`;

          const prompt = `Business type: "${businessType}". Please initialize a random unique scenario and simulate a 15-message debate between the agents.`;
          const res = await callGeminiAPI(prompt, sys, config.geminiKey);
          const parsed = parseGeminiJson<any>(res, null);
          
          if (parsed && parsed.scenarioName && parsed.scenarioDescription && Array.isArray(parsed.messages)) {
            activeName = parsed.scenarioName;
            activeDesc = parsed.scenarioDescription;
            setCurrentScenarioName(activeName);
            setCurrentScenarioDescription(activeDesc);
            generatedScript = parsed.messages;
            addTelemetry(`Successfully generated new topic: ${activeName}`);
          }
        } catch (err: any) {
          console.error("Boardroom consolidated Gemini API failed:", err);
          addTelemetry(`Gemini unavailable. Falling back to pre-defined scenario.`);
        }
      }

      // If Gemini failed or key not present, use the fallback script
      if (generatedScript.length === 0) {
        addTelemetry(`Running pre-defined topic: ${activeName}`);
        generatedScript = fallbackScenario.script as any;
      }

      // Load script and kick off state machine
      setDebateScript(generatedScript);
      setCurrentStepIdx(0);
      setIsThinking(true);
      setActiveSpeaker(generatedScript[0].agent);
      addTelemetry(`${generatedScript[0].agent.toUpperCase()} is running algorithms...`);

    } catch (err: any) {
      console.error("Boardroom debate preparation failed:", err);
      setDebateActive(false);
      setActiveSpeaker(null);
      addTelemetry(`Debate launch failed: ${err.message || err}`);
    }
  };

  const toggleReasoning = (idx: number) => {
    setOpenReasoning(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  return (
    <div className="flex-1 flex overflow-hidden bg-[#050816] relative">
      {/* Background Matrix overlays */}
      <div className="pointer-events-none absolute inset-0 space-grid opacity-35 z-0" />
      <div className="pointer-events-none absolute inset-0 bg-orbit-glow-blue opacity-15 z-0" />

      {/* ════════════════════════════════════════
          LEFT PANEL — MISSION CONTEXT & AGENT STATS
      ════════════════════════════════════════ */}
      <aside className="w-64 shrink-0 flex flex-col border-r border-gray-800/60 bg-gray-950/45 backdrop-blur-md p-4 space-y-4 overflow-y-auto relative z-10">
        {/* Mission Context */}
        <div className="orbit-panel p-3.5 border border-gray-850 bg-gray-900/10 space-y-3 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-orbit-glow-blue opacity-25 pointer-events-none" />
          <h2 className="font-space text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-800/60 pb-2">
            <Cpu size={13} className="text-blue-400" />
            Executive Context
          </h2>
          <div className="space-y-2.5">
            <div>
              <span className="font-mono text-[8px] text-gray-550 uppercase tracking-wider block">Directive Agenda</span>
              <select
                value={selectedScenario}
                onChange={e => {
                  const idx = Number(e.target.value);
                  setSelectedScenario(idx);
                  setCurrentScenarioName(SCENARIOS[idx].name);
                  setCurrentScenarioDescription(SCENARIOS[idx].description);
                }}
                disabled={debateActive}
                className="w-full bg-gray-950 border border-gray-800 rounded-lg p-2 font-mono text-[10px] text-white focus:outline-none focus:border-blue-500/50 mt-1 cursor-pointer"
              >
                {SCENARIOS.map((sc, idx) => (
                  <option key={idx} value={idx}>{sc.name.toUpperCase()}</option>
                ))}
              </select>
            </div>
            <p className="font-mono text-[9px] text-gray-400 leading-relaxed bg-black/40 p-2 rounded-lg border border-gray-900">
              {currentScenarioDescription}
            </p>
          </div>
        </div>

        {/* Live Agent Status */}
        <div className="space-y-2 flex-1">
          <h3 className="font-space text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-800/60 pb-2">
            <Users size={13} className="text-orbit-purple" />
            Executive Board
          </h3>
          
          <div className="flex flex-col gap-2">
            {(["Polaris", "Vega", "Nova", "Atlas", "Luna"] as const).map(agent => {
              const meta = AGENT_META[agent];
              const isSpeaker = activeSpeaker === agent;
              // dynamic load metric
              const loadVal = isSpeaker ? (isThinking ? 45 : 88) : 12 + Math.floor(Math.sin(Date.now() / 8000) * 10);
              return (
                <div
                  key={agent}
                  onClick={() => setSelectedAgent(agent)}
                  className={`p-3 rounded-xl border cursor-pointer hover:border-current hover:scale-[1.02] transition-all duration-300 ${meta.border} ${meta.bg} ${
                    isSpeaker ? "shadow-[0_0_20px_rgba(59,130,246,0.12)] border-blue-500/35" : ""
                  }`}
                  title={`View ${agent} profile`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${isSpeaker ? "animate-ping" : "animate-pulse"}`} style={{ backgroundColor: meta.color }} />
                      <span className="font-space font-bold text-xs text-white">{agent}</span>
                    </div>
                    <span className={`font-mono text-[8px] font-bold border px-1.5 py-0.5 rounded-full transition-all ${
                      isSpeaker 
                        ? isThinking 
                          ? "text-blue-300 border-blue-500/30 bg-blue-500/5 animate-pulse"
                          : "text-blue-400 border-blue-500/40 bg-blue-500/10 animate-pulse" 
                        : "text-orbit-success border-orbit-success/30 bg-orbit-success/5"
                    }`}>
                      {isSpeaker ? (isThinking ? "THINKING" : "SPEAKING") : "STANDBY"}
                    </span>
                  </div>
                  
                  <p className="font-mono text-[8px] text-gray-555 uppercase tracking-wide">{meta.role}</p>

                  <div className="mt-2.5 space-y-1">
                    <div className="flex justify-between text-[8px] font-mono text-gray-550">
                      <span>Thread Activity</span>
                      <span>{loadVal}% capacity</span>
                    </div>
                    <div className="w-full h-1 bg-gray-900 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-500" 
                        style={{ width: `${loadVal}%`, backgroundColor: meta.color }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </aside>

      {/* ════════════════════════════════════════
          CENTER PANEL — DISCUSSION ROUNDTABLE
      ════════════════════════════════════════ */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">
        
        {/* Workspace Title Header */}
        <div className="shrink-0 px-6 pt-4 bg-gray-950/20">
          <PageHeaderHUD
            title="Agent Boardroom"
            subtitle="LIVE AI COLLABORATION CHAMBER"
            onSelectAgent={setSelectedAgent}
            actions={
              <div className="flex flex-wrap items-center gap-3">
                {/* Speed Selector */}
                <div className="flex items-center bg-gray-950 border border-gray-800 rounded-lg p-0.5" title="Debate speed dial">
                  {(["normal", "fast", "instant"] as const).map(speed => (
                    <button
                      key={speed}
                      onClick={() => setDebateSpeed(speed)}
                      className={`px-2.5 py-1 rounded font-mono text-[9px] font-bold uppercase tracking-wider cursor-pointer transition-all ${
                        debateSpeed === speed
                          ? "bg-orbit-purple text-white shadow-[0_0_10px_rgba(139,92,246,0.4)]"
                          : "text-gray-400 hover:text-white"
                      }`}
                    >
                      {speed === "normal" ? "5 Min" : speed === "fast" ? "1 Min" : "Instant"}
                    </button>
                  ))}
                </div>

                {debateActive ? (
                  <div className="flex items-center gap-2">
                    {/* Play/Pause Button */}
                    <button
                      onClick={() => setIsPaused(p => !p)}
                      className="px-3.5 py-1.5 rounded-lg border border-gray-800 bg-gray-900/50 hover:bg-gray-900 text-xs font-mono font-bold uppercase text-white cursor-pointer transition-all flex items-center gap-1.5"
                    >
                      {isPaused ? <Play size={10} /> : <Pause size={10} />}
                      {isPaused ? "Resume" : "Pause"}
                    </button>
                    
                    {/* Stop Button */}
                    <button
                      onClick={() => {
                        setDebateActive(false);
                        setActiveSpeaker(null);
                        setIsThinking(false);
                        setCurrentStepIdx(-1);
                        setDebateMsgs([]);
                        addTelemetry("Boardroom debate aborted by operator.");
                      }}
                      className="px-3.5 py-1.5 rounded-lg border border-red-900/30 bg-red-950/20 hover:bg-red-950/40 text-xs font-mono font-bold uppercase text-red-400 cursor-pointer transition-all flex items-center gap-1.5"
                    >
                      <Square size={10} />
                      Stop
                    </button>

                    {/* Timer HUD */}
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-500/20 bg-blue-500/5 font-mono text-xs font-bold text-blue-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                      <span>{formatTime(timeLeft)} remaining</span>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={triggerBoardroomDebate}
                    className="px-5 py-2.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer bg-gradient-to-r from-orbit-purple to-pink-500 text-white shadow-orbit-glow-purple hover:opacity-90 hover:scale-[1.02] active:scale-95 duration-200"
                  >
                    <Zap size={13} />
                    Initialize Executive Debate
                  </button>
                )}
              </div>
            }
          />
        </div>

        {/* Progress Bar under header */}
        {debateActive && debateScript.length > 0 && (
          <div className="w-full bg-gray-950/40 px-6 py-1.5 border-b border-gray-900/40 shrink-0 animate-fade-in-up">
            <div className="flex items-center justify-between text-[8px] font-mono text-gray-555 mb-1">
              <span>DEBATE DELIBERATION PROGRESS</span>
              <span>{Math.round(((currentStepIdx) / debateScript.length) * 100)}%</span>
            </div>
            <div className="w-full h-1 bg-gray-900 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-orbit-purple to-blue-500 rounded-full transition-all duration-300"
                style={{ width: `${((currentStepIdx + elapsedTimeInCurrentStep / (secondsPerMessage * 1000)) / debateScript.length) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Center content container split: top roundtable, bottom scrolls */}
        <div className="flex-1 flex flex-col min-h-0">
          
          {/* Circular Holographic Roundtable Visualizer */}
          <div className="shrink-0 h-56 bg-gray-950/25 border-b border-gray-900/60 flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 radar-dots opacity-20" />
            
            {/* Active Agenda Overlay */}
            <div className="absolute top-3 left-4 font-mono text-[8px] text-gray-500 uppercase tracking-widest z-20">
              AGENDA: <span className="text-white font-bold">{currentScenarioName}</span>
            </div>

            {/* Pulsing Core center glow */}
            <div className={`absolute w-32 h-32 rounded-full border flex flex-col items-center justify-center transition-all duration-500 ${
              activeSpeaker 
                ? isThinking 
                  ? "border-blue-500/30 bg-blue-500/5 shadow-[0_0_25px_rgba(59,130,246,0.15)] scale-105" 
                  : "border-purple-500/30 bg-purple-500/10 shadow-[0_0_25px_rgba(139,92,246,0.15)] animate-orbit-pulse"
                : "border-gray-850 bg-gray-900/5"
            }`}>
              <div className="w-14 h-14 rounded-full bg-orbit-purple/15 border border-orbit-purple/30 flex items-center justify-center">
                {activeSpeaker ? (
                  <span className="font-space text-xs font-bold text-white uppercase tracking-wider animate-pulse">
                    {activeSpeaker.substring(0, 3)}
                  </span>
                ) : (
                  <Cpu size={18} className="text-white animate-pulse" />
                )}
              </div>
              {activeSpeaker && (
                <div className="font-mono text-[7px] text-gray-400 uppercase tracking-widest mt-1.5 animate-pulse">
                  {isThinking ? "Thinking..." : "Speaking"}
                </div>
              )}
            </div>

            {/* Roundtable SVG lines and nodes */}
            <svg className="w-64 h-64 relative overflow-visible z-10">
              <defs>
                <linearGradient id="laserGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.2" />
                </linearGradient>
                <linearGradient id="laserGradThinking" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#0EA5E9" stopOpacity="0.1" />
                </linearGradient>
              </defs>

              {/* Central table perimeter ring */}
              <circle cx="120" cy="120" r="70" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="3" />
              <circle cx="120" cy="120" r="70" fill="none" stroke="rgba(139,92,246,0.15)" strokeWidth="1" strokeDasharray="3, 6" />

              {/* Laser connecting lines from active speaker to table core */}
              {activeSpeaker && (
                <line
                  x1={AGENT_META[activeSpeaker].x}
                  y1={AGENT_META[activeSpeaker].y}
                  x2="120"
                  y2="120"
                  stroke={isThinking ? "url(#laserGradThinking)" : "url(#laserGrad)"}
                  strokeWidth="3.5"
                  strokeDasharray={isThinking ? "4, 4" : undefined}
                  style={{ filter: `drop-shadow(0 0 8px ${AGENT_META[activeSpeaker].color})` }}
                  className="animate-pulse"
                />
              )}

              {/* Render Roundtable nodes for each executive agent */}
              {(["Polaris", "Vega", "Nova", "Atlas", "Luna"] as const).map(agent => {
                const meta = AGENT_META[agent];
                const isSpeaking = activeSpeaker === agent;
                const Icon = meta.icon;

                return (
                  <g key={agent} className="transition-all duration-300 cursor-pointer hover:opacity-85" onClick={() => setSelectedAgent(agent)}>
                    <title>{`View ${agent} premium card`}</title>
                    {/* Ripple outer circle if speaking */}
                    {isSpeaking && (
                      <circle 
                        cx={meta.x} 
                        cy={meta.y} 
                        r="26" 
                        fill="none" 
                        stroke={meta.color} 
                        strokeWidth="1" 
                        className={isThinking ? "animate-pulse opacity-25" : "animate-ping opacity-45"}
                      />
                    )}

                    {/* Node background */}
                    <circle
                      cx={meta.x}
                      cy={meta.y}
                      r="18"
                      fill="#050816"
                      stroke={isSpeaking ? meta.color : "rgba(255,255,255,0.05)"}
                      strokeWidth={isSpeaking ? "2" : "1"}
                      style={isSpeaking ? { filter: `drop-shadow(0 0 8px ${meta.color})` } : {}}
                    />

                    {/* Agent Icon */}
                    <foreignObject x={meta.x - 7} y={meta.y - 7} width="14" height="14">
                      <Icon size={14} style={{ color: isSpeaking ? "#ffffff" : "#4b5563" }} />
                    </foreignObject>

                    {/* Micro sound wave equalizer bars if speaking */}
                    {isSpeaking && !isThinking && (
                      <g transform={`translate(${meta.x - 12}, ${meta.y + 22})`}>
                        {[...Array(5)].map((_, idx) => (
                          <rect
                            key={idx}
                            x={idx * 5}
                            y={0}
                            width="2.5"
                            height="4"
                            fill={meta.color}
                            className="bar-anim"
                            style={{
                              animationDelay: `${idx * 0.1}s`,
                              animationDuration: `${0.4 + Math.random() * 0.5}s`,
                              transformOrigin: "bottom"
                            }}
                          />
                        ))}
                      </g>
                    )}

                    {/* Agent Name HUD Label */}
                    <text
                      x={meta.x}
                      y={meta.y + (meta.y > 120 ? 32 : -25)}
                      fontFamily="monospace"
                      fontSize="7"
                      fontWeight="bold"
                      fill={isSpeaking ? "#ffffff" : "#4b5563"}
                      textAnchor="middle"
                      letterSpacing="1px"
                    >
                      {agent.toUpperCase()}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* AI Discussion Stream */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 pr-3">
            {debateMsgs.length === 0 && !isThinking && (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-center py-10">
                <div className="w-14 h-14 rounded-2xl bg-gray-900 border border-gray-850 flex items-center justify-center animate-pulse">
                  <MessageSquare size={20} className="text-gray-650" />
                </div>
                <div>
                  <h3 className="font-space text-sm font-bold text-white">Roundtable Standby</h3>
                  <p className="font-mono text-[9px] text-gray-550 max-w-xs leading-relaxed mt-1">
                    Select a directive agenda on the left and choose a speed dial, then click initialize to start the executive agent debate.
                  </p>
                </div>
              </div>
            )}

            {debateMsgs.map((msg, idx) => {
              const meta = AGENT_META[msg.agent];
              const isReasoningOpen = !!openReasoning[idx];
              return (
                <div 
                  key={idx} 
                  className="flex flex-col gap-2.5 animate-fade-in-up"
                  style={{ animationDelay: "50ms" }}
                >
                  {/* Message Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 cursor-pointer hover:opacity-85" onClick={() => setSelectedAgent(msg.agent)} title={`View ${msg.agent} profile`}>
                      <span className={`font-mono text-[10px] font-bold uppercase tracking-wider ${meta.text}`}>
                        {msg.agent}
                      </span>
                      <span className="font-mono text-[8px] text-gray-600">{msg.timestamp}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {msg.stats && (
                        <span className="font-mono text-[8px] text-gray-450 border border-gray-900 bg-gray-950 px-2 py-0.5 rounded-md uppercase">
                          {msg.stats}
                        </span>
                      )}
                      <span className="font-mono text-[8px] text-gray-400 border border-gray-800 bg-gray-900/40 px-2 py-0.5 rounded-full">
                        {msg.confidence}% confidence
                      </span>
                    </div>
                  </div>

                  {/* Speech Bubble */}
                  <div
                    className={`p-4 rounded-xl border transition-all duration-300 relative bg-[#0F172A] border-[rgba(255,255,255,0.06)]`}
                    style={{
                      borderLeft: `4px solid ${meta.color}`,
                      borderColor: activeSpeaker === msg.agent && idx === debateMsgs.length - 1 && !isThinking ? meta.color : undefined,
                      boxShadow: activeSpeaker === msg.agent && idx === debateMsgs.length - 1 && !isThinking ? `0 0 25px ${meta.color}25` : undefined
                    }}
                  >
                    <p className={`text-xs font-inter leading-relaxed text-gray-200`}>{msg.message}</p>
                    
                    {/* Glowing highlight point */}
                    <span className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full animate-ping" style={{ backgroundColor: meta.color }} />
                  </div>

                  {/* Expandable Reasoning Accordion */}
                  <div className="pl-3 border-l-2 border-gray-850 ml-1">
                    <button
                      onClick={() => toggleReasoning(idx)}
                      className="flex items-center gap-1 font-mono text-[8px] text-gray-555 hover:text-gray-300 uppercase tracking-wider cursor-pointer"
                    >
                      {isReasoningOpen ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                      <span>Deep Reasoning Trace</span>
                    </button>

                    {isReasoningOpen && (
                      <div className="mt-1.5 p-3 rounded-lg border border-gray-900 bg-black/40 font-mono text-[9px] text-gray-450 leading-relaxed animate-fade-in-up">
                        <div className="flex items-center gap-1.5 text-gray-500 mb-1 border-b border-gray-955 pb-1.5">
                          <Terminal size={10} className="text-purple-400" />
                          <span>ALGORITHM CRITERIA & DATA INPUTS</span>
                        </div>
                        <p className="italic">💭 {msg.reasoning}</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Deliberations thinking dots indicator */}
            {debateActive && activeSpeaker && (
              <div className="flex items-center gap-3 text-gray-500 py-2">
                <div className="flex gap-1.5 items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-orbit-purple animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-orbit-purple animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-orbit-purple animate-bounce [animation-delay:0.4s]" />
                </div>
                <span className="font-mono text-[9px] uppercase tracking-wider animate-pulse text-gray-455">
                  {isThinking 
                    ? `[${activeSpeaker.toUpperCase()}] Running cognitive scan algorithms...` 
                    : `[${activeSpeaker.toUpperCase()}] Broadcasting debate statement...`}
                </span>
              </div>
            )}
            
            <div ref={chatEndRef} />
          </div>
        </div>
      </main>

      {/* ════════════════════════════════════════
          RIGHT PANEL — CONSENSUS & SYSTEM TELEMETRY
      ════════════════════════════════════════ */}
      <aside className="w-64 shrink-0 flex flex-col border-l border-gray-800/60 bg-gray-950/45 backdrop-blur-md p-4 space-y-4 overflow-y-auto relative z-10">
        
        {/* Consensus checklist */}
        <div className="orbit-panel p-3.5 border border-gray-850 bg-gray-900/10 space-y-3">
          <h3 className="font-space text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-800/60 pb-2">
            <CheckCircle2 size={13} className="text-orbit-success" />
            Directive Consensus
          </h3>

          <div className="flex flex-col gap-2 font-mono text-[10px]">
            {[
              { id: "segmentFound", label: "Cohort Mapped", ok: consensus.segmentFound, agent: "Polaris" },
              { id: "leaksRecovered", label: "Leaks Audited", ok: consensus.leaksRecovered, agent: "Luna" },
              { id: "roiForecasted", label: "Yield ROI Predicted", ok: consensus.roiForecasted, agent: "Vega" },
              { id: "copyGenerated", label: "Campaign Assembled", ok: consensus.copyGenerated, agent: "Nova" },
              { id: "dispatchArmed", label: "Dispatch Channels Locked", ok: consensus.dispatchArmed, agent: "Atlas" },
            ].map(item => (
              <div 
                key={item.id}
                className={`flex items-center justify-between p-2 rounded-lg border transition-all ${
                  item.ok 
                    ? "border-green-500/20 bg-green-500/5 text-green-400" 
                    : "border-gray-900 bg-transparent text-gray-555"
                }`}
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={12} className={item.ok ? "text-green-400" : "text-gray-800"} />
                  <span className="font-semibold">{item.label}</span>
                </div>
                <span className="text-[8px] opacity-75">{item.agent}</span>
              </div>
            ))}
          </div>
        </div>

        {/* System Activity Feed Ticker */}
        <div className="flex-1 flex flex-col min-h-0 space-y-2">
          <h3 className="font-space text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <Activity size={13} className="text-blue-400" />
            Executive Activity Feed
          </h3>
          <p className="font-mono text-[8px] text-gray-550 uppercase">Background operations log</p>

          <div className="flex-1 overflow-y-auto bg-black/60 border border-gray-900 rounded-xl p-3 font-mono text-[8px] text-gray-450 space-y-2 scrollbar-thin">
            {telemetry.length === 0 ? (
              <p className="text-center py-6 text-gray-650">[ CONSOLE STANDBY ]</p>
            ) : (
              telemetry.map((log, i) => (
                <div 
                  key={i} 
                  className={`leading-relaxed border-b border-gray-950 pb-1 transition-all ${
                    log.includes("BOARDROOM") ? "text-orbit-purple font-bold" :
                    log.includes("complete") || log.includes("consensus") || log.includes("armed") ? "text-green-400" : ""
                  }`}
                  style={{ animation: "fadeInUp 0.3s ease" }}
                >
                  {log}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Corner Diagnostic indicator */}
        <div className="border-t border-gray-800/60 pt-3 flex items-center justify-between font-mono text-[8px] text-gray-650">
          <span>CONSENSUS PORT: 8443</span>
          <span className="text-blue-500 animate-pulse">NOMINAL LINK</span>
        </div>
      </aside>

      <AgentCardModal agent={selectedAgent} onClose={() => setSelectedAgent(null)} />
    </div>
  );
};
