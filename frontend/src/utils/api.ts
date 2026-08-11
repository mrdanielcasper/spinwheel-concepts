export interface ApiSuccessResponse<T = any> {
  success: true;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details: Array<{ desc: string }>;
    httpStatus: number;
    source: string;
  };
}

export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Common call implementation.
 */
async function callApi<T = any>(method: 'POST' | 'GET', path: string, body?: any): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(path, {
      method,
      headers: {
        'Content-Type': 'application/json'
      },
      body: body ? JSON.stringify(body) : undefined
    });

    const json = await response.json();
    return json as ApiResponse<T>;
  } catch (err: any) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: err.message || 'Failed to communicate with local backend server.',
        details: [{ desc: err.message || 'No transport layer detail.' }],
        httpStatus: 500,
        source: 'network'
      }
    };
  }
}

export async function connectUser(phoneNumber: string, dateOfBirth: string) {
  return callApi<any>('POST', '/api/connect-user', { phoneNumber, dateOfBirth });
}

export async function verifyUser(userId: string, code: string) {
  return callApi<any>('POST', '/api/verify-user', { userId, code });
}
