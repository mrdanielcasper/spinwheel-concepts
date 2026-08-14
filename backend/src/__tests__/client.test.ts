import { describe, it, expect, vi } from 'vitest';
import {
  fetchDebtProfile,
  connectPreVerifiedUser,
  fetchPayoffQuote,
  createLiabilityPayment,
  getReferenceDebtProfile
} from '../client';

describe('Spinwheel API Client & Fallback Engine Unit Tests', () => {
  it('should load reference debt profile for sandbox user when present', () => {
    const profile = getReferenceDebtProfile('c3cf91d9-21c8-413c-82bf-286d6e05593e');
    expect(profile).toBeDefined();
    if (profile) {
      expect(profile.data?.userId).toBe('c3cf91d9-21c8-413c-82bf-286d6e05593e');
    }
  });

  it('should fetch debt profile and utilize fallback or cache safely without throwing', async () => {
    const profile = await fetchDebtProfile('c3cf91d9-21c8-413c-82bf-286d6e05593e');
    expect(profile).toBeDefined();
    expect(profile.data).toBeDefined();
  });

  it('should generate valid payoff quote for a liability account', async () => {
    const quote = await fetchPayoffQuote('c3cf91d9-21c8-413c-82bf-286d6e05593e', 'l_card_test_1');
    expect(quote).toBeDefined();
    expect(quote.status).toBe(200);
    expect(quote.data?.liabilityId).toBe('l_card_test_1');
    expect(quote.data?.payoffQuoteId).toBeDefined();
  });

  it('should create liability payment transaction and simulate settlement', async () => {
    const paymentResult = await createLiabilityPayment({
      userId: 'c3cf91d9-21c8-413c-82bf-286d6e05593e',
      payments: [
        {
          liabilityId: 'l_card_1',
          amountInCents: 25000,
          payoffQuoteId: 'pq_test_1'
        }
      ]
    });

    expect(paymentResult).toBeDefined();
    expect(paymentResult.status).toBe(200);
    expect(paymentResult.data?.status).toBe('SETTLED');
    expect(paymentResult.data?.totalAmountInCents).toBe(25000);
    expect(paymentResult.data?.payments[0].liabilityId).toBe('l_card_1');
  });

  it('should connect pre-verified user with mock fallback', async () => {
    const connResult = await connectPreVerifiedUser({
      phoneNumber: '+14155552671',
      dateOfBirth: '1990-05-15',
      extUserId: 'ext_test_1'
    });

    expect(connResult).toBeDefined();
  });
});
