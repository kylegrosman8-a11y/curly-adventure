// Initial data so all three views render with real-looking content on first run.
// Accounts are worked by multiple functions (Sales / COE / CX) at once; Sales
// streams carry a MEDDPICC scorecard so the qualification prompts have substance.
import { uid } from '../lib/id.js';
import { todayISO, addDays } from '../lib/dates.js';
import { emptyMeddpicc } from '../lib/meddpicc.js';

// Bump when the seed shape changes so existing installs re-seed cleanly.
export const SEED_VERSION = 2;

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
    // ---- NAB: a Sales opportunity + two COE delivery streams ----
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
        metrics: ['confirmed', 'Target 30% infra cost reduction (~$1.2M/yr), DR RTO < 1h.'],
        economicBuyer: ['unknown', ''],
        decisionCriteria: ['partial', 'Leaning on TCO + security posture; not yet formalised.'],
        decisionProcess: ['unknown', ''],
        paperProcess: ['partial', 'MSA in place; new SOW will need procurement sign-off.'],
        identifyPain: ['confirmed', 'Legacy platform hits EOL in Q3; audit pressure from regulator.'],
        champion: ['confirmed', 'Head of Infra is sponsoring and briefs us weekly.'],
        competition: ['partial', 'Incumbent SI is pitching a lift-and-shift alternative.'],
      }),
      notes: [],
    },
    {
      id: 'ws_nab_dr',
      accountId: 'ac_nab',
      function: 'coe',
      title: 'Disaster Recovery Migration',
      ownerId: 'tm_priya',
      startDate: addDays(today, -20),
      endDate: addDays(today, 25),
      percentComplete: 55,
      status: 'on_track',
      lastTouched: addDays(today, -2),
      value: 480000,
      notes: [],
    },
    {
      id: 'ws_nab_data',
      accountId: 'ac_nab',
      function: 'coe',
      title: 'Data Platform Consolidation',
      ownerId: 'tm_tom',
      startDate: addDays(today, -40),
      endDate: addDays(today, 10),
      percentComplete: 70,
      status: 'slipping',
      lastTouched: addDays(today, -13),
      value: 920000,
      notes: [],
    },

    // ---- Kelsian: a Sales opportunity + COE + CX ----
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
        metrics: ['partial', 'Rough ROI floated; needs their baseline numbers.'],
        economicBuyer: ['confirmed', 'CFO is the budget owner and is engaged.'],
        decisionCriteria: ['unknown', ''],
        decisionProcess: ['unknown', ''],
        paperProcess: ['unknown', ''],
        identifyPain: ['confirmed', 'Manual fleet reporting; no real-time view across operators.'],
        champion: ['partial', 'Ops manager is warm but lacks budget power.'],
        competition: ['unknown', ''],
      }),
      notes: [],
    },
    {
      id: 'ws_kel_sec',
      accountId: 'ac_kelsian',
      function: 'coe',
      title: 'Security Review & SSO',
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
      workstreamId: 'ws_nab_dr',
      date: addDays(today, -2),
      author: 'Priya Nair',
      text: 'Failover test passed in the secondary region. Awaiting NAB infra sign-off on runbook.',
    },
    {
      id: uid('note'),
      workstreamId: 'ws_nab_data',
      date: addDays(today, -13),
      author: 'Tom Reilly',
      text: 'Schema mapping slipped a week — upstream team reprioritised. Flagged to sponsor.',
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
      workstreamId: 'ws_kel_sec',
      date: addDays(today, -16),
      author: 'Priya Nair',
      text: 'Blocked waiting on Kelsian IdP admin access. Escalated to their security lead.',
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
      workstreamId: 'ws_nab_dr',
      ownerId: 'tm_priya',
      text: 'Chase NAB infra for runbook sign-off',
      dueDate: addDays(today, 3),
      status: 'open',
      createdAt: addDays(today, -2),
    },
    {
      id: uid('act'),
      workstreamId: 'ws_nab_data',
      ownerId: 'tm_tom',
      text: 'Re-baseline schema mapping timeline with upstream team',
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
      workstreamId: 'ws_kel_sec',
      ownerId: 'tm_priya',
      text: 'Escalate IdP admin access blocker to Kelsian security lead',
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
