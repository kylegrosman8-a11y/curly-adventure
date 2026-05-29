import { useState } from 'react';
import { useStore } from '../../store/store.jsx';
import { Modal, Avatar } from '../shared/ui.jsx';

// Add / rename / remove team members.
export default function TeamManager({ open, onClose }) {
  const store = useStore();
  const [name, setName] = useState('');
  const [role, setRole] = useState('');

  return (
    <Modal open={open} onClose={onClose} title="Manage team">
      <div className="space-y-2">
        {store.team.map((m) => (
          <div key={m.id} className="flex items-center gap-2 rounded-xl border border-navy-100 px-2.5 py-2">
            <Avatar name={m.name} size="sm" />
            <input
              className="field !py-1 flex-1"
              value={m.name}
              onChange={(e) => store.updateMember(m.id, { name: e.target.value })}
            />
            <input
              className="field !py-1 flex-1"
              value={m.role || ''}
              placeholder="Role"
              onChange={(e) => store.updateMember(m.id, { role: e.target.value })}
            />
            <button
              className="rounded-lg px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
              onClick={() => {
                if (confirm(`Remove ${m.name}? Their workstreams will become unassigned.`)) store.deleteMember(m.id);
              }}
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      <form
        className="mt-4 flex items-end gap-2 border-t border-navy-100 pt-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) return;
          store.addMember({ name: name.trim(), role: role.trim() });
          setName('');
          setRole('');
        }}
      >
        <div className="flex-1">
          <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-navy-700/60">Add member</label>
          <input className="field" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <input className="field flex-1" placeholder="Role" value={role} onChange={(e) => setRole(e.target.value)} />
        <button className="btn-accent" type="submit" disabled={!name.trim()}>
          Add
        </button>
      </form>
    </Modal>
  );
}
