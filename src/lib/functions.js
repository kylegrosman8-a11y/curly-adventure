// The function/discipline a workstream belongs to. An account is worked by
// several functions at once (Sales, COE, CX), each typically running multiple
// streams — so this is a first-class dimension, not just an owner's job title.
export const FUNCTIONS = {
  sales: { id: 'sales', label: 'Sales', short: 'Sales', color: '#e8833a' },
  coe: { id: 'coe', label: 'COE', short: 'COE', color: '#0e7490', full: 'Centre of Excellence' },
  cx: { id: 'cx', label: 'CX', short: 'CX', color: '#7c3aed', full: 'Customer Experience' },
};

// Display order for sub-lanes / filters.
export const FUNCTION_ORDER = ['sales', 'coe', 'cx'];

// COE is not a single team — it's many product COEs, each running its own
// streams. A workstream with function 'coe' carries a `coeType` saying which.
export const COE_TYPES = {
  extend: { id: 'extend', label: 'Extend COE', short: 'Extend' },
  talent_ai: { id: 'talent_ai', label: 'Talent AI COE', short: 'Talent AI' },
  fins: { id: 'fins', label: 'FINS COE', short: 'FINS' },
  planning: { id: 'planning', label: 'Planning COE', short: 'Planning' },
  vndly: { id: 'vndly', label: 'VNDLY COE', short: 'VNDLY' },
  clm: { id: 'clm', label: 'CLM COE', short: 'CLM' },
  sana_enterprise: { id: 'sana_enterprise', label: 'SANA Enterprise COE', short: 'SANA Ent' },
  sana_learning: { id: 'sana_learning', label: 'SANA Learning COE', short: 'SANA Learn' },
};

export const COE_TYPE_ORDER = [
  'extend',
  'talent_ai',
  'fins',
  'planning',
  'vndly',
  'clm',
  'sana_enterprise',
  'sana_learning',
];

export function functionMeta(id) {
  return FUNCTIONS[id] || { id, label: id, short: id, color: '#64748b' };
}

export function coeTypeMeta(id) {
  return COE_TYPES[id] || (id ? { id, label: id, short: id } : null);
}

/** Full discipline label, e.g. "FINS COE" for a COE stream, else the function. */
export function disciplineLabel(ws) {
  if (ws?.function === 'coe' && ws.coeType) return coeTypeMeta(ws.coeType).label;
  return functionMeta(ws?.function).label;
}

export function isSales(ws) {
  return ws?.function === 'sales';
}
