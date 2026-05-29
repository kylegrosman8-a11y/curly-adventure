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
      <header className="flex flex-shrink-0 items-center justify-between border-b border-navy-100 bg-navy-800 px-5 py-2.5 text-white">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-accent font-bold">W</div>
          <div>
            <h1 className="text-sm font-semibold leading-tight">Account War Room</h1>
            <p className="text-[11px] leading-tight text-white/60">Weekly operating rhythm</p>
          </div>
        </div>

        <nav className="flex items-center gap-1 rounded-lg bg-navy-900/40 p-1">
          {VIEWS.map((v) => (
            <button
              key={v.id}
              onClick={() => setView(v.id)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                view === v.id ? 'bg-white text-navy-800' : 'text-white/70 hover:text-white'
              }`}
            >
              {v.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {!hasApiKey() && (
            <span
              className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] text-white/70"
              title="Set VITE_ANTHROPIC_API_KEY to enable AI features. The app works fully without it."
            >
              AI offline
            </span>
          )}
          <button
            onClick={() => {
              if (confirm('Reset all data back to the seeded demo set? This cannot be undone.')) resetData();
            }}
            className="rounded-md px-2.5 py-1 text-[11px] text-white/60 hover:bg-white/10 hover:text-white"
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
