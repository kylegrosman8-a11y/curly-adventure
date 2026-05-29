import { useState } from 'react';
import { useStore } from '../../store/store.jsx';
import { Modal } from '../shared/ui.jsx';
import { Text, Area, Select, FormActions } from './formkit.jsx';
import { todayISO } from '../../lib/dates.js';

const TYPES = [
  { value: 'go_live', label: 'Go-live' },
  { value: 'decision', label: 'Decision gate' },
  { value: 'milestone', label: 'Milestone' },
];

// Add or edit a milestone. Pass `milestone` to edit, or `defaults` to create.
export default function MilestoneForm({ open, onClose, milestone, defaults = {} }) {
  const store = useStore();
  const editing = Boolean(milestone);
  const [f, setF] = useState(() => ({
    accountId: milestone?.accountId ?? defaults.accountId ?? store.accounts[0]?.id ?? '',
    workstreamId: milestone?.workstreamId ?? defaults.workstreamId ?? null,
    phase: milestone?.phase ?? defaults.phase ?? '',
    date: milestone?.date ?? todayISO(),
    label: milestone?.label ?? '',
    note: milestone?.note ?? '',
    type: milestone?.type ?? 'go_live',
  }));
  const set = (k) => (v) => setF((s) => ({ ...s, [k]: v }));
  const accountStreams = store.workstreams.filter((w) => w.accountId === f.accountId);

  function save() {
    if (!f.label.trim()) return;
    if (editing) store.updateMilestone(milestone.id, f);
    else store.addMilestone(f);
    onClose();
  }
  function del() {
    store.deleteMilestone(milestone.id);
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={editing ? 'Edit milestone' : 'New milestone'}>
      <div className="space-y-3">
        <Text label="Label" value={f.label} onChange={set('label')} placeholder="e.g. Financials Core Go-Live" />
        <div className="grid grid-cols-2 gap-3">
          <Select label="Account" value={f.accountId} onChange={set('accountId')} options={store.accounts.map((a) => ({ value: a.id, label: a.name }))} />
          <Text label="Date" type="date" value={f.date} onChange={set('date')} />
          <Select
            label="Linked workstream (optional)"
            value={f.workstreamId}
            onChange={set('workstreamId')}
            placeholder="None"
            options={accountStreams.map((w) => ({ value: w.id, label: w.title }))}
          />
          <Select label="Type" value={f.type} onChange={set('type')} options={TYPES} />
        </div>
        <Area label="Callout note (optional)" rows={2} value={f.note} onChange={set('note')} placeholder="Short note shown on the roadmap callout" />
      </div>
      <FormActions onCancel={onClose} onSave={save} saveLabel={editing ? 'Save' : 'Add milestone'} onDelete={editing ? del : undefined} saveDisabled={!f.label.trim()} />
    </Modal>
  );
}
