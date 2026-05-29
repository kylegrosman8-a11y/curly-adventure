import { useState } from 'react';
import { useStore } from '../../store/store.jsx';
import { Modal } from '../shared/ui.jsx';
import { Text, Area, ListArea, FormActions, Label } from './formkit.jsx';

// Create or edit an account, including the roadmap narrative used by the export.
export default function AccountForm({ open, onClose, account }) {
  const store = useStore();
  const editing = Boolean(account);
  const rm = account?.roadmap || {};
  const [f, setF] = useState(() => ({
    name: account?.name ?? '',
    owner: account?.owner ?? '',
    color: account?.color ?? '#6d5efc',
    headline: rm.headline ?? '',
    resourcing: rm.resourcing ?? [],
    benefits: rm.benefits ?? [],
    risks: rm.risks ?? [],
    commercials: rm.commercials ?? [],
    asks: rm.asks ?? [],
  }));
  const set = (k) => (v) => setF((s) => ({ ...s, [k]: v }));

  function save() {
    if (!f.name.trim()) return;
    const roadmap = {
      headline: f.headline,
      resourcing: f.resourcing,
      benefits: f.benefits,
      risks: f.risks,
      commercials: f.commercials,
      asks: f.asks,
    };
    if (editing) store.updateAccount(account.id, { name: f.name.trim(), owner: f.owner, color: f.color, roadmap });
    else store.createAccount({ name: f.name.trim(), owner: f.owner, color: f.color, roadmap });
    onClose();
  }

  function del() {
    if (confirm(`Delete ${account.name} and all of its workstreams? This cannot be undone.`)) {
      store.deleteAccount(account.id);
      onClose();
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={editing ? `Edit ${account.name}` : 'New account'} wide>
      <div className="grid grid-cols-2 gap-3">
        <Text label="Account name" value={f.name} onChange={set('name')} placeholder="e.g. NAB" />
        <Text label="Account lead" value={f.owner} onChange={set('owner')} placeholder="e.g. Marcus Webb" />
        <div>
          <Label>Colour</Label>
          <input type="color" className="h-9 w-16 cursor-pointer rounded-lg border border-navy-100 bg-white p-1" value={f.color} onChange={(e) => set('color')(e.target.value)} />
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-navy-100 bg-navy-50/40 p-3">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-navy-700/60">Roadmap narrative (used by the exec export)</p>
        <div className="space-y-3">
          <Text label="Headline" value={f.headline} onChange={set('headline')} placeholder="The one-line takeaway for execs" />
          <div className="grid grid-cols-2 gap-3">
            <ListArea label="Project & resource (one per line)" value={f.resourcing} onChange={set('resourcing')} />
            <ListArea label="Benefits (one per line)" value={f.benefits} onChange={set('benefits')} />
            <ListArea label="Risks & mitigation (one per line)" value={f.risks} onChange={set('risks')} />
            <ListArea label="Commercials (one per line)" value={f.commercials} onChange={set('commercials')} />
            <ListArea label="Asks (one per line)" value={f.asks} onChange={set('asks')} />
          </div>
        </div>
      </div>

      <FormActions onCancel={onClose} onSave={save} saveLabel={editing ? 'Save changes' : 'Create account'} onDelete={editing ? del : undefined} saveDisabled={!f.name.trim()} />
    </Modal>
  );
}
