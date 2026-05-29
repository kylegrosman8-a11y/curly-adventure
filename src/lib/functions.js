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

export function functionMeta(id) {
  return FUNCTIONS[id] || { id, label: id, short: id, color: '#64748b' };
}

export function isSales(ws) {
  return ws?.function === 'sales';
}
