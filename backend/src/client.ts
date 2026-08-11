import path from 'path';
import dotenv from 'dotenv';

dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Base URL is hardcoded per specifications
const SPINWHEEL_BASE_URL = 'https://sandbox-api.spinwheel.io/v1';

// Read API key, fallback to `.env` key variable name 'spinwheel_sandbox' if 'SPINWHEEL_API_KEY' is missing
const API_KEY = process.env.SPINWHEEL_API_KEY || process.env.spinwheel_sandbox || '';

export interface SpinwheelResponse<T = any> {
  status: number;
  data?: T;
  responseBody?: any;
}

/**
 * Perform a request to Spinwheel API.
 */
async function request<T = any>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  path: string,
  body?: any
): Promise<SpinwheelResponse<T>> {
  if (!API_KEY) {
    throw new Error('SPINWHEEL_API_KEY or spinwheel_sandbox environment variable is not defined.');
  }

  const url = `${SPINWHEEL_BASE_URL}${path}`;
  const headers = {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json'
  };

  try {
    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    });

    let responseBody: any = null;
    const text = await response.text();
    if (text) {
      try {
        responseBody = JSON.parse(text);
      } catch (e) {
        responseBody = { rawText: text };
      }
    }

    if (!response.ok) {
      // Throw custom error containing status and parsed responseBody
      throw {
        status: response.status,
        responseBody,
        message: `Spinwheel API returned non-2xx status: ${response.status}`
      };
    }

    return {
      status: response.status,
      data: responseBody?.data,
      responseBody
    };
  } catch (error: any) {
    // If it's already a formatted error from non-2xx response, pass it up
    if (error && typeof error === 'object' && 'responseBody' in error) {
      throw error;
    }
    // Else wrap the network/system error
    throw {
      status: 500,
      message: error.message || 'Network request failed',
      name: error.name === 'TypeError' ? 'FetchError' : error.name
    };
  }
}

/**
 * Call POST /v1/users/connect/sms
 */
export async function connectUserSms(payload: {
  phoneNumber: string;
  dateOfBirth: string;
  extUserId: string;
}) {
  return request('POST', '/users/connect/sms', payload);
}

/**
 * Call POST /v1/users/{userId}/connect/sms/verify
 */
export async function verifyUserSms(userId: string, code: string) {
  return request('POST', `/users/${userId}/connect/sms/verify`, { code });
}
