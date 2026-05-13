import { useReducer, useState, useEffect } from 'react';
import './index.css';
import { gameReducer, INITIAL_STATE, PHASES } from './gameState';
import TutorialModal from './components/TutorialModal';
import ScoreHUD from './components/ScoreHUD';
import LegendPanel from './components/LegendPanel';
import EvidenceLocker from './components/EvidenceLocker';
import { ToastContainer, useToasts } from './components/ToastNotification';
import PhaseIntroModal from './components/PhaseIntroModal';
import Phase1Triage from './phases/Phase1Triage';
import Phase2Buckets from './phases/Phase2Buckets';
import Phase3Logs from './phases/Phase3Logs';
import DebriefScreen from './components/DebriefScreen';
import MainMenu from './components/MainMenu';
import LoadingScreen from './components/LoadingScreen';

// Phases that get an intro modal
const INTRO_PHASES = [PHASES.PHASE1, PHASES.PHASE2, PHASES.PHASE3];

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [state, dispatch] = useReducer(gameReducer, INITIAL_STATE);
  const [showLegend, setShowLegend] = useState(false);
  const [showLocker, setShowLocker] = useState(false);
  const { toasts, addToast, removeToast } = useToasts();

  // Track which phase intros have been dismissed
  const [dismissedIntros, setDismissedIntros] = useState(new Set());
  
  // Persist game state
  useEffect(() => {
    if (state.phase !== PHASES.MAIN_MENU) {
      localStorage.setItem('CloudTraceSaveState', JSON.stringify(state));
    }
  }, [state]);

  // Show intro whenever the phase changes to a phase that has an intro
  const showIntro =
    INTRO_PHASES.includes(state.phase) &&
    !dismissedIntros.has(state.phase);

  const handleBeginPhase = () => {
    setDismissedIntros(prev => new Set([...prev, state.phase]));
  };

  if (isLoading) {
    return <LoadingScreen onComplete={() => setIsLoading(false)} />;
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--color-bg)', overflow: 'hidden' }}>

      {state.phase === PHASES.MAIN_MENU && (
        <MainMenu dispatch={dispatch} />
      )}

      {state.phase === PHASES.TUTORIAL && (
        <TutorialModal dispatch={dispatch} />
      )}

      {state.phase !== PHASES.TUTORIAL && state.phase !== PHASES.MAIN_MENU && (
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

      {/* Phase intro modal — appears before the player can interact */}
      {showIntro && state.phase !== PHASES.MAIN_MENU && (
        <PhaseIntroModal phase={state.phase} onBegin={handleBeginPhase} />
      )}

      {state.phase !== PHASES.MAIN_MENU && (
        <main style={{
          flex: 1,
          overflowY: 'auto',
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
      )}
    </div>
  );
}
