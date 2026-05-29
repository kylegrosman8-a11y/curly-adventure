// Tiny shared form primitives for the editing modals.
export function Label({ children }) {
  return <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-navy-700/60">{children}</label>;
}

export function Text({ label, value, onChange, placeholder, type = 'text' }) {
  return (
    <div>
      {label && <Label>{label}</Label>}
      <input className="field" type={type} value={value ?? ''} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

export function Num({ label, value, onChange, placeholder }) {
  return (
    <div>
      {label && <Label>{label}</Label>}
      <input
        className="field"
        type="number"
        value={value ?? ''}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
      />
    </div>
  );
}

export function Select({ label, value, onChange, options, placeholder }) {
  return (
    <div>
      {label && <Label>{label}</Label>}
      <select className="field" value={value ?? ''} onChange={(e) => onChange(e.target.value || null)}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function Area({ label, value, onChange, placeholder, rows = 4 }) {
  return (
    <div>
      {label && <Label>{label}</Label>}
      <textarea className="field resize-y" rows={rows} value={value ?? ''} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

/** Multiline textarea <-> string[] (one item per line). */
export function ListArea({ label, value, onChange, placeholder, rows = 4 }) {
  return (
    <Area
      label={label}
      rows={rows}
      placeholder={placeholder}
      value={(value || []).join('\n')}
      onChange={(t) => onChange(t.split('\n').map((l) => l.trim()).filter(Boolean))}
    />
  );
}

export function FormActions({ onCancel, onSave, saveLabel = 'Save', onDelete, saveDisabled }) {
  return (
    <div className="mt-4 flex items-center gap-2">
      {onDelete && (
        <button type="button" className="btn-ghost !text-red-600 hover:!bg-red-50" onClick={onDelete}>
          Delete
        </button>
      )}
      <div className="ml-auto flex gap-2">
        <button type="button" className="btn-ghost" onClick={onCancel}>
          Cancel
        </button>
        <button type="button" className="btn-accent" onClick={onSave} disabled={saveDisabled}>
          {saveLabel}
        </button>
      </div>
    </div>
  );
}
