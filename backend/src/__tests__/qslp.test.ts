import { describe, it, expect } from 'vitest';
import {
  evaluateQslpCompliance,
  dispatchQslpRecordkeeperMatch,
  getQslpKpis,
  generateQslpAuditCertificate
} from '../qslp';

describe('SECURE 2.0 §110 QSLP Engine Unit Tests', () => {
  it('should validate eligible student loan payment under SECURE 2.0 rules', () => {
    const evaluation = evaluateQslpCompliance('COMPLIANT_MATCH', {
      annualSalary: 95000,
      paymentAmount: 350.00,
      matchPercent: 0.50
    });

    expect(evaluation.complianceStatus).toBe('VERIFIED_COMPLIANT');
    expect(evaluation.employee.fullName).toBe('Alex Morgan');
    expect(evaluation.servicerTradeline.isIrc221dQualified).toBe(true);
    expect(evaluation.matchCalculation.employerMatchAmount).toBe(175.00);
    expect(evaluation.auditTrail.erisaFiduciarySafeHarbor).toBe(true);
    expect(evaluation.irsFivePointChecks.every((c) => c.passed)).toBe(true);
  });

  it('should flag ineligibility when student loan payor is a third party', () => {
    const evaluation = evaluateQslpCompliance('THIRD_PARTY_PAYOR_REJECT');

    expect(evaluation.complianceStatus).toBe('COMPLIANCE_REJECTED');
    expect(evaluation.matchCalculation.employerMatchAmount).toBe(0);
    const payorCheck = evaluation.irsFivePointChecks.find((c) => c.id === 'RULE_4_PAYOR_IDENTITY_MATCH');
    expect(payorCheck?.passed).toBe(false);
  });

  it('should flag ineligibility when debt is non-qualified under IRC §221(d)', () => {
    const evaluation = evaluateQslpCompliance('NON_QUALIFIED_DEBT_REJECT');

    expect(evaluation.complianceStatus).toBe('COMPLIANCE_REJECTED');
    expect(evaluation.servicerTradeline.isIrc221dQualified).toBe(false);
    expect(evaluation.matchCalculation.employerMatchAmount).toBe(0);
  });

  it('should cap match when annual match ceiling is reached', () => {
    const evaluation = evaluateQslpCompliance('CAP_REACHED');

    expect(evaluation.complianceStatus).toBe('VERIFIED_COMPLIANT');
    expect(evaluation.matchCalculation.remainingMatchAvailable).toBe(0);
  });

  it('should dispatch match transaction to recordkeeper payroll rails', () => {
    const matchResult = dispatchQslpRecordkeeperMatch('qslp_evt_test_123', 'Fidelity Investments');

    expect(matchResult).toBeDefined();
    expect(matchResult.success).toBe(true);
    expect(matchResult.ledgerStatus).toBe('MATCH_POSTED_TO_PARTICIPANT_ACCOUNT');
    expect(matchResult.recordkeeper).toBe('Fidelity Investments');
    expect(matchResult.complianceAttestation).toContain('IRS Notice 2024-63 Section 110');
  });

  it('should return QSLP engine KPIs', () => {
    const kpis = getQslpKpis();
    expect(kpis.qslpSaaSRevenueModel).toContain('PEPM');
    expect(kpis.arrMultiplierVsRawApi).toContain('12.5x');
    expect(kpis.annualRecurringRevenue15kCohort).toBe('$450,000 ARR');
  });

  it('should generate verifiable cryptographic audit certificate', () => {
    const certificate = generateQslpAuditCertificate('qslp_evt_test_123');

    expect(certificate).toBeDefined();
    expect(certificate.certificateId).toContain('IRS-SECURE20-QSLP_EVT_TEST_123');
    expect(certificate.fiduciarySafeHarborStatus).toBe('CERTIFIED_SAFE_HARBOR');
    expect(certificate.cryptographicIntegrity.merkleDataHash).toBeDefined();
    expect(certificate.cryptographicIntegrity.hashingAlgorithm).toBe('SHA-256');
  });
});
