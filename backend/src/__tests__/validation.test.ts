import { describe, it, expect } from 'vitest';
import {
  validateConnectUser,
  validateVerifyUser,
  validateDebtProfileParams,
  validateBalanceTransferSubmit,
  ALLOWED_LIABILITY_TYPES
} from '../validation';

describe('Validation Unit Tests', () => {
  describe('validateConnectUser', () => {
    it('should validate valid E.164 phone and YYYY-MM-DD DOB', () => {
      const result = validateConnectUser({
        phoneNumber: '+14155552671',
        dateOfBirth: '1990-05-15'
      });
      expect(result.valid).toBe(true);
      expect(result.data).toEqual({
        phoneNumber: '+14155552671',
        dateOfBirth: '1990-05-15'
      });
    });

    it('should reject non-object or null request body', () => {
      expect(validateConnectUser(null).valid).toBe(false);
      expect(validateConnectUser('string').valid).toBe(false);
      expect(validateConnectUser(undefined).valid).toBe(false);
    });

    it('should reject unknown extra fields for strict security', () => {
      const result = validateConnectUser({
        phoneNumber: '+14155552671',
        dateOfBirth: '1990-05-15',
        maliciousPayload: 'DROP TABLE users;'
      });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Unknown extra fields');
    });

    it('should reject missing or non-string phoneNumber', () => {
      expect(validateConnectUser({ dateOfBirth: '1990-05-15' }).valid).toBe(false);
      expect(validateConnectUser({ phoneNumber: 1234567890, dateOfBirth: '1990-05-15' }).valid).toBe(false);
    });

    it('should reject non-E.164 or invalid US phone formats', () => {
      expect(validateConnectUser({ phoneNumber: '4155552671', dateOfBirth: '1990-05-15' }).valid).toBe(false);
      expect(validateConnectUser({ phoneNumber: '+441234567890', dateOfBirth: '1990-05-15' }).valid).toBe(false);
      expect(validateConnectUser({ phoneNumber: '+11234567890', dateOfBirth: '1990-05-15' }).valid).toBe(false);
    });

    it('should reject missing, non-string, or invalid dateOfBirth format', () => {
      expect(validateConnectUser({ phoneNumber: '+14155552671' }).valid).toBe(false);
      expect(validateConnectUser({ phoneNumber: '+14155552671', dateOfBirth: 19900515 }).valid).toBe(false);
      expect(validateConnectUser({ phoneNumber: '+14155552671', dateOfBirth: '05-15-1990' }).valid).toBe(false);
      expect(validateConnectUser({ phoneNumber: '+14155552671', dateOfBirth: 'invalid-date' }).valid).toBe(false);
    });
  });

  describe('validateVerifyUser', () => {
    it('should validate valid userId and 6-digit OTP code', () => {
      const result = validateVerifyUser({
        userId: 'c3cf91d9-21c8-413c-82bf-286d6e05593e',
        code: '123456'
      });
      expect(result.valid).toBe(true);
      expect(result.data?.code).toBe('123456');
    });

    it('should reject non-object body', () => {
      expect(validateVerifyUser(null).valid).toBe(false);
      expect(validateVerifyUser(123).valid).toBe(false);
    });

    it('should reject extra fields', () => {
      const result = validateVerifyUser({
        userId: 'c3cf91d9-21c8-413c-82bf-286d6e05593e',
        code: '123456',
        extra: true
      });
      expect(result.valid).toBe(false);
    });

    it('should reject missing or empty userId', () => {
      expect(validateVerifyUser({ code: '123456' }).valid).toBe(false);
      expect(validateVerifyUser({ userId: '   ', code: '123456' }).valid).toBe(false);
      expect(validateVerifyUser({ userId: 12345, code: '123456' }).valid).toBe(false);
    });

    it('should reject invalid OTP codes (non-6 digits, letters, empty)', () => {
      expect(validateVerifyUser({ userId: 'u1', code: '' }).valid).toBe(false);
      expect(validateVerifyUser({ userId: 'u1', code: 123456 }).valid).toBe(false);
      expect(validateVerifyUser({ userId: 'u1', code: '12345' }).valid).toBe(false);
      expect(validateVerifyUser({ userId: 'u1', code: '1234567' }).valid).toBe(false);
      expect(validateVerifyUser({ userId: 'u1', code: '12345A' }).valid).toBe(false);
    });
  });

  describe('validateDebtProfileParams', () => {
    it('should accept valid UUID and undefined liabilityType', () => {
      const result = validateDebtProfileParams('c3cf91d9-21c8-413c-82bf-286d6e05593e');
      expect(result.valid).toBe(true);
    });

    it('should accept valid liabilityTypes from ALLOWED_LIABILITY_TYPES', () => {
      ALLOWED_LIABILITY_TYPES.forEach((type) => {
        const result = validateDebtProfileParams('c3cf91d9-21c8-413c-82bf-286d6e05593e', type);
        expect(result.valid).toBe(true);
      });
    });

    it('should reject missing or non-string or non-UUID userId', () => {
      expect(validateDebtProfileParams(null).valid).toBe(false);
      expect(validateDebtProfileParams('').valid).toBe(false);
      expect(validateDebtProfileParams('invalid-uuid-format').valid).toBe(false);
    });

    it('should reject unknown liabilityType', () => {
      const result = validateDebtProfileParams('c3cf91d9-21c8-413c-82bf-286d6e05593e', 'CRYPTO_LOAN');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid liabilityType');
    });
  });

  describe('validateBalanceTransferSubmit', () => {
    it('should validate valid balance transfer submission', () => {
      const result = validateBalanceTransferSubmit({
        userId: 'c3cf91d9-21c8-413c-82bf-286d6e05593e',
        payments: [
          { liabilityId: 'l_card_1', amountInCents: 150000, payoffQuoteId: 'pq_1' },
          { liabilityId: 'l_card_2', amountInCents: 50000 }
        ]
      });
      expect(result.valid).toBe(true);
      expect(result.data?.payments.length).toBe(2);
    });

    it('should reject non-object body', () => {
      expect(validateBalanceTransferSubmit(null).valid).toBe(false);
    });

    it('should reject missing userId or invalid types', () => {
      expect(validateBalanceTransferSubmit({ payments: [{ liabilityId: 'l1', amountInCents: 100 }] }).valid).toBe(false);
      expect(validateBalanceTransferSubmit({ userId: 123, payments: [{ liabilityId: 'l1', amountInCents: 100 }] }).valid).toBe(false);
    });

    it('should reject non-array or empty payments list', () => {
      expect(validateBalanceTransferSubmit({ userId: 'u1', payments: [] }).valid).toBe(false);
      expect(validateBalanceTransferSubmit({ userId: 'u1', payments: 'none' }).valid).toBe(false);
    });

    it('should reject payment items missing liabilityId or having non-positive amountInCents', () => {
      expect(validateBalanceTransferSubmit({
        userId: 'u1',
        payments: [{ liabilityId: '', amountInCents: 1000 }]
      }).valid).toBe(false);

      expect(validateBalanceTransferSubmit({
        userId: 'u1',
        payments: [{ liabilityId: 'l1', amountInCents: -50 }]
      }).valid).toBe(false);

      expect(validateBalanceTransferSubmit({
        userId: 'u1',
        payments: [{ liabilityId: 'l1', amountInCents: 0 }]
      }).valid).toBe(false);
    });
  });
});
