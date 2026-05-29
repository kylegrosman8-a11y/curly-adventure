// Initial data so all three views render with real-looking content on first run.
// Accounts are worked by multiple functions (Sales / COE / CX) at once; Sales
// streams carry a MEDDPICC scorecard so the qualification prompts have substance.
import { uid } from '../lib/id.js';
import { todayISO, addDays } from '../lib/dates.js';
import { emptyMeddpicc } from '../lib/meddpicc.js';

// Bump when the seed shape changes so existing installs re-seed cleanly.
export const SEED_VERSION = 3;

// Helper to build a MEDDPICC scorecard from a compact spec.
function meddpicc(spec) {
  const m = emptyMeddpicc();
  for (const [k, [state, note]] of Object.entries(spec)) m[k] = { state, note: note || '' };
  return m;
}

export function buildSeed() {
  const today = todayISO();

  const team = [
    { id: 'tm_priya', name: 'Priya Nair', role: 'Solutions Engineer' },
    { id: 'tm_marcus', name: 'Marcus Webb', role: 'Account Executive' },
    { id: 'tm_jin', name: 'Jin Park', role: 'Customer Success' },
    { id: 'tm_sara', name: 'Sara Okafor', role: 'Delivery Lead' },
    { id: 'tm_tom', name: 'Tom Reilly', role: 'Pre-Sales Architect' },
  ];

  const accounts = [
    { id: 'ac_nab', name: 'NAB', owner: 'Marcus Webb', color: '#1a2b4a' },
    { id: 'ac_kelsian', name: 'Kelsian', owner: 'Priya Nair', color: '#0e7490' },
    { id: 'ac_canva', name: 'Canva', owner: 'Jin Park', color: '#7c3aed' },
    { id: 'ac_crown', name: 'Crown Resorts', owner: 'Sara Okafor', color: '#b45309' },
    { id: 'ac_hj', name: "Hungry Jack's / COMGROUP", owner: 'Tom Reilly', color: '#be123c' },
    { id: 'ac_gyg', name: 'GYG', owner: 'Marcus Webb', color: '#15803d' },
    { id: 'ac_nine', name: 'Nine Entertainment', owner: 'Jin Park', color: '#1d4ed8' },
    { id: 'ac_seven', name: 'Seven West Media', owner: 'Sara Okafor', color: '#9333ea' },
  ];

  const workstreams = [
    // ---- NAB: a Sales opportunity + two different COEs (FINS, Planning) ----
    {
      id: 'ws_nab_expansion',
      accountId: 'ac_nab',
      function: 'sales',
      title: 'Platform Expansion — FY26 Renewal + Upsell',
      ownerId: 'tm_marcus',
      startDate: addDays(today, -15),
      endDate: addDays(today, 60),
      percentComplete: 40,
      status: 'on_track',
      lastTouched: addDays(today, -3),
      value: 1_200_000,
      meddpicc: meddpicc({
        metrics: ['green', 'Target 30% finance-ops cost reduction (~$1.2M/yr), close in 3 days.'],
        economicBuyer: ['red', ''],
        decisionCriteria: ['amber', 'Leaning on TCO + integration depth; not yet formalised.'],
        decisionProcess: ['red', ''],
        paperProcess: ['amber', 'MSA in place; new SOW will need procurement sign-off.'],
        identifyPain: ['green', 'Legacy platform hits EOL in Q3; audit pressure from regulator.'],
        champion: ['green', 'Head of Finance Transformation is sponsoring and briefs us weekly.'],
        competition: ['amber', 'Incumbent SI is pitching a lift-and-shift alternative.'],
      }),
      notes: [],
    },
    {
      id: 'ws_nab_fins',
      accountId: 'ac_nab',
      function: 'coe',
      coeType: 'fins',
      title: 'Financials Core — Go-Live',
      ownerId: 'tm_tom',
      startDate: addDays(today, -40),
      endDate: addDays(today, 10),
      percentComplete: 70,
      status: 'slipping',
      lastTouched: addDays(today, -13),
      value: 920000,
      notes: [],
    },
    {
      id: 'ws_nab_planning',
      accountId: 'ac_nab',
      function: 'coe',
      coeType: 'planning',
      title: 'Adaptive Planning Rollout',
      ownerId: 'tm_priya',
      startDate: addDays(today, -20),
      endDate: addDays(today, 25),
      percentComplete: 55,
      status: 'on_track',
      lastTouched: addDays(today, -2),
      value: 480000,
      notes: [],
    },

    // ---- Kelsian: a Sales opportunity + an Extend COE + a CX rollout ----
    {
      id: 'ws_kel_analytics',
      accountId: 'ac_kelsian',
      function: 'sales',
      title: 'Analytics Suite — New Logo',
      ownerId: 'tm_marcus',
      startDate: addDays(today, -8),
      endDate: addDays(today, 70),
      percentComplete: 20,
      status: 'slipping',
      lastTouched: addDays(today, -6),
      value: 600000,
      meddpicc: meddpicc({
        metrics: ['amber', 'Rough ROI floated; needs their baseline numbers.'],
        economicBuyer: ['green', 'CFO is the budget owner and is engaged.'],
        decisionCriteria: ['red', ''],
        decisionProcess: ['red', ''],
        paperProcess: ['red', ''],
        identifyPain: ['green', 'Manual fleet reporting; no real-time view across operators.'],
        champion: ['amber', 'Ops manager is warm but lacks budget power.'],
        competition: ['red', ''],
      }),
      notes: [],
    },
    {
      id: 'ws_kel_extend',
      accountId: 'ac_kelsian',
      function: 'coe',
      coeType: 'extend',
      title: 'Extend — Driver Operations App',
      ownerId: 'tm_priya',
      startDate: addDays(today, -5),
      endDate: addDays(today, 30),
      percentComplete: 15,
      status: 'blocked',
      lastTouched: addDays(today, -16),
      value: 210000,
      notes: [],
    },
    {
      id: 'ws_kel_fleet',
      accountId: 'ac_kelsian',
      function: 'cx',
      title: 'Fleet Telematics Rollout',
      ownerId: 'tm_sara',
      startDate: addDays(today, -10),
      endDate: addDays(today, 50),
      percentComplete: 30,
      status: 'on_track',
      lastTouched: addDays(today, -1),
      value: 350000,
      notes: [],
    },
  ];

  const notes = [
    {
      id: uid('note'),
      workstreamId: 'ws_nab_expansion',
      date: addDays(today, -3),
      author: 'Marcus Webb',
      text: 'Sponsor confirmed budget exists but wouldn\'t name the signer — still need the economic buyer.',
    },
    {
      id: uid('note'),
      workstreamId: 'ws_nab_planning',
      date: addDays(today, -2),
      author: 'Priya Nair',
      text: 'Driver-based model validated in test. Awaiting NAB finance sign-off on planning templates.',
    },
    {
      id: uid('note'),
      workstreamId: 'ws_nab_fins',
      date: addDays(today, -13),
      author: 'Tom Reilly',
      text: 'Period-close config slipped a week — data owners reprioritised the migration. Flagged to sponsor.',
    },
    {
      id: uid('note'),
      workstreamId: 'ws_kel_analytics',
      date: addDays(today, -6),
      author: 'Marcus Webb',
      text: 'CFO engaged and owns the budget. No view yet on how/when they decide — chase decision process.',
    },
    {
      id: uid('note'),
      workstreamId: 'ws_kel_extend',
      date: addDays(today, -16),
      author: 'Priya Nair',
      text: 'Blocked waiting on Kelsian tenant admin access for the Extend build. Escalated to their platform lead.',
    },
    {
      id: uid('note'),
      workstreamId: 'ws_kel_fleet',
      date: addDays(today, -1),
      author: 'Sara Okafor',
      text: 'Pilot vehicles instrumented. First telemetry flowing to dashboard.',
    },
  ];

  const actionItems = [
    {
      id: uid('act'),
      workstreamId: 'ws_nab_expansion',
      ownerId: 'tm_marcus',
      text: 'Get introduced to the economic buyer (budget signer) via the sponsor',
      dueDate: addDays(today, 4),
      status: 'open',
      createdAt: addDays(today, -3),
    },
    {
      id: uid('act'),
      workstreamId: 'ws_nab_planning',
      ownerId: 'tm_priya',
      text: 'Chase NAB finance for planning template sign-off',
      dueDate: addDays(today, 3),
      status: 'open',
      createdAt: addDays(today, -2),
    },
    {
      id: uid('act'),
      workstreamId: 'ws_nab_fins',
      ownerId: 'tm_tom',
      text: 'Re-baseline financials data-migration timeline with the data owners',
      dueDate: addDays(today, -1),
      status: 'open',
      createdAt: addDays(today, -13),
    },
    {
      id: uid('act'),
      workstreamId: 'ws_kel_analytics',
      ownerId: 'tm_marcus',
      text: 'Map the decision process and paper/procurement path with the CFO\'s office',
      dueDate: addDays(today, 5),
      status: 'open',
      createdAt: addDays(today, -6),
    },
    {
      id: uid('act'),
      workstreamId: 'ws_kel_extend',
      ownerId: 'tm_priya',
      text: 'Escalate Extend tenant admin access blocker to Kelsian platform lead',
      dueDate: addDays(today, 1),
      status: 'blocked',
      createdAt: addDays(today, -16),
    },
    {
      id: uid('act'),
      workstreamId: 'ws_kel_fleet',
      ownerId: 'tm_sara',
      text: 'Schedule pilot review with Kelsian ops manager',
      dueDate: addDays(today, 6),
      status: 'open',
      createdAt: addDays(today, -1),
    },
  ];

  return { accounts, team, workstreams, notes, actionItems, checkins: [] };
}
