import { describe, it, expect } from 'vitest';
import { normalizeDebtProfile, normalizeBalanceTransferLiabilities } from '../mapper';

describe('Mapper & Data Transformation Unit Tests', () => {
  const sampleRawProfile = {
    status: { code: 200, desc: 'SUCCESS' },
    data: {
      userId: 'c3cf91d9-21c8-413c-82bf-286d6e05593e',
      extUserId: 'ext_123',
      creditReports: [
        {
          type: '1_BUREAU.FULL',
          sourceBureau: 'EQUIFAX',
          profile: {
            firstName: 'Stanley',
            middleName: 'M',
            lastName: 'Brown',
            ssn: '6664',
            dateOfBirth: '1944-03-30',
            addresses: [
              {
                residencyType: 'CURRENT',
                addressLine1: '6383 Brown Avenue',
                city: 'Springfield',
                state: 'NY',
                zip: '10552'
              }
            ]
          },
          creditScoreDetails: [
            {
              creditScore: 742,
              model: 'VANTAGE_SCORE_3_0',
              reportedDate: '2025-01-15',
              factors: [
                { code: 'F01', description: 'Low credit utilization on revolving cards' }
              ]
            }
          ],
          bankruptcies: [
            {
              caseNumber: 'BK-2021-99',
              liabilityAmount: 0,
              narratives: [{ description: 'Discharged' }]
            }
          ],
          inquiries: [
            {
              inquirerName: 'CHASE BANK',
              inquiryDate: '2024-11-10',
              purposeType: 'CREDIT_CARD'
            }
          ],
          creditAttributes: [
            { description: 'Revolving Trades Count', value: '4' }
          ],
          summary: {
            totalSecuredDebtAmount: 180000,
            securedDebtLiabilitiesCount: 1,
            totalUnsecuredDebtAmount: 8500,
            unsecuredDebtLiabilitiesCount: 3
          }
        }
      ],
      creditCards: [
        {
          creditCardId: 'card_chase_sapphire',
          displayName: 'Chase Sapphire Preferred',
          cardProfile: {
            creditCardNumberMasked: '****4491',
            status: 'OPEN',
            creditUtilization: 28,
            availableCreditDerived: 7200
          },
          balanceDetails: {
            outstandingBalance: 2800
          },
          statementSummary: {
            minimumPaymentAmount: 70,
            dueDate: '2025-03-15'
          },
          creditor: {
            originalName: 'JPMorgan Chase Bank'
          },
          aprs: [{ rate: 24.99 }]
        }
      ],
      autoLoans: [
        {
          autoLoanId: 'loan_toyota',
          displayName: 'Toyota Financial Services',
          liabilityProfile: {
            accountNumberLastFour: '****1092',
            status: 'OPEN',
            interestRateDerived: 4.5
          },
          balanceDetails: {
            outstandingBalance: 14500
          },
          statementSummary: {
            minimumPaymentAmount: 350
          }
        }
      ]
    }
  };

  it('should normalize complete raw debt profile', () => {
    const normalized = normalizeDebtProfile(sampleRawProfile);

    expect(normalized).toBeDefined();
    expect(normalized.userId).toBe('c3cf91d9-21c8-413c-82bf-286d6e05593e');
    expect(normalized.fullName).toBe('Stanley M Brown');
    expect(normalized.scoreValue).toBe(742);
    expect(normalized.scoreModel).toBe('VANTAGE_SCORE_3_0');
    expect(normalized.bureau).toBe('EQUIFAX');
    expect(normalized.currentAddress?.city).toBe('Springfield');
    expect(normalized.currentAddress?.state).toBe('NY');
    expect(normalized.liabilities.length).toBe(2);

    const card = normalized.liabilities.find((l: any) => l.category === 'creditCard');
    expect(card).toBeDefined();
    expect(card.displayName).toBe('Chase Sapphire Preferred');
    expect(card.interestRate).toBe(24.99);
    expect(card.outstandingBalance).toBe(2800);
  });

  it('should return null when input raw is empty or null', () => {
    expect(normalizeDebtProfile(null)).toBeNull();
    expect(normalizeDebtProfile(undefined)).toBeNull();
  });

  it('should normalize balance transfer eligible cards with net savings calculations', () => {
    const normalized = normalizeDebtProfile(sampleRawProfile);
    const btData = normalizeBalanceTransferLiabilities(normalized);

    expect(btData.userId).toBe('c3cf91d9-21c8-413c-82bf-286d6e05593e');
    expect(btData.eligibleCards.length).toBe(1);
    const card = btData.eligibleCards[0];
    expect(card.liabilityId).toBe('card_chase_sapphire');
    expect(card.outstandingBalance).toBe(2800);
    expect(card.currentApr).toBe(24.99);
    expect(card.btFee).toBe(84); // 3% of 2800
    expect(card.estimated18moSavings).toBeGreaterThan(500);
  });

  it('should handle empty or null debt profiles in balance transfer normalization gracefully', () => {
    const emptyResult = normalizeBalanceTransferLiabilities(null);
    expect(emptyResult.eligibleCards).toEqual([]);
  });
});
