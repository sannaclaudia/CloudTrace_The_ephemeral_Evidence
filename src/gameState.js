// Central game state and reducer for CloudTrace: The Ephemeral Evidence

export const PHASES = {
  TUTORIAL: 'TUTORIAL',
  PHASE1: 'PHASE1',   // Triage & Volatility
  PHASE2: 'PHASE2',   // Acquisition & Redundancy
  PHASE3: 'PHASE3',   // Log Analysis & Attribution
  DEBRIEF: 'DEBRIEF', // End of game
};

export const INITIAL_STATE = {
  phase: PHASES.TUTORIAL,
  admissibilityScore: 100,
  actions: [],        // Action log: { id, phase, action, correct, timestamp, note }

  // Phase 1 state
  networkIsolated: false,
  stateVerified: false,
  snapshotTaken: false,
  phase1TimerExpired: false,

  // Phase 2 state
  selectedBucketId: null,
  phase2Correct: false,

  // Phase 3 state
  submittedIp: '',
  submittedApiKey: '',
  submittedRoleArn: '',
  phase3Correct: false,

  // Meta
  tutorialStep: 0,
  gameOver: false,
  gameOverReason: '',
};

export const ACTIONS = {
  SKIP_TUTORIAL: 'SKIP_TUTORIAL',
  ADVANCE_TUTORIAL: 'ADVANCE_TUTORIAL',

  // Phase 1
  POWER_OFF_VM: 'POWER_OFF_VM',
  PAUSE_VM: 'PAUSE_VM',
  DISK_SNAPSHOT: 'DISK_SNAPSHOT',
  ENABLE_FLOW_LOGS: 'ENABLE_FLOW_LOGS',
  ISOLATE_NETWORK: 'ISOLATE_NETWORK',
  VERIFY_STATE: 'VERIFY_STATE',
  TAKE_SNAPSHOT: 'TAKE_SNAPSHOT',
  TIMER_EXPIRED: 'TIMER_EXPIRED',
  PHASE1_COMPLETE: 'PHASE1_COMPLETE',

  // Phase 2
  SELECT_BUCKET: 'SELECT_BUCKET',
  PHASE2_CONFIRM: 'PHASE2_CONFIRM',

  // Phase 3
  SUBMIT_INVESTIGATION: 'SUBMIT_INVESTIGATION',

  RESET_GAME: 'RESET_GAME',
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

    case ACTIONS.ADVANCE_TUTORIAL:
      if (state.tutorialStep >= 2) {
        return { ...state, phase: PHASES.PHASE1 };
      }
      return { ...state, tutorialStep: state.tutorialStep + 1 };

    case ACTIONS.SKIP_TUTORIAL:
      return { ...state, phase: PHASES.PHASE1 };

    /* ─── PHASE 1 ─── */
    case ACTIONS.POWER_OFF_VM: {
      const next = deductScore(state, 40);
      return logAction(
        next,
        { phase: 1, action: 'Power Off VM', correct: false, note: 'Powering off the VM erases all volatile RAM data permanently (Severe penalty).' }
      );
    }

    case ACTIONS.PAUSE_VM: {
      const next = deductScore(state, 25);
      return logAction(next, { 
        phase: 1, action: 'Suspend / Pause VM', correct: false, 
        note: 'VM Suspend via the hypervisor causes ACPI sleep states which can corrupt memory structures or trigger anti-forensic malware mechanisms. Not forensically sound.' 
      });
    }

    case ACTIONS.DISK_SNAPSHOT: {
      const next = deductScore(state, 20);
      return logAction(next, { 
        phase: 1, action: 'Create EBS Disk Snapshot', correct: false, 
        note: 'EBS snapshots capture non-volatile disk storage. They do not capture RAM, active connections, or fileless malware. Memory must be captured first.' 
      });
    }

    case ACTIONS.ENABLE_FLOW_LOGS: {
      const next = deductScore(state, 10);
      return logAction(next, { 
        phase: 1, action: 'Enable VPC Flow Logs', correct: false, 
        note: 'Useful for post-incident analysis, but does nothing to stop ongoing data exfiltration. Prioritize containment (Isolate) and preservation (Memory Snapshot).' 
      });
    }

    case ACTIONS.ISOLATE_NETWORK: {
      const next = { ...state, networkIsolated: true };
      return logAction(next, {
        phase: 1, action: 'Isolate Network (Security Group)', correct: true,
        note: 'Network isolated. Ingress/egress rules removed. Exfiltration channel closed without modifying VM memory.'
      });
    }

    case ACTIONS.VERIFY_STATE: {
      const next = { ...state, stateVerified: true };
      return logAction(next, {
        phase: 1, action: 'Verify Instance State', correct: true,
        note: 'Verified instance state as RUNNING. Required precondition for live memory acquisition.'
      });
    }

    case ACTIONS.TAKE_SNAPSHOT: {
      if (!state.networkIsolated) return state; 
      
      let next = { ...state, snapshotTaken: true };
      if (!state.stateVerified) {
        next = deductScore(next, 10);
      }
      
      return logAction(next, {
        phase: 1, action: 'API Memory Snapshot', correct: state.stateVerified,
        note: state.stateVerified 
          ? 'VM memory snapshot acquired via CSP API. Evidence is preserved.' 
          : 'Memory snapshot taken, but failed to verify instance state first. Proceeding blindly risks attempting memory acquisition on a suspended/stopped instance.'
      });
    }

    case ACTIONS.PHASE1_COMPLETE:
      return { ...state, phase: PHASES.PHASE2 };

    case ACTIONS.TIMER_EXPIRED: {
      const next = deductScore(state, 30);
      return logAction(
        { ...next, gameOver: true, gameOverReason: 'timeout', phase: PHASES.DEBRIEF },
        { phase: 1, action: 'Timer Expired', correct: false, note: 'Auto-scaling successfully terminated the instance. All volatile evidence is lost.' }
      );
    }

    /* ─── PHASE 2 ─── */
    case ACTIONS.SELECT_BUCKET: {
      return { ...state, selectedBucketId: action.payload };
    }

    case ACTIONS.PHASE2_CONFIRM: {
      const { buckets } = action.payload;
      const selected = buckets.find(b => b.id === state.selectedBucketId);
      if (!selected) return state;

      if (selected.isPrimary) {
        const next = { ...state, phase2Correct: true };
        return logAction(
          { ...next, phase: PHASES.PHASE3 },
          { phase: 2, action: `Selected Primary Copy: ${selected.name}`, correct: true, note: 'Correct. Identified the primary copy by verifying oldest timestamp, missing replication tags, full object count, and versioning enabled.' }
        );
      } else {
        const next = deductScore(state, 20);
        return logAction(next, {
          phase: 2, action: `Selected Replica: ${selected.name}`, correct: false,
          note: `Selected a replica bucket. Replicas are not authoritative sources of evidence due to potential replication lag or mismatches.`
        });
      }
    }

    /* ─── PHASE 3 ─── */
    case ACTIONS.SUBMIT_INVESTIGATION: {
      const { ip, apiKey, roleArn } = action.payload;
      const correctIp = '185.220.101.47';
      const correctKey = 'AKIAIOSFODNN7DEV01A3';
      const correctRole = 'arn:aws:iam::123456789012:role/AutomationServiceRole';
      
      const ipCorrect = ip.trim() === correctIp;
      const keyCorrect = apiKey.trim() === correctKey;
      const roleCorrect = roleArn.trim() === correctRole;

      const next = { ...state, submittedIp: ip, submittedApiKey: apiKey, submittedRoleArn: roleArn };

      if (ipCorrect && keyCorrect && roleCorrect) {
        return logAction(
          { ...next, phase3Correct: true, phase: PHASES.DEBRIEF },
          { phase: 3, action: 'Submit Investigation', correct: true, note: 'Correct. Successfully traced the AssumeRole chain to find the true attacker IP and root compromised credential.' }
        );
      } else {
        const penalized = deductScore(next, 15);
        let errorNote = 'Incorrect attribution. ';
        if (!ipCorrect && ip.trim() === 'ec2.amazonaws.com') {
          errorNote += 'The sourceIPAddress in RunInstances is an AWS internal endpoint. The attacker assumed a role. Trace the session context back to the AssumeRole event.';
        } else if (!keyCorrect && apiKey.trim().startsWith('ASIA')) {
          errorNote += 'The credential used was a temporary session token (ASIA...). You must find the permanent IAM credential (AKIA...) that initially requested it.';
        } else {
          errorNote += 'Review the CloudTrail logs. Look for an AssumeRole event preceding the RunInstances event.';
        }

        return logAction(penalized, {
          phase: 3, action: 'Submit Investigation (Wrong Answer)', correct: false,
          note: errorNote
        });
      }
    }

    case ACTIONS.RESET_GAME:
      return { ...INITIAL_STATE, phase: PHASES.PHASE1 };

    default:
      return state;
  }
}
