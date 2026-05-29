import { useState } from 'react';
import { useStore } from '../../store/store.jsx';
import { Modal } from '../shared/ui.jsx';
import { Text, Num, Select, FormActions, Label } from './formkit.jsx';
import { FUNCTION_ORDER, functionMeta, COE_TYPE_ORDER, coeTypeMeta } from '../../lib/functions.js';
import { STATUS_ORDER, STATUSES } from '../../lib/status.js';
import { addDays, todayISO } from '../../lib/dates.js';

// Create or edit a workstream. Pass `workstream` to edit, or `defaults` to create.
export default function WorkstreamForm({ open, onClose, workstream, defaults = {} }) {
  const store = useStore();
  const editing = Boolean(workstream);
  const [f, setF] = useState(() => ({
    accountId: workstream?.accountId ?? defaults.accountId ?? store.accounts[0]?.id ?? '',
    function: workstream?.function ?? defaults.function ?? 'coe',
    coeType: workstream?.coeType ?? defaults.coeType ?? 'fins',
    phase: workstream?.phase ?? '',
    title: workstream?.title ?? '',
    ownerId: workstream?.ownerId ?? store.team[0]?.id ?? '',
    startDate: workstream?.startDate ?? todayISO(),
    endDate: workstream?.endDate ?? addDays(todayISO(), 30),
    value: workstream?.value ?? 0,
    status: workstream?.status ?? 'not_started',
    percentComplete: workstream?.percentComplete ?? 0,
  }));
  const set = (k) => (v) => setF((s) => ({ ...s, [k]: v }));

  function save() {
    if (!f.title.trim() || !f.accountId) return;
    if (editing) {
      store.updateWorkstream(workstream.id, {
        accountId: f.accountId,
        function: f.function,
        coeType: f.function === 'coe' ? f.coeType : null,
        phase: f.phase,
        title: f.title.trim(),
        ownerId: f.ownerId,
        startDate: f.startDate,
        endDate: f.endDate,
        value: Number(f.value) || 0,
        status: f.status,
        percentComplete: Number(f.percentComplete) || 0,
      });
    } else {
      store.createWorkstream(f);
    }
    onClose();
  }

  function del() {
    if (confirm('Delete this workstream and its notes, actions and milestones?')) {
      store.deleteWorkstream(workstream.id);
      onClose();
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={editing ? 'Edit workstream' : 'New workstream'} wide>
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <Text label="Title" value={f.title} onChange={set('title')} placeholder="e.g. Financials Core — Go-Live" />
        </div>
        <Select
          label="Account"
          value={f.accountId}
          onChange={set('accountId')}
          options={store.accounts.map((a) => ({ value: a.id, label: a.name }))}
        />
        <Select
          label="Owner"
          value={f.ownerId}
          onChange={set('ownerId')}
          placeholder="Unassigned"
          options={store.team.map((m) => ({ value: m.id, label: m.name }))}
        />
        <Select
          label="Function"
          value={f.function}
          onChange={set('function')}
          options={FUNCTION_ORDER.map((x) => ({ value: x, label: functionMeta(x).label }))}
        />
        {f.function === 'coe' ? (
          <Select
            label="COE"
            value={f.coeType}
            onChange={set('coeType')}
            options={COE_TYPE_ORDER.map((x) => ({ value: x, label: coeTypeMeta(x).label }))}
          />
        ) : (
          <div />
        )}
        <Text label="Phase" value={f.phase} onChange={set('phase')} placeholder="e.g. Phase 1 — Build" />
        <Num label="Est. value ($)" value={f.value} onChange={set('value')} placeholder="0" />
        <Text label="Start date" type="date" value={f.startDate} onChange={set('startDate')} />
        <Text label="End date" type="date" value={f.endDate} onChange={set('endDate')} />
        <Select
          label="Status"
          value={f.status}
          onChange={set('status')}
          options={STATUS_ORDER.map((s) => ({ value: s, label: STATUSES[s].label }))}
        />
        <div>
          <Label>% complete: {f.percentComplete}%</Label>
          <input type="range" className="pct mt-2 w-full" min={0} max={100} step={5} value={f.percentComplete} onChange={(e) => set('percentComplete')(Number(e.target.value))} />
        </div>
      </div>
      <FormActions onCancel={onClose} onSave={save} saveLabel={editing ? 'Save changes' : 'Create workstream'} onDelete={editing ? del : undefined} saveDisabled={!f.title.trim()} />
    </Modal>
  );
}
