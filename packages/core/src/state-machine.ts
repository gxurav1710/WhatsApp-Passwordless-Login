import { AttemptState, AppError, ErrorCode } from '@whatsapp-auth/protocol';

/**
 * Valid transitions between authentication attempt states.
 */
const VALID_TRANSITIONS: Record<AttemptState, AttemptState[]> = {
  [AttemptState.INITIATED]: [
    AttemptState.WAITING_FOR_WHATSAPP,
    AttemptState.PROCESSING,
    AttemptState.EXPIRED,
    AttemptState.FAILED,
    AttemptState.REJECTED,
  ],
  [AttemptState.WAITING_FOR_WHATSAPP]: [
    AttemptState.PROCESSING,
    AttemptState.EXPIRED,
    AttemptState.FAILED,
    AttemptState.REJECTED,
  ],
  [AttemptState.PROCESSING]: [
    AttemptState.VERIFIED,
    AttemptState.REJECTED,
    AttemptState.FAILED,
    AttemptState.EXPIRED,
  ],
  [AttemptState.VERIFIED]: [
    AttemptState.LOGIN_LINK_CONSUMED,
    AttemptState.COMPLETED,
    AttemptState.EXPIRED,
    AttemptState.FAILED,
  ],
  [AttemptState.LOGIN_LINK_CONSUMED]: [
    AttemptState.COMPLETED,
    AttemptState.EXPIRED,
    AttemptState.FAILED,
  ],
  // Terminal states cannot transition further
  [AttemptState.COMPLETED]: [],
  [AttemptState.EXPIRED]: [],
  [AttemptState.FAILED]: [],
  [AttemptState.REJECTED]: [],
};

/**
 * Checks if a transition from currentState to targetState is valid.
 */
export function canTransition(currentState: AttemptState, targetState: AttemptState): boolean {
  const allowed = VALID_TRANSITIONS[currentState];
  return Boolean(allowed && allowed.includes(targetState));
}

/**
 * Asserts that a transition from currentState to targetState is valid; throws AppError otherwise.
 */
export function assertValidTransition(
  currentState: AttemptState,
  targetState: AttemptState,
  attemptId: string = 'unknown'
): void {
  if (!canTransition(currentState, targetState)) {
    throw new AppError(
      ErrorCode.AUTH_ATTEMPT_INVALID_STATE,
      `Invalid state transition for attempt "${attemptId}": cannot transition from "${currentState}" to "${targetState}".`,
      400
    );
  }
}

/**
 * Checks if an attempt state is terminal (cannot transition to any other state).
 */
export function isTerminalState(state: AttemptState): boolean {
  return [
    AttemptState.COMPLETED,
    AttemptState.EXPIRED,
    AttemptState.FAILED,
    AttemptState.REJECTED,
  ].includes(state);
}
