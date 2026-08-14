import { describe, it, expect } from 'vitest';
import { normalizeError } from '../parser';

describe('Parser & Error Normalization Unit Tests', () => {
  it('should parse Spinwheel API structured envelope errors with status.messages', () => {
    const rawError = {
      status: 400,
      responseBody: {
        status: {
          code: 'INVALID_PHONE_NUMBER',
          desc: 'The phone number provided is inactive',
          messages: [
            { code: 'PHONE_INACTIVE', desc: 'Carrier reported disconnected number.' }
          ]
        }
      }
    };

    const normalized = normalizeError(rawError);
    expect(normalized.code).toBe('INVALID_PHONE_NUMBER');
    expect(normalized.message).toBe('Carrier reported disconnected number.');
    expect(normalized.httpStatus).toBe(400);
    expect(normalized.source).toBe('spinwheel');
    expect(normalized.details[0].desc).toBe('Carrier reported disconnected number.');
  });

  it('should parse Spinwheel API error when messages array is empty', () => {
    const rawError = {
      status: 404,
      responseBody: {
        status: {
          code: 'USER_NOT_FOUND',
          desc: 'Target user does not exist in sandbox',
          messages: []
        }
      }
    };

    const normalized = normalizeError(rawError);
    expect(normalized.code).toBe('USER_NOT_FOUND');
    expect(normalized.message).toBe('Target user does not exist in sandbox');
    expect(normalized.httpStatus).toBe(404);
    expect(normalized.source).toBe('spinwheel');
  });

  it('should parse FetchError as NETWORK_ERROR with 503 status', () => {
    const fetchError = {
      name: 'FetchError',
      message: 'getaddrinfo ENOTFOUND sandbox-api.spinwheel.io'
    };

    const normalized = normalizeError(fetchError);
    expect(normalized.code).toBe('NETWORK_ERROR');
    expect(normalized.httpStatus).toBe(503);
    expect(normalized.source).toBe('network');
    expect(normalized.message).toContain('Failed to communicate with Spinwheel APIs');
  });

  it('should normalize standard JavaScript Error instances', () => {
    const error = new Error('Database connection timed out');
    const normalized = normalizeError(error, 500, 'backend');

    expect(normalized.code).toBe('UNKNOWN_ERROR');
    expect(normalized.message).toBe('Database connection timed out');
    expect(normalized.httpStatus).toBe(500);
    expect(normalized.source).toBe('backend');
  });

  it('should normalize primitive strings or null errors gracefully', () => {
    const normalizedString = normalizeError('Unexpected crash');
    expect(normalizedString.message).toBe('Unexpected crash');

    const normalizedNull = normalizeError(null);
    expect(normalizedNull.code).toBe('UNKNOWN_ERROR');
    expect(normalizedNull.httpStatus).toBe(500);
  });
});
