import { useEffect, useState } from 'react';
import { Modal } from '../shared/ui.jsx';
import { summariseCheckin, followUpMessage, hasApiKey } from '../../lib/claude.js';
import {
  buildCheckinMarkdown,
  buildFollowUpMarkdown,
  downloadMarkdown,
  slug,
} from '../../lib/markdown.js';

// Generates the check-in summary (AI feature 2) + follow-up message (AI feature 3),
// with deterministic fallbacks, then saves the CheckinSession on confirm.
export default function EndCheckinModal({ open, member, touched, onClose, onSave }) {
  const [summary, setSummary] = useState('');
  const [followUp, setFollowUp] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiNote, setAiNote] = useState('');
  const [tab, setTab] = useState('summary');

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    // Deterministic fallbacks first so the modal is never empty.
    const fallbackSummary = buildCheckinMarkdown({ memberName: member.name, touched });
    const actions = touched.flatMap((t) => (t.newActions || []).map((a) => ({ text: a.text, due: a.due })));
    const fallbackFollow = buildFollowUpMarkdown({ memberName: member.name, actions });
    setSummary(fallbackSummary);
    setFollowUp(fallbackFollow);
    setAiNote('');

    if (!hasApiKey()) {
      setAiNote('AI offline — showing a generated summary you can edit.');
      return;
    }

    setLoading(true);
    Promise.allSettled([
      summariseCheckin(touched),
      followUpMessage(member.name, touched, actions),
    ]).then(([sumRes, followRes]) => {
      if (cancelled) return;
      if (sumRes.status === 'fulfilled' && sumRes.value?.trim()) setSummary(sumRes.value.trim());
      if (followRes.status === 'fulfilled' && followRes.value?.trim()) setFollowUp(followRes.value.trim());
      if (sumRes.status === 'rejected' || followRes.status === 'rejected') {
        setAiNote('AI partially unavailable — showing generated text you can edit.');
      }
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [open, member, touched]);

  if (!open) return null;

  const value = tab === 'summary' ? summary : followUp;
  const setValue = tab === 'summary' ? setSummary : setFollowUp;

  return (
    <Modal open={open} onClose={onClose} title={`End check-in — ${member.name}`} wide>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex gap-1 rounded-lg bg-navy-50 p-1">
          {['summary', 'followup'].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium ${
                tab === t ? 'bg-white text-navy-800 shadow-sm' : 'text-navy-700/60'
              }`}
            >
              {t === 'summary' ? 'Check-in summary' : 'Follow-up message'}
            </button>
          ))}
        </div>
        {loading && <span className="text-xs text-navy-700/60">Generating with AI…</span>}
      </div>

      {aiNote && (
        <div className="mb-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs text-amber-700">{aiNote}</div>
      )}

      <textarea
        className="field h-72 resize-y font-mono text-xs leading-relaxed"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          className="btn-ghost"
          onClick={() => navigator.clipboard?.writeText(value)}
          title="Copy to clipboard"
        >
          Copy
        </button>
        <button
          className="btn-ghost"
          onClick={() =>
            downloadMarkdown(
              `${tab === 'summary' ? 'checkin' : 'followup'}-${slug(member.name)}`,
              value
            )
          }
        >
          ↓ Download .md
        </button>
        <div className="ml-auto flex gap-2">
          <button className="btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn-primary"
            onClick={() => onSave({ summaryMarkdown: summary, followUpMarkdown: followUp })}
          >
            Save check-in
          </button>
        </div>
      </div>
    </Modal>
  );
}
