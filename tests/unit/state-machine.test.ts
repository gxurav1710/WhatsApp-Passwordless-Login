import { describe, it, expect } from 'vitest';
import { AttemptState } from '@whatsapp-auth/protocol';
import {
  canTransition,
  assertValidTransition,
  isTerminalState,
} from '@whatsapp-auth/core';

describe('Authentication State Machine', () => {
  it('allows valid forward transitions in the happy path', () => {
    // INITIATED -> PROCESSING
    expect(canTransition(AttemptState.INITIATED, AttemptState.PROCESSING)).toBe(true);

    // PROCESSING -> VERIFIED
    expect(canTransition(AttemptState.PROCESSING, AttemptState.VERIFIED)).toBe(true);

    // VERIFIED -> LOGIN_LINK_CONSUMED
    expect(canTransition(AttemptState.VERIFIED, AttemptState.LOGIN_LINK_CONSUMED)).toBe(true);

    // LOGIN_LINK_CONSUMED -> COMPLETED
    expect(canTransition(AttemptState.LOGIN_LINK_CONSUMED, AttemptState.COMPLETED)).toBe(true);
  });

  it('rejects illegal backwards or skipping transitions', () => {
    // Cannot go backwards from COMPLETED to INITIATED
    expect(canTransition(AttemptState.COMPLETED, AttemptState.INITIATED)).toBe(false);

    // Cannot jump from INITIATED directly to COMPLETED
    expect(canTransition(AttemptState.INITIATED, AttemptState.COMPLETED)).toBe(false);

    // Cannot transition out of terminal EXPIRED state
    expect(canTransition(AttemptState.EXPIRED, AttemptState.VERIFIED)).toBe(false);
  });

  it('throws AppError on assertValidTransition when invalid', () => {
    expect(() =>
      assertValidTransition(AttemptState.COMPLETED, AttemptState.VERIFIED, 'test_att')
    ).toThrow();
  });

  it('identifies terminal states correctly', () => {
    expect(isTerminalState(AttemptState.COMPLETED)).toBe(true);
    expect(isTerminalState(AttemptState.EXPIRED)).toBe(true);
    expect(isTerminalState(AttemptState.FAILED)).toBe(true);
    expect(isTerminalState(AttemptState.REJECTED)).toBe(true);

    expect(isTerminalState(AttemptState.INITIATED)).toBe(false);
    expect(isTerminalState(AttemptState.VERIFIED)).toBe(false);
  });
});
