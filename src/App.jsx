import { useReducer, useState } from 'react';
import './index.css';
import { gameReducer, INITIAL_STATE, PHASES } from './gameState';
import TutorialModal from './components/TutorialModal';
import ScoreHUD from './components/ScoreHUD';
import LegendPanel from './components/LegendPanel';
import { ToastContainer, useToasts } from './components/ToastNotification';
import Phase1Triage from './phases/Phase1Triage';
import Phase2Buckets from './phases/Phase2Buckets';
import Phase3Logs from './phases/Phase3Logs';
import DebriefScreen from './components/DebriefScreen';

export default function App() {
  const [state, dispatch] = useReducer(gameReducer, INITIAL_STATE);
  const [showLegend, setShowLegend] = useState(false);
  const { toasts, addToast, removeToast } = useToasts();

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      {/* Tutorial overlay (shown before game starts) */}
      {state.phase === PHASES.TUTORIAL && (
        <TutorialModal dispatch={dispatch} />
      )}

      {/* Sticky header HUD — shown during gameplay and debrief */}
      {state.phase !== PHASES.TUTORIAL && (
        <ScoreHUD
          phase={state.phase}
          admissibilityScore={state.admissibilityScore}
          onLegend={() => setShowLegend(true)}
        />
      )}

      {/* Legend sidebar */}
      {showLegend && <LegendPanel onClose={() => setShowLegend(false)} />}

      {/* Toast notifications */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Main game phase content */}
      <main style={{ paddingBottom: '3rem' }}>
        {state.phase === PHASES.PHASE1 && (
          <Phase1Triage state={state} dispatch={dispatch} addToast={addToast} />
        )}
        {state.phase === PHASES.PHASE2 && (
          <Phase2Buckets state={state} dispatch={dispatch} addToast={addToast} />
        )}
        {state.phase === PHASES.PHASE3 && (
          <Phase3Logs state={state} dispatch={dispatch} addToast={addToast} />
        )}
        {state.phase === PHASES.DEBRIEF && (
          <DebriefScreen state={state} dispatch={dispatch} />
        )}
      </main>
    </div>
  );
}
