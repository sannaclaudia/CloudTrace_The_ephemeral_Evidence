import { useReducer, useState, useEffect } from 'react';
import './index.css';
import { gameReducer, INITIAL_STATE, PHASES, ACTIONS } from './gameState';
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
import GuidedTour from './components/GuidedTour';

// Phases that get an intro modal
const INTRO_PHASES = [PHASES.PHASE1, PHASES.PHASE2, PHASES.PHASE3];

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [state, dispatch] = useReducer(gameReducer, INITIAL_STATE);
  const [showLegend, setShowLegend] = useState(false);
  const [showLocker, setShowLocker] = useState(false);
  const { toasts, addToast, removeToast } = useToasts();

  // Persist game state
  useEffect(() => {
    if (state.phase !== PHASES.MAIN_MENU) {
      localStorage.setItem('CloudTraceSaveState', JSON.stringify(state));
    }
  }, [state]);

  // Show intro whenever the phase changes to a phase that has an intro
  const showIntro =
    INTRO_PHASES.includes(state.phase) &&
    !state.dismissedIntros.includes(state.phase);
    
  const showTour = 
    state.gameMode === 'Guided' &&
    INTRO_PHASES.includes(state.phase) &&
    state.dismissedIntros.includes(state.phase) &&
    !state.dismissedTours.includes(state.phase);

  const handleBeginPhase = () => {
    dispatch({ type: ACTIONS.DISMISS_INTRO, payload: state.phase });
  };
  
  const handleCompleteTour = () => {
    dispatch({ type: ACTIONS.DISMISS_TOUR, payload: state.phase });
  };

  // Global Timer logic
  useEffect(() => {
    if (state.phase === PHASES.MAIN_MENU || state.phase === PHASES.DEBRIEF || state.phase === PHASES.TUTORIAL) return;
    if (state.timerMode === 'Story') return;
    if (showIntro || showTour) return; // pause timer while intro or tour is showing

    if (state.timeLeft <= 0 && !state.timerPenaltyApplied) {
      dispatch({ type: ACTIONS.TIMER_PENALTY });
      addToast({ type: 'error', title: 'Timer Expired', message: 'Time ran out! Severe admissibility penalty applied (−50).' });
      return;
    }

    if (state.timeLeft > 0) {
      const timer = setInterval(() => {
        dispatch({ type: ACTIONS.TICK_TIMER });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [state.phase, state.timerMode, state.timeLeft, showIntro, showTour, state.timerPenaltyApplied, addToast]);

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
      
      {/* Guided Tour - appears after intro in Guided mode */}
      {showTour && state.phase !== PHASES.MAIN_MENU && (
        <GuidedTour phase={state.phase} onComplete={handleCompleteTour} />
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
