import { AppError, ErrorCode } from '@whatsapp-auth/protocol';

/**
 * Validates that the requested redirect URI exactly matches one of the registered URIs for the application.
 * Prevents open-redirect vulnerabilities.
 */
export function validateRedirectUri(requestedUri: string, allowedUris: string[]): boolean {
  if (!requestedUri || !Array.isArray(allowedUris) || allowedUris.length === 0) {
    return false;
  }

  try {
    const parsedRequested = new URL(requestedUri);
    // Disallow javascript:, data:, file: URIs
    if (!['http:', 'https:'].includes(parsedRequested.protocol)) {
      return false;
    }

    // Exact string match comparison against allowed list
    for (const allowed of allowedUris) {
      try {
        const parsedAllowed = new URL(allowed);
        if (parsedRequested.href === parsedAllowed.href) {
          return true;
        }
      } catch {
        continue;
      }
    }

    return false;
  } catch {
    return false;
  }
}

export function assertValidRedirectUri(requestedUri: string, allowedUris: string[]): void {
  if (!validateRedirectUri(requestedUri, allowedUris)) {
    throw new AppError(
      ErrorCode.INVALID_REDIRECT_URI,
      `The redirect URI "${requestedUri}" is not registered for this application.`,
      400,
      { requestedUri, allowedUris }
    );
  }
}
