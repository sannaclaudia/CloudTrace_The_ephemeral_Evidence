import { useReducer, useState } from 'react';
import './index.css';
import { gameReducer, INITIAL_STATE, PHASES } from './gameState';
import TutorialModal from './components/TutorialModal';
import ScoreHUD from './components/ScoreHUD';
import LegendPanel from './components/LegendPanel';
import EvidenceLocker from './components/EvidenceLocker';
import { ToastContainer, useToasts } from './components/ToastNotification';
import Phase1Triage from './phases/Phase1Triage';
import Phase2Buckets from './phases/Phase2Buckets';
import Phase3Logs from './phases/Phase3Logs';
import DebriefScreen from './components/DebriefScreen';

export default function App() {
  const [state, dispatch] = useReducer(gameReducer, INITIAL_STATE);
  const [showLegend, setShowLegend] = useState(false);
  const [showLocker, setShowLocker] = useState(false);
  const { toasts, addToast, removeToast } = useToasts();

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>

      {state.phase === PHASES.TUTORIAL && (
        <TutorialModal dispatch={dispatch} />
      )}

      {state.phase !== PHASES.TUTORIAL && (
        <ScoreHUD
          phase={state.phase}
          admissibilityScore={state.admissibilityScore}
          onLegend={() => setShowLegend(true)}
          onLocker={() => setShowLocker(v => !v)}
          lockerOpen={showLocker}
          state={state}
        />
      )}

      {showLegend && <LegendPanel onClose={() => setShowLegend(false)} />}
      {showLocker && <EvidenceLocker state={state} onClose={() => setShowLocker(false)} />}

      <ToastContainer toasts={toasts} removeToast={removeToast} />

      <main style={{
        paddingBottom: '3rem',
        marginLeft: showLocker ? '300px' : 0,
        transition: 'margin-left 0.25s ease',
      }}>
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
