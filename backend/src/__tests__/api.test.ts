import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../index';

describe('Express API Integration Tests', () => {
  it('GET /api/health returns healthy status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
    expect(res.body.timestamp).toBeDefined();
  });

  it('GET /api/docs/openapi.json returns valid OpenAPI 3.0 specification', async () => {
    const res = await request(app).get('/api/docs/openapi.json');
    expect(res.status).toBe(200);
    expect(res.body.openapi).toBe('3.0.3');
    expect(res.body.info.title).toContain('Spinwheel');
  });

  it('GET /api/docs returns HTML Swagger documentation UI', async () => {
    const res = await request(app).get('/api/docs');
    expect(res.status).toBe(200);
    expect(res.text).toContain('Spinwheel Developer API Reference');
  });

  describe('User Connection & Verification Routes', () => {
    it('POST /api/connect-user validates invalid inputs with 400', async () => {
      const res = await request(app)
        .post('/api/connect-user')
        .send({ phoneNumber: 'invalid', dateOfBirth: 'invalid' });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('POST /api/verify-user validates invalid OTP inputs with 400', async () => {
      const res = await request(app)
        .post('/api/verify-user')
        .send({ userId: '', code: '12' });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('POST /api/users/:userId/debt-profile rejects invalid UUIDs with 400', async () => {
      const res = await request(app)
        .post('/api/users/not-a-valid-uuid/debt-profile')
        .send({});
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('POST /api/users/:userId/debt-profile fetches normalized profile with valid UUID', async () => {
      const res = await request(app)
        .post('/api/users/c3cf91d9-21c8-413c-82bf-286d6e05593e/debt-profile')
        .send({ liabilityType: 'CREDIT_CARD' });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(Array.isArray(res.body.data.liabilities)).toBe(true);
    });
  });

  describe('Balance Transfer Routes', () => {
    it('POST /api/balance-transfer/connect-preverified rejects invalid payload', async () => {
      const res = await request(app)
        .post('/api/balance-transfer/connect-preverified')
        .send({ phoneNumber: 'bad' });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('POST /api/balance-transfer/connect-preverified accepts valid request', async () => {
      const res = await request(app)
        .post('/api/balance-transfer/connect-preverified')
        .send({
          phoneNumber: '+14155552671',
          dateOfBirth: '1990-05-15'
        });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.connectionStatus).toBe('VERIFIED');
    });

    it('POST /api/balance-transfer/liabilities rejects missing userId', async () => {
      const res = await request(app)
        .post('/api/balance-transfer/liabilities')
        .send({});
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('POST /api/balance-transfer/liabilities returns eligible balance transfer cards', async () => {
      const res = await request(app)
        .post('/api/balance-transfer/liabilities')
        .send({
          userId: 'c3cf91d9-21c8-413c-82bf-286d6e05593e'
        });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.eligibleCards)).toBe(true);
    });

    it('POST /api/balance-transfer/submit rejects invalid body', async () => {
      const res = await request(app)
        .post('/api/balance-transfer/submit')
        .send({ userId: 123 });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('POST /api/balance-transfer/submit validates and dispatches payment batch', async () => {
      const res = await request(app)
        .post('/api/balance-transfer/submit')
        .send({
          userId: 'c3cf91d9-21c8-413c-82bf-286d6e05593e',
          payments: [
            {
              liabilityId: 'l_card_test',
              amountInCents: 150000,
              payoffQuoteId: 'pq_123'
            }
          ]
        });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('SETTLED');
    });
  });

  describe('Co-Pilot Routes', () => {
    it('POST /api/copilot/analyze returns debt payoff strategies and metrics', async () => {
      const res = await request(app)
        .post('/api/copilot/analyze')
        .send({
          userId: 'c3cf91d9-21c8-413c-82bf-286d6e05593e',
          checkingBalance: 500
        });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.strategies).toBeDefined();
      expect(res.body.data.strategies.avalanche).toBeDefined();
      expect(res.body.data.strategies.snowball).toBeDefined();
    });

    it('POST /api/copilot/chat rejects missing message', async () => {
      const res = await request(app)
        .post('/api/copilot/chat')
        .send({ userId: 'c3cf91d9-21c8-413c-82bf-286d6e05593e' });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('POST /api/copilot/chat responds to financial queries', async () => {
      const res = await request(app)
        .post('/api/copilot/chat')
        .send({
          userId: 'c3cf91d9-21c8-413c-82bf-286d6e05593e',
          message: 'What is my highest APR credit card?'
        });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.reply).toBeDefined();
    });
  });

  describe('Identity Waterfall Routes', () => {
    it('GET /api/identity/waterfall/kpis returns identity orchestration statistics', async () => {
      const res = await request(app).get('/api/identity/waterfall/kpis');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.blendedTcoSavingsPercent).toBeDefined();
    });

    it('GET /api/identity/waterfall/evaluation/:evalId returns status', async () => {
      const res = await request(app).get('/api/identity/waterfall/evaluation/eval_sample_123');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
    });

    it('POST /api/identity/waterfall/verify runs waterfall decisioning', async () => {
      const res = await request(app)
        .post('/api/identity/waterfall/verify')
        .send({
          scenarioOverride: 'PROVE_MATCH',
          userData: {
            fullName: 'Stanley Brown',
            phoneNumber: '+15012345677',
            dob: '1944-03-30'
          }
        });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.finalDecision).toBe('AUTO_APPROVED');
    });

    it('POST /api/identity/waterfall/docv-complete handles biometric step-up results', async () => {
      const res = await request(app)
        .post('/api/identity/waterfall/docv-complete')
        .send({ evalId: 'eval_123', passed: true });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.decision).toBe('ACCEPT');
    });

    it('POST /api/identity/waterfall/docv-complete handles failure cases', async () => {
      const res = await request(app)
        .post('/api/identity/waterfall/docv-complete')
        .send({ evalId: 'eval_123', passed: false });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.decision).toBe('REJECT');
    });

    it('POST /api/identity/waterfall/webhook accepts incoming webhook payloads', async () => {
      const res = await request(app)
        .post('/api/identity/waterfall/webhook')
        .send({ event: 'evaluation_completed', eval_id: 'eval_123' });
      expect(res.status).toBe(200);
      expect(res.body.received).toBe(true);
    });
  });

  describe('SECURE 2.0 QSLP Routes', () => {
    it('GET /api/qslp/kpis returns ERISA / IRS compliance statistics', async () => {
      const res = await request(app).get('/api/qslp/kpis');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.qslpSaaSRevenueModel).toBeDefined();
    });

    it('POST /api/qslp/evaluate determines IRC §401(m)(13) eligibility', async () => {
      const res = await request(app)
        .post('/api/qslp/evaluate')
        .send({
          scenario: 'COMPLIANT_MATCH',
          employeeId: 'emp_001',
          annualSalary: 85000,
          paymentAmount: 400
        });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.complianceStatus).toBe('VERIFIED_COMPLIANT');
    });

    it('POST /api/qslp/dispatch-match schedules recordkeeper payroll match', async () => {
      const res = await request(app)
        .post('/api/qslp/dispatch-match')
        .send({
          eventId: 'qslp_evt_001',
          recordkeeper: 'Fidelity Investments'
        });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.ledgerStatus).toBe('MATCH_POSTED_TO_PARTICIPANT_ACCOUNT');
    });

    it('GET /api/qslp/certificate/:eventId creates cryptographic audit certificate', async () => {
      const res = await request(app).get('/api/qslp/certificate/qslp_evt_001');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.certificateId).toBeDefined();
      expect(res.body.data.cryptographicIntegrity.merkleDataHash).toBeDefined();
    });
  });
});
