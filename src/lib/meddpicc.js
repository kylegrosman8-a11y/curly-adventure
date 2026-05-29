// MEDDPICC qualification model for Sales streams.
// Each element is tracked as unknown | partial | confirmed, with an optional
// note. The score and gap list drive the portfolio meter, the check-in prompts,
// and the AI coach.

export const MEDDPICC_ELEMENTS = [
  {
    key: 'metrics',
    letter: 'M',
    label: 'Metrics',
    hint: 'Quantified business value / success metrics the customer will measure.',
    prompt: 'What measurable outcome does this unlock, in their numbers?',
  },
  {
    key: 'economicBuyer',
    letter: 'E',
    label: 'Economic Buyer',
    hint: 'The person who controls the budget and can say yes.',
    prompt: 'Who actually controls the budget and signs — and have you met them?',
  },
  {
    key: 'decisionCriteria',
    letter: 'D',
    label: 'Decision Criteria',
    hint: 'The criteria they will use to choose a solution.',
    prompt: 'On what criteria will they decide, and are yours the ones that win?',
  },
  {
    key: 'decisionProcess',
    letter: 'D',
    label: 'Decision Process',
    hint: 'The steps, approvals and timeline to a decision.',
    prompt: 'What are the exact steps and dates from here to a signed decision?',
  },
  {
    key: 'paperProcess',
    letter: 'P',
    label: 'Paper Process',
    hint: 'Procurement, legal, security and contracting path.',
    prompt: 'What does procurement/legal/security require, and how long does it take?',
  },
  {
    key: 'identifyPain',
    letter: 'I',
    label: 'Identify Pain',
    hint: 'The compelling, cost-of-inaction business pain.',
    prompt: 'What is the compelling pain — and what happens if they do nothing?',
  },
  {
    key: 'champion',
    letter: 'C',
    label: 'Champion',
    hint: 'An internal advocate with power and access who sells for you.',
    prompt: 'Who is selling for you internally — and do they have real power?',
  },
  {
    key: 'competition',
    letter: 'C',
    label: 'Competition',
    hint: 'Alternatives in play, including incumbent and do-nothing.',
    prompt: 'Who/what are you really competing against, including the status quo?',
  },
];

export const MEDDPICC_KEYS = MEDDPICC_ELEMENTS.map((e) => e.key);

// Red / Amber / Green per element: red = gap / at risk, amber = in progress /
// partial, green = solid / confirmed.
export const MEDDPICC_STATES = {
  red: { id: 'red', label: 'Red', weight: 0, color: '#dc2626', meaning: 'Gap / at risk' },
  amber: { id: 'amber', label: 'Amber', weight: 0.5, color: '#d97706', meaning: 'In progress' },
  green: { id: 'green', label: 'Green', weight: 1, color: '#16a34a', meaning: 'Solid' },
};

export const MEDDPICC_STATE_ORDER = ['red', 'amber', 'green'];

/** A fresh scorecard — everything starts red (an unfilled element is a gap). */
export function emptyMeddpicc() {
  const m = {};
  for (const k of MEDDPICC_KEYS) m[k] = { state: 'red', note: '' };
  return m;
}

/** Normalise any stored shape into a complete scorecard, migrating old states. */
export function normaliseMeddpicc(m) {
  const base = emptyMeddpicc();
  if (!m) return base;
  // Back-compat with the earlier unknown/partial/confirmed model.
  const legacy = { unknown: 'red', partial: 'amber', confirmed: 'green' };
  for (const k of MEDDPICC_KEYS) {
    const cell = m[k];
    if (!cell) continue;
    const state = MEDDPICC_STATES[cell.state] ? cell.state : legacy[cell.state];
    if (state) base[k] = { state, note: cell.note || '' };
  }
  return base;
}

/** Score a scorecard: counts, weighted 0..1 score, and a 0..100 percentage. */
export function scoreMeddpicc(m) {
  const card = normaliseMeddpicc(m);
  let green = 0;
  let amber = 0;
  let weight = 0;
  for (const k of MEDDPICC_KEYS) {
    const s = card[k].state;
    weight += MEDDPICC_STATES[s].weight;
    if (s === 'green') green += 1;
    else if (s === 'amber') amber += 1;
  }
  const total = MEDDPICC_KEYS.length;
  return {
    green,
    amber,
    red: total - green - amber,
    total,
    score: weight / total, // 0..1
    pct: Math.round((weight / total) * 100),
  };
}

/** Health band for colour-coding the meter. */
export function meddpiccBand(pct) {
  if (pct >= 75) return { id: 'strong', label: 'Well qualified', color: '#16a34a' };
  if (pct >= 45) return { id: 'developing', label: 'Developing', color: '#d97706' };
  return { id: 'weak', label: 'Under-qualified', color: '#dc2626' };
}

/**
 * Gaps to chase, worst first (unknown before partial). Used for check-in prompts
 * and to focus the AI coach.
 */
export function meddpiccGaps(m) {
  const card = normaliseMeddpicc(m);
  return MEDDPICC_ELEMENTS.filter((e) => card[e.key].state !== 'green')
    .map((e) => ({ ...e, state: card[e.key].state, note: card[e.key].note }))
    .sort((a, b) => (a.state === b.state ? 0 : a.state === 'red' ? -1 : 1));
}

/** Per-element ordered list with current values, for rendering the scorecard. */
export function meddpiccRows(m) {
  const card = normaliseMeddpicc(m);
  return MEDDPICC_ELEMENTS.map((e) => ({ ...e, ...card[e.key] }));
}
