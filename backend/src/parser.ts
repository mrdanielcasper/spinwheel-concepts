/**
 * Centralized error parsing and normalization helper.
 */

export interface NormalizedError {
  code: string;
  message: string;
  details: Array<{ desc: string }>;
  httpStatus: number;
  source: 'spinwheel' | 'backend' | 'network';
}

/**
 * Normalizes an error response into the required backend contract format.
 */
export function normalizeError(
  err: any,
  defaultHttpStatus = 500,
  source: 'spinwheel' | 'backend' | 'network' = 'backend'
): NormalizedError {
  // If the error has a response object (typical for upstream Spinwheel HTTP requests)
  if (err && typeof err === 'object' && err.responseBody) {
    const body = err.responseBody;
    const httpStatus = err.status || defaultHttpStatus;

    // Spinwheel envelope has 'status' block
    if (body.status && typeof body.status === 'object') {
      const code = String(body.status.code || 'UNKNOWN_ERROR');
      const desc = body.status.desc || '';
      const messages = Array.isArray(body.status.messages) ? body.status.messages : [];

      // Extract user facing description:
      // 1. First message's desc
      // 2. Main desc
      // 3. Fallback message
      let message = 'Unable to complete request. Please try again.';
      if (messages.length > 0 && messages[0] && messages[0].desc) {
        message = messages[0].desc;
      } else if (desc) {
        message = desc;
      }

      // Convert Spinwheel messages array to details structure
      const details = messages.length > 0
        ? messages.map((m: any) => ({ desc: m.desc || 'No description provided.' }))
        : [{ desc: message }];

      return {
        code,
        message,
        details,
        httpStatus,
        source: 'spinwheel'
      };
    }
  }

  // Network or other Axios-like errors
  if (err && typeof err === 'object' && err.message && err.name === 'FetchError') {
    return {
      code: 'NETWORK_ERROR',
      message: 'Failed to communicate with Spinwheel APIs. Please check upstream connectivity.',
      details: [{ desc: err.message }],
      httpStatus: 503,
      source: 'network'
    };
  }

  // Generic backend or uncaught Javascript errors
  const rawMsg = err instanceof Error ? err.message : String(err || 'Unknown error occurred.');
  return {
    code: 'UNKNOWN_ERROR',
    message: rawMsg || 'Unable to complete request. Please try again.',
    details: [{ desc: rawMsg || 'No detail provided.' }],
    httpStatus: defaultHttpStatus,
    source
  };
}
