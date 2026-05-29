// Central data store. Holds the whole dataset in memory (fast to render) and
// writes through to IndexedDB on every mutation. Exposed via React context.
import { createContext, useContext, useEffect, useMemo, useReducer, useCallback } from 'react';
import * as db from '../db/db.js';
import { uid } from '../lib/id.js';
import { todayISO } from '../lib/dates.js';
import { normaliseMeddpicc, emptyMeddpicc } from '../lib/meddpicc.js';

const StoreContext = createContext(null);

const initialState = {
  loading: true,
  accounts: [],
  team: [],
  workstreams: [],
  notes: [],
  actionItems: [],
  checkins: [],
  milestones: [],
};

function reducer(state, action) {
  switch (action.type) {
    case 'LOADED':
      return { ...state, ...action.payload, loading: false };
    case 'UPSERT': {
      const { collection, record } = action;
      const existing = state[collection];
      const idx = existing.findIndex((r) => r.id === record.id);
      const next = idx >= 0
        ? existing.map((r) => (r.id === record.id ? record : r))
        : [...existing, record];
      return { ...state, [collection]: next };
    }
    case 'UPSERT_MANY': {
      const { collection, records } = action;
      const map = new Map(state[collection].map((r) => [r.id, r]));
      for (const r of records) map.set(r.id, r);
      return { ...state, [collection]: Array.from(map.values()) };
    }
    case 'REMOVE':
      return {
        ...state,
        [action.collection]: state[action.collection].filter((r) => r.id !== action.id),
      };
    default:
      return state;
  }
}

// collection name -> IndexedDB store name
const STORE_MAP = {
  accounts: 'accounts',
  team: 'team',
  workstreams: 'workstreams',
  notes: 'notes',
  actionItems: 'actionItems',
  checkins: 'checkins',
  milestones: 'milestones',
};

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    db.loadAll().then((data) => dispatch({ type: 'LOADED', payload: data }));
  }, []);

  const upsert = useCallback((collection, record) => {
    dispatch({ type: 'UPSERT', collection, record });
    db.put(STORE_MAP[collection], record);
    return record;
  }, []);

  const upsertMany = useCallback((collection, records) => {
    dispatch({ type: 'UPSERT_MANY', collection, records });
    db.putMany(STORE_MAP[collection], records);
    return records;
  }, []);

  const removeRecord = useCallback((collection, id) => {
    dispatch({ type: 'REMOVE', collection, id });
    db.remove(STORE_MAP[collection], id);
  }, []);

  // ---- Domain actions -----------------------------------------------------

  const updateWorkstream = useCallback(
    (id, patch, { touch = false } = {}) => {
      const ws = state.workstreams.find((w) => w.id === id);
      if (!ws) return null;
      const next = { ...ws, ...patch };
      if (touch) next.lastTouched = todayISO();
      return upsert('workstreams', next);
    },
    [state.workstreams, upsert]
  );

  // Update a single MEDDPICC element on a sales workstream. Touches lastTouched
  // so qualification work counts as activity.
  const updateMeddpicc = useCallback(
    (workstreamId, elementKey, patch) => {
      const ws = state.workstreams.find((w) => w.id === workstreamId);
      if (!ws) return null;
      const card = normaliseMeddpicc(ws.meddpicc);
      const next = { ...card, [elementKey]: { ...card[elementKey], ...patch } };
      return upsert('workstreams', { ...ws, meddpicc: next, lastTouched: todayISO() });
    },
    [state.workstreams, upsert]
  );

  const addNote = useCallback(
    (workstreamId, text, author) => {
      if (!text || !text.trim()) return null;
      const note = {
        id: uid('note'),
        workstreamId,
        date: todayISO(),
        author: author || 'Me',
        text: text.trim(),
      };
      upsert('notes', note);
      // Touching a workstream with a note refreshes its lastTouched.
      updateWorkstream(workstreamId, {}, { touch: true });
      return note;
    },
    [upsert, updateWorkstream]
  );

  const addActionItem = useCallback(
    (fields) => {
      const item = {
        id: uid('act'),
        workstreamId: fields.workstreamId || null,
        ownerId: fields.ownerId || null,
        text: fields.text || '',
        dueDate: fields.dueDate || null,
        status: fields.status || 'open',
        createdAt: todayISO(),
      };
      return upsert('actionItems', item);
    },
    [upsert]
  );

  const updateActionItem = useCallback(
    (id, patch) => {
      const item = state.actionItems.find((a) => a.id === id);
      if (!item) return null;
      return upsert('actionItems', { ...item, ...patch });
    },
    [state.actionItems, upsert]
  );

  const addMilestone = useCallback(
    (fields) => {
      const m = {
        id: uid('ms'),
        accountId: fields.accountId || null,
        workstreamId: fields.workstreamId || null,
        phase: fields.phase || null,
        date: fields.date || todayISO(),
        label: fields.label || 'Milestone',
        note: fields.note || '',
        type: fields.type || 'milestone',
      };
      return upsert('milestones', m);
    },
    [upsert]
  );

  const updateMilestone = useCallback(
    (id, patch) => {
      const m = state.milestones.find((x) => x.id === id);
      if (!m) return null;
      return upsert('milestones', { ...m, ...patch });
    },
    [state.milestones, upsert]
  );

  const deleteMilestone = useCallback((id) => removeRecord('milestones', id), [removeRecord]);

  // ---- Workstream create / delete -----------------------------------------
  const createWorkstream = useCallback(
    (fields) => {
      const isSales = fields.function === 'sales';
      const ws = {
        id: uid('ws'),
        accountId: fields.accountId,
        function: fields.function || 'coe',
        coeType: fields.function === 'coe' ? fields.coeType || null : null,
        phase: fields.phase || '',
        title: fields.title || 'New workstream',
        ownerId: fields.ownerId || null,
        startDate: fields.startDate || todayISO(),
        endDate: fields.endDate || todayISO(),
        percentComplete: Number(fields.percentComplete) || 0,
        status: fields.status || 'not_started',
        lastTouched: todayISO(),
        value: Number(fields.value) || 0,
        meddpicc: isSales ? emptyMeddpicc() : undefined,
        notes: [],
      };
      return upsert('workstreams', ws);
    },
    [upsert]
  );

  const deleteWorkstream = useCallback(
    (id) => {
      // Cascade: remove the stream's notes, actions and milestones.
      state.notes.filter((n) => n.workstreamId === id).forEach((n) => removeRecord('notes', n.id));
      state.actionItems.filter((a) => a.workstreamId === id).forEach((a) => removeRecord('actionItems', a.id));
      state.milestones.filter((m) => m.workstreamId === id).forEach((m) => removeRecord('milestones', m.id));
      removeRecord('workstreams', id);
    },
    [state.notes, state.actionItems, state.milestones, removeRecord]
  );

  // ---- Account create / update / delete -----------------------------------
  const createAccount = useCallback(
    (fields) => upsert('accounts', { id: uid('ac'), name: fields.name || 'New account', owner: fields.owner || '', color: fields.color || '#6d5efc', roadmap: fields.roadmap || {} }),
    [upsert]
  );

  const updateAccount = useCallback(
    (id, patch) => {
      const a = state.accounts.find((x) => x.id === id);
      if (!a) return null;
      return upsert('accounts', { ...a, ...patch });
    },
    [state.accounts, upsert]
  );

  const deleteAccount = useCallback(
    (id) => {
      const streams = state.workstreams.filter((w) => w.accountId === id);
      streams.forEach((w) => deleteWorkstream(w.id));
      state.milestones.filter((m) => m.accountId === id).forEach((m) => removeRecord('milestones', m.id));
      removeRecord('accounts', id);
    },
    [state.workstreams, state.milestones, deleteWorkstream, removeRecord]
  );

  // ---- Team member create / update / delete -------------------------------
  const addMember = useCallback(
    (fields) => upsert('team', { id: uid('tm'), name: fields.name || 'New member', role: fields.role || '' }),
    [upsert]
  );

  const updateMember = useCallback(
    (id, patch) => {
      const m = state.team.find((x) => x.id === id);
      if (!m) return null;
      return upsert('team', { ...m, ...patch });
    },
    [state.team, upsert]
  );

  const deleteMember = useCallback(
    (id) => {
      // Unassign the member from any streams/actions they owned.
      state.workstreams.filter((w) => w.ownerId === id).forEach((w) => upsert('workstreams', { ...w, ownerId: null }));
      state.actionItems.filter((a) => a.ownerId === id).forEach((a) => upsert('actionItems', { ...a, ownerId: null }));
      removeRecord('team', id);
    },
    [state.workstreams, state.actionItems, upsert, removeRecord]
  );

  const saveCheckin = useCallback(
    (session) => {
      const record = {
        id: uid('chk'),
        date: todayISO(),
        ...session,
      };
      return upsert('checkins', record);
    },
    [upsert]
  );

  const resetData = useCallback(async () => {
    await db.resetDatabase();
    const data = await db.loadAll();
    dispatch({ type: 'LOADED', payload: data });
  }, []);

  const value = useMemo(
    () => ({
      ...state,
      upsert,
      upsertMany,
      removeRecord,
      updateWorkstream,
      updateMeddpicc,
      addNote,
      addActionItem,
      updateActionItem,
      addMilestone,
      updateMilestone,
      deleteMilestone,
      createWorkstream,
      deleteWorkstream,
      createAccount,
      updateAccount,
      deleteAccount,
      addMember,
      updateMember,
      deleteMember,
      saveCheckin,
      resetData,
    }),
    [
      state,
      upsert,
      upsertMany,
      removeRecord,
      updateWorkstream,
      updateMeddpicc,
      addNote,
      addActionItem,
      updateActionItem,
      addMilestone,
      updateMilestone,
      deleteMilestone,
      createWorkstream,
      deleteWorkstream,
      createAccount,
      updateAccount,
      deleteAccount,
      addMember,
      updateMember,
      deleteMember,
      saveCheckin,
      resetData,
    ]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}

// Convenience selectors -----------------------------------------------------

export function useLookups() {
  const { accounts, team, workstreams } = useStore();
  return useMemo(() => {
    const accountById = new Map(accounts.map((a) => [a.id, a]));
    const memberById = new Map(team.map((m) => [m.id, m]));
    const workstreamById = new Map(workstreams.map((w) => [w.id, w]));
    return { accountById, memberById, workstreamById };
  }, [accounts, team, workstreams]);
}

export function initials(name) {
  if (!name) return '—';
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}
