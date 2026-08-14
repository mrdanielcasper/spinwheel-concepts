import { describe, it, expect } from 'vitest';
import {
  calculateDebtMetrics,
  simulatePayoffStrategies,
  generateCoPilotAnalysis,
  processCoPilotChat
} from '../copilot';

describe('Agentic Co-Pilot & Financial Engine Unit Tests', () => {
  const sampleLiabilities = [
    {
      id: 'card_1',
      displayName: 'Chase Freedom',
      category: 'creditCard',
      outstandingBalance: 3000,
      interestRate: 26.99,
      creditLimit: 5000,
      minimumPaymentAmount: 75
    },
    {
      id: 'card_2',
      displayName: 'Discover it',
      category: 'creditCard',
      outstandingBalance: 1200,
      interestRate: 19.99,
      creditLimit: 3000,
      minimumPaymentAmount: 35
    }
  ];

  it('should accurately compute debt health metrics', () => {
    const metrics = calculateDebtMetrics(sampleLiabilities, 500);

    expect(metrics.totalDebt).toBe(4200);
    expect(metrics.totalCreditLimit).toBe(8000);
    expect(metrics.utilizationRate).toBe(53); // 4200 / 8000 = 52.5% -> 53%
    expect(metrics.weightedApr).toBeGreaterThan(24);
    expect(metrics.activeCardsCount).toBe(2);
    expect(metrics.monthlyInterestTotal).toBeGreaterThan(0);
    expect(metrics.annualInterestTotal).toBeGreaterThan(0);
  });

  it('should simulate Avalanche vs Snowball payoff strategies', () => {
    const simulations = simulatePayoffStrategies(sampleLiabilities, 150);

    expect(simulations.avalanche).toBeDefined();
    expect(simulations.avalanche.strategyType).toBe('avalanche');
    expect(simulations.avalanche.payoffMonths).toBeGreaterThan(0);

    expect(simulations.snowball).toBeDefined();
    expect(simulations.snowball.strategyType).toBe('snowball');
    expect(simulations.snowball.payoffMonths).toBeGreaterThan(0);

    expect(simulations.balanceTransfer).toBeDefined();
    expect(simulations.balanceTransfer.promoApr).toBe(0);
    expect(simulations.balanceTransfer.transferFee).toBeGreaterThan(0);
  });

  it('should handle zero liabilities in strategy simulation gracefully', () => {
    const emptySim = simulatePayoffStrategies([]);
    expect(emptySim.avalanche.payoffMonths).toBe(0);
    expect(emptySim.snowball.payoffMonths).toBe(0);
    expect(emptySim.balanceTransfer.eligibleAmount).toBe(0);
  });

  it('should generate deterministic fallback CoPilot analysis when API keys are absent', async () => {
    const fakeProfile = {
      userId: 'test-user-id',
      fullName: 'Test User',
      liabilities: sampleLiabilities
    };

    const analysis = await generateCoPilotAnalysis(fakeProfile, 400);

    expect(analysis).toBeDefined();
    expect(analysis.checkingBalance).toBe(400);
    expect(analysis.metrics.totalDebt).toBe(4200);
    expect(analysis.topRecommendation).toBeDefined();
    expect(analysis.topRecommendation?.cardName).toBe('Chase Freedom'); // Highest APR
    expect(analysis.aiInsights).toBeDefined();
  });

  it('should process CoPilot chat queries deterministically', async () => {
    const fakeProfile = {
      userId: 'test-user-id',
      fullName: 'Test User',
      liabilities: sampleLiabilities
    };

    const chatResponse = await processCoPilotChat(
      'test-user-id',
      'How should I pay off my credit cards with avalanche vs snowball?',
      fakeProfile,
      []
    );
    expect(chatResponse).toBeDefined();
    expect(typeof chatResponse.reply).toBe('string');
    expect(chatResponse.reply.length).toBeGreaterThan(10);
  });
});
