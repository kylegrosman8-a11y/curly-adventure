import { useState } from 'react';
import { useStore } from './store/store.jsx';
import { hasApiKey } from './lib/claude.js';
import PortfolioGantt from './components/gantt/PortfolioGantt.jsx';
import CheckinMode from './components/checkin/CheckinMode.jsx';
import ActionRegister from './components/register/ActionRegister.jsx';

const VIEWS = [
  { id: 'gantt', label: 'Portfolio Gantt' },
  { id: 'checkin', label: 'Check-in Mode' },
  { id: 'register', label: 'Action Register' },
];

export default function App() {
  const { loading, resetData } = useStore();
  const [view, setView] = useState('gantt');

  return (
    <div className="flex h-full flex-col">
      <header className="glass sticky top-0 z-30 flex flex-shrink-0 items-center justify-between border-b px-5 py-2.5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-brand text-base font-extrabold text-white shadow-lift">W</div>
          <div>
            <h1 className="font-display text-base font-extrabold leading-tight text-navy-800">Account War Room</h1>
            <p className="text-[11px] leading-tight text-navy-700/60">Weekly operating rhythm</p>
          </div>
        </div>

        <nav className="flex items-center gap-1 rounded-full border border-navy-100 bg-white/60 p-1 backdrop-blur">
          {VIEWS.map((v) => (
            <button
              key={v.id}
              onClick={() => setView(v.id)}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-all ${
                view === v.id ? 'bg-brand text-white shadow-sm' : 'text-navy-700/70 hover:text-navy-900'
              }`}
            >
              {v.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {!hasApiKey() && (
            <span
              className="rounded-full border border-navy-100 bg-white/70 px-2.5 py-1 text-[11px] text-navy-700/70"
              title="Set VITE_ANTHROPIC_API_KEY to enable AI features. The app works fully without it."
            >
              AI offline
            </span>
          )}
          <button
            onClick={() => {
              if (confirm('Reset all data back to the seeded demo set? This cannot be undone.')) resetData();
            }}
            className="rounded-full px-2.5 py-1 text-[11px] text-navy-700/60 hover:bg-navy-50 hover:text-navy-800"
          >
            Reset demo data
          </button>
        </div>
      </header>

      <main className="min-h-0 flex-1 overflow-hidden">
        {loading ? (
          <div className="flex h-full items-center justify-center text-sm text-navy-700/60">Loading war room…</div>
        ) : view === 'gantt' ? (
          <PortfolioGantt />
        ) : view === 'checkin' ? (
          <CheckinMode />
        ) : (
          <ActionRegister />
        )}
      </main>
    </div>
  );
}
