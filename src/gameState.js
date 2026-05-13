// Central game state and reducer for CloudTrace: The Ephemeral Evidence

export const PHASES = {
  MAIN_MENU: 'MAIN_MENU',
  TUTORIAL: 'TUTORIAL',
  PHASE1: 'PHASE1',
  PHASE2: 'PHASE2',
  PHASE3: 'PHASE3',
  DEBRIEF: 'DEBRIEF',
};

export const INITIAL_STATE = {
  phase: PHASES.MAIN_MENU,
  admissibilityScore: 100,
  actions: [],
  gameMode: 'Guided', // 'Guided', 'Challenge', 'Final Exam'
  timerMode: 'Story', // 'Story', 'Relaxed', 'Fast Run'
  timeLeft: 0, // seconds

  // Phase 1 state
  networkIsolated: false,
  stateVerified: false,
  snapshotTaken: false,
  phase1TimerExpired: false,
  processesIdentified: false,   // NEW: process investigation complete

  // Phase 2 state
  selectedBucketId: null,
  phase2Correct: false,

  // Phase 3 state
  submittedIp: '',
  submittedApiKey: '',
  submittedRoleArn: '',
  phase3Correct: false,
  attackChainCompleted: false,  // NEW: attack chain reconstruction done

  // Meta
  tutorialStep: 0,
  hintsUsed: {},                // NEW: { phaseKey: count }
  dismissedIntros: [],          // array of phase strings
  dismissedTours: [],           // array of phase strings
  gameOver: false,
  gameOverReason: '',
};

export const ACTIONS = {
  LOAD_STATE: 'LOAD_STATE',
  NEW_GAME: 'NEW_GAME',
  SHOW_HOW_TO_PLAY: 'SHOW_HOW_TO_PLAY',
  HIDE_HOW_TO_PLAY: 'HIDE_HOW_TO_PLAY',
  SKIP_TUTORIAL: 'SKIP_TUTORIAL',
  ADVANCE_TUTORIAL: 'ADVANCE_TUTORIAL',
  SET_DIFFICULTY: 'SET_DIFFICULTY',

  // Phase 1
  POWER_OFF_VM: 'POWER_OFF_VM',
  PAUSE_VM: 'PAUSE_VM',
  DISK_SNAPSHOT: 'DISK_SNAPSHOT',
  ENABLE_FLOW_LOGS: 'ENABLE_FLOW_LOGS',
  ISOLATE_NETWORK: 'ISOLATE_NETWORK',
  VERIFY_STATE: 'VERIFY_STATE',
  TAKE_SNAPSHOT: 'TAKE_SNAPSHOT',
  TIMER_EXPIRED: 'TIMER_EXPIRED',
  TICK_TIMER: 'TICK_TIMER',                       // NEW
  TIMER_PENALTY: 'TIMER_PENALTY',                 // NEW
  PHASE1_COMPLETE: 'PHASE1_COMPLETE',
  IDENTIFY_PROCESSES: 'IDENTIFY_PROCESSES',       // NEW
  PROCESS_ANALYSIS_WRONG: 'PROCESS_ANALYSIS_WRONG', // NEW

  // Phase 2
  SELECT_BUCKET: 'SELECT_BUCKET',
  PHASE2_CONFIRM: 'PHASE2_CONFIRM',

  // Phase 3
  SUBMIT_INVESTIGATION: 'SUBMIT_INVESTIGATION',
  COMPLETE_ATTACK_CHAIN: 'COMPLETE_ATTACK_CHAIN', // NEW
  ATTACK_CHAIN_WRONG: 'ATTACK_CHAIN_WRONG',       // NEW

  // Meta
  USE_HINT: 'USE_HINT',                           // NEW
  RESET_GAME: 'RESET_GAME',
  DISMISS_INTRO: 'DISMISS_INTRO',
  DISMISS_TOUR: 'DISMISS_TOUR',
};

const logAction = (state, entry) => ({
  ...state,
  actions: [...state.actions, { ...entry, timestamp: new Date().toISOString() }],
});

const deductScore = (state, amount) => ({
  ...state,
  admissibilityScore: Math.max(0, state.admissibilityScore - amount),
});

export function gameReducer(state, action) {
  switch (action.type) {

    case ACTIONS.LOAD_STATE:
      return { ...action.payload };
    
    case ACTIONS.SET_DIFFICULTY:
      return { ...state, gameMode: action.payload.gameMode, timerMode: action.payload.timerMode };

    case ACTIONS.NEW_GAME: {
      const { gameMode = 'Guided', timerMode = 'Story' } = action.payload || {};
      let startingTime = 0;
      if (timerMode === 'Relaxed') startingTime = 45 * 60;
      if (timerMode === 'Fast Run') startingTime = 30 * 60;
      
      const initialPhase = gameMode === 'Guided' ? PHASES.TUTORIAL : PHASES.PHASE1;
      return { 
        ...INITIAL_STATE, 
        phase: initialPhase, 
        previousPhase: PHASES.PHASE1,
        gameMode, 
        timerMode, 
        timeLeft: startingTime 
      };
    }

    case ACTIONS.RESET_GAME:
      return { ...INITIAL_STATE, phase: PHASES.MAIN_MENU };

    case ACTIONS.DISMISS_INTRO:
      return { ...state, dismissedIntros: [...state.dismissedIntros, action.payload] };

    case ACTIONS.DISMISS_TOUR:
      return { ...state, dismissedTours: [...state.dismissedTours, action.payload] };

    case ACTIONS.SHOW_HOW_TO_PLAY:
      return { ...state, phase: PHASES.TUTORIAL, previousPhase: state.phase };

    case ACTIONS.HIDE_HOW_TO_PLAY:
      return { ...state, phase: state.previousPhase || PHASES.MAIN_MENU };

    case ACTIONS.SKIP_TUTORIAL:
      return { ...state, phase: state.previousPhase || PHASES.PHASE1 };


    /* ─── PHASE 1 ─── */
    case ACTIONS.POWER_OFF_VM: {
      const next = deductScore(state, 40);
      return logAction(next, {
        phase: 1, action: 'Power Off VM', correct: false,
        note: 'Powering off the VM erases all volatile RAM data permanently (Severe penalty).',
      });
    }

    case ACTIONS.PAUSE_VM: {
      const next = deductScore(state, 25);
      return logAction(next, {
        phase: 1, action: 'Suspend / Pause VM', correct: false,
        note: 'VM Suspend causes ACPI sleep states which can corrupt memory structures or trigger anti-forensic malware.',
      });
    }

    case ACTIONS.DISK_SNAPSHOT: {
      const next = deductScore(state, 20);
      return logAction(next, {
        phase: 1, action: 'Create EBS Disk Snapshot', correct: false,
        note: 'EBS snapshots capture non-volatile disk storage only. Memory must be captured first.',
      });
    }

    case ACTIONS.ENABLE_FLOW_LOGS: {
      const next = deductScore(state, 10);
      return logAction(next, {
        phase: 1, action: 'Enable VPC Flow Logs', correct: false,
        note: 'Useful for post-incident analysis, but does nothing to stop ongoing data exfiltration.',
      });
    }

    case ACTIONS.ISOLATE_NETWORK: {
      const next = { ...state, networkIsolated: true };
      return logAction(next, {
        phase: 1, action: 'Isolate Network (Security Group)', correct: true,
        note: 'Network isolated. Ingress/egress rules removed. Exfiltration channel closed.',
      });
    }

    case ACTIONS.IDENTIFY_PROCESSES: {
      const next = { ...state, processesIdentified: true };
      return logAction(next, {
        phase: 1, action: 'Process Tree Analysis', correct: true,
        note: 'Correctly identified all 3 malicious processes: PID 4812 (data_exfil.py), PID 7834 (rogue sshd session), PID 9344 (/bin/sh -i reverse shell).',
      });
    }

    case ACTIONS.PROCESS_ANALYSIS_WRONG: {
      const { penalty, note } = action.payload;
      const next = deductScore(state, penalty);
      return logAction(next, {
        phase: 1, action: 'Process Tree Analysis (Wrong)', correct: false,
        note: note || `Incorrect process identification. (−${penalty} Admissibility)`,
      });
    }

    case ACTIONS.VERIFY_STATE: {
      const next = { ...state, stateVerified: true };
      return logAction(next, {
        phase: 1, action: 'Verify Instance State', correct: true,
        note: 'Verified instance state as RUNNING. Required precondition for live memory acquisition.',
      });
    }

    case ACTIONS.TAKE_SNAPSHOT: {
      if (!state.networkIsolated) return state;
      let next = { ...state, snapshotTaken: true };
      if (!state.stateVerified) next = deductScore(next, 10);
      return logAction(next, {
        phase: 1, action: 'API Memory Snapshot', correct: state.stateVerified,
        note: state.stateVerified
          ? 'VM memory snapshot acquired via CSP API. Evidence is preserved.'
          : 'Memory snapshot taken, but failed to verify instance state first.',
      });
    }

    case ACTIONS.PHASE1_COMPLETE:
      return { ...state, phase: PHASES.PHASE2 };

    case ACTIONS.TICK_TIMER: {
      if (state.timeLeft > 0) {
        return { ...state, timeLeft: state.timeLeft - 1 };
      }
      return state;
    }

    case ACTIONS.TIMER_PENALTY: {
      if (state.timeLeft <= 0 && state.timerMode !== 'Story' && !state.timerPenaltyApplied) {
        const next = deductScore(state, 50);
        return logAction(
          { ...next, timerPenaltyApplied: true },
          { phase: state.phase, action: 'Timer Expired', correct: false, note: 'Time ran out! Severe admissibility penalty applied (−50).' }
        );
      }
      return state;
    }

    case ACTIONS.TIMER_EXPIRED: {
      const next = deductScore(state, 30);
      return logAction(
        { ...next, gameOver: true, gameOverReason: 'timeout', phase: PHASES.DEBRIEF },
        { phase: 1, action: 'Timer Expired', correct: false, note: 'Auto-scaling terminated the instance. All volatile evidence is lost.' }
      );
    }

    /* ─── PHASE 2 ─── */
    case ACTIONS.SELECT_BUCKET:
      return { ...state, selectedBucketId: action.payload };

    case ACTIONS.PHASE2_CONFIRM: {
      const { buckets } = action.payload;
      const selected = buckets.find(b => b.id === state.selectedBucketId);
      if (!selected) return state;
      if (selected.isPrimary) {
        const next = { ...state, phase2Correct: true };
        return logAction(
          { ...next, phase: PHASES.PHASE3 },
          { phase: 2, action: `Selected Primary Copy: ${selected.name}`, correct: true,
            note: 'Correct. Identified primary by: oldest timestamp, no ReplicationTimestamp, full object count, versioning enabled.' }
        );
      } else {
        const next = deductScore(state, 20);
        return logAction(next, {
          phase: 2, action: `Selected Replica: ${selected.name}`, correct: false,
          note: 'Selected a replica bucket. Not admissible due to replication lag and async write corruption.',
        });
      }
    }

    /* ─── PHASE 3 ─── */
    case ACTIONS.COMPLETE_ATTACK_CHAIN: {
      const next = { ...state, attackChainCompleted: true };
      return logAction(next, {
        phase: 3, action: 'Attack Chain Reconstructed', correct: true,
        note: 'Correctly reconstructed the full attack chain: credential theft → recon → AssumeRole pivot × 2 → RunInstances → exfiltration.',
      });
    }

    case ACTIONS.ATTACK_CHAIN_WRONG: {
      const next = deductScore(state, 10);
      return logAction(next, {
        phase: 3, action: 'Attack Chain Reconstruction (Wrong)', correct: false,
        note: 'Incorrect chain ordering. Review the event timestamps and AssumeRole session context.',
      });
    }

    case ACTIONS.SUBMIT_INVESTIGATION: {
      const { ip, apiKey, roleArn } = action.payload;
      const ipCorrect = ip.trim() === '185.220.101.47';
      const keyCorrect = apiKey.trim() === 'AKIAIOSFODNN7DEV01A3';
      const roleCorrect = roleArn.trim() === 'arn:aws:iam::123456789012:role/AutomationServiceRole';
      const next = { ...state, submittedIp: ip, submittedApiKey: apiKey, submittedRoleArn: roleArn };

      if (ipCorrect && keyCorrect && roleCorrect) {
        return logAction(
          { ...next, phase3Correct: true, phase: PHASES.DEBRIEF },
          { phase: 3, action: 'Submit Investigation', correct: true,
            note: 'Correct. Traced AssumeRole chain to find true attacker IP and root compromised credential.' }
        );
      } else {
        const penalized = deductScore(next, 15);
        let errorNote = 'Incorrect attribution. ';
        if (!ipCorrect && ip.trim() === 'ec2.amazonaws.com') {
          errorNote += 'ec2.amazonaws.com is an AWS internal endpoint, not the attacker IP. Trace the AssumeRole session context.';
        } else if (!keyCorrect && apiKey.trim().startsWith('ASIA')) {
          errorNote += 'ASIA... is a temporary session token. Find the permanent AKIA... credential.';
        } else {
          errorNote += 'Review CloudTrail logs. Look for AssumeRole event preceding RunInstances.';
        }
        return logAction(penalized, {
          phase: 3, action: 'Submit Investigation (Wrong Answer)', correct: false, note: errorNote,
        });
      }
    }

    /* ─── META ─── */
    case ACTIONS.USE_HINT: {
      const { phase: hintPhase } = action.payload;
      const current = state.hintsUsed[hintPhase] || 0;
      if (current >= 3) return state;
      const next = deductScore(state, 5);
      return {
        ...next,
        hintsUsed: { ...state.hintsUsed, [hintPhase]: current + 1 },
      };
    }

    default:
      return state;
  }
}
