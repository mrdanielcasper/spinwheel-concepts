import { describe, it, expect } from 'vitest';
import {
  orchestrateIdentityWaterfall,
  getWaterfallKpis,
  getOfficialSocureTestCases
} from '../socure';

describe('Socure RiskOS & Identity Waterfall Unit Tests', () => {
  it('should load official test cases from reference files', () => {
    const testCases = getOfficialSocureTestCases();
    expect(Array.isArray(testCases)).toBe(true);
  });

  it('should auto-approve clean PROVE_MATCH scenario on MNO mobile with no SIM swap', async () => {
    const result = await orchestrateIdentityWaterfall(
      {
        fullName: 'Stanley Brown',
        phoneNumber: '+15012345677',
        dob: '1944-03-30'
      },
      'PROVE_MATCH'
    );

    expect(result.scenario).toBe('PROVE_MATCH');
    expect(result.finalDecision).toBe('AUTO_APPROVED');
    expect(result.proveResult.status).toBe('MATCH');
    expect(result.proveResult.lineType).toBe('MOBILE_MNO');
    expect(result.spinwheelProfileProceed).toBe(true);
    expect(result.socureResult).toBeUndefined(); // Tier 2 bypassed, saving cost
  });

  it('should escalate to Socure RiskOS and rescue when Prove is inconclusive but Socure is clean', async () => {
    const result = await orchestrateIdentityWaterfall(
      {
        fullName: 'Jane Doe',
        phoneNumber: '+14155552671',
        dob: '1988-11-20'
      },
      'SOCURE_RESCUE'
    );

    expect(result.scenario).toBe('SOCURE_RESCUE');
    expect(result.finalDecision).toBe('RESCUED_APPROVE');
    expect(result.proveResult.status).toBe('INCONCLUSIVE');
    expect(result.socureResult?.invoked).toBe(true);
    expect(result.socureResult?.decision).toBe('ACCEPT');
    expect(result.spinwheelProfileProceed).toBe(true);
  });

  it('should reject synthetic fraud when Socure flags high synthetic identity risk', async () => {
    const result = await orchestrateIdentityWaterfall(
      {
        fullName: 'Fraudster Fake',
        phoneNumber: '+18005550199',
        dob: '1999-01-01'
      },
      'SYNTHETIC_FRAUD'
    );

    expect(result.scenario).toBe('SYNTHETIC_FRAUD');
    expect(result.finalDecision).toBe('REJECT_FRAUD');
    expect(result.socureResult?.syntheticFraudRisk).toBe('HIGH');
    expect(result.spinwheelProfileProceed).toBe(false);
  });

  it('should require Step-Up DocV on VOIP or recent SIM swap', async () => {
    const result = await orchestrateIdentityWaterfall(
      {
        fullName: 'Ambiguous User',
        phoneNumber: '+12125550144',
        dob: '1995-07-12'
      },
      'DOCV_STEPUP'
    );

    expect(result.scenario).toBe('DOCV_STEPUP');
    expect(result.finalDecision).toBe('STEP_UP_DOCV');
    expect(result.spinwheelProfileProceed).toBe(false);
  });

  it('should calculate waterfall KPIs correctly', () => {
    const kpis = getWaterfallKpis();
    expect(kpis.blendedTcoSavingsPercent).toBe(34.5);
    expect(kpis.netConversionLift).toBe('+37% on Prove-Failed Bucket');
    expect(kpis.kbaVendorExpenditureProposed).toBe('$0.00 (100% Retired)');
  });
});
