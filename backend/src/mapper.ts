/**
 * Safely extracts non-empty string properties.
 */
function getNonEmptyString(obj: any, path: string[]): string {
  let curr = obj;
  for (const part of path) {
    if (!curr) return '';
    curr = curr[part];
  }
  return typeof curr === 'string' ? curr.trim() : '';
}

/**
 * Normalizes a raw Spinwheel Debt Profile response into a stable shape.
 */
export function normalizeDebtProfile(raw: any): any {
  if (!raw) return null;

  const data = raw.data || {};
  const status = raw.status || {};
  const creditReport = (data.creditReports && data.creditReports[0]) || {};
  const profile = creditReport.profile || {};

  // Sort score details descending by reported date
  let latestScoreDetail: any = null;
  if (creditReport.creditScoreDetails && creditReport.creditScoreDetails.length > 0) {
    const sorted = [...creditReport.creditScoreDetails].sort((a: any, b: any) => {
      const dateA = a.reportedDate ? new Date(a.reportedDate).getTime() : 0;
      const dateB = b.reportedDate ? new Date(b.reportedDate).getTime() : 0;
      return dateB - dateA;
    });
    latestScoreDetail = sorted[0];
  }

  // Full Name concatenation
  const nameParts = [profile.firstName, profile.middleName, profile.lastName].filter(Boolean);
  const fullName = nameParts.length > 0 ? nameParts.join(' ') : 'Unknown User';

  // Find current address, fallback to first address
  let primaryAddressObj = null;
  if (profile.addresses && profile.addresses.length > 0) {
    primaryAddressObj = profile.addresses.find((addr: any) => addr.residencyType === 'CURRENT') || profile.addresses[0];
  }
  
  const currentAddress = primaryAddressObj
    ? {
        addressLine1: primaryAddressObj.addressLine1 || '',
        city: primaryAddressObj.city || '',
        state: primaryAddressObj.state || '',
        zip: primaryAddressObj.zip || ''
      }
    : null;

  // Extract score factors
  const factors = (latestScoreDetail && latestScoreDetail.factors) || [];
  const normalizedFactors = factors.map((f: any) => ({
    code: f.code || 'N/A',
    description: f.description || 'No description provided.',
    reportedDate: latestScoreDetail.reportedDate || ''
  }));

  // Bankruptcies
  const bankruptcies = (creditReport.bankruptcies || []).map((b: any) => ({
    filedDate: b.filedDateWithFormat?.value || b.filedDate || '',
    dispositionDate: b.dispositionDateWithFormat?.value || b.dispositionDate || '',
    verifiedDate: b.verifiedDateWithFormat?.value || b.verifiedDate || '',
    reportedDate: b.reportedDateWithFormat?.value || b.reportedDate || '',
    caseNumber: b.caseNumber || '',
    type: b.type || '',
    filer: b.filer || '',
    disposition: b.disposition || '',
    priorDisposition: b.priorDisposition || '',
    liabilityAmount: b.liabilityAmount || 0,
    assetAmount: b.assetAmount || 0,
    exemptAmount: b.exemptAmount || 0,
    court: b.court || {},
    narratives: (b.narratives || []).map((n: any) => n.description || n.code || '')
  }));

  // Inquiries
  const inquiries = (creditReport.inquiries || []).map((i: any) => ({
    inquirerName: i.inquirerName || '',
    inquiryDate: i.inquiryDate || '',
    inquirerIndustryCode: i.inquirerIndustryCode || '',
    purposeType: i.purposeType || '',
    sourceBureau: i.sourceBureau || '',
    bureauSubscriberCode: i.bureauSubscriberCode || ''
  }));

  // Credit Attributes
  const creditAttributes = (creditReport.creditAttributes || []).map((a: any) => ({
    description: a.description || '',
    value: a.value || ''
  }));

  // Summary statistics
  const reportSummary = creditReport.summary || {};
  const summary = {
    totalSecuredDebtAmount: reportSummary.totalSecuredDebtAmount ?? 0,
    securedDebtLiabilitiesCount: reportSummary.securedDebtLiabilitiesCount ?? 0,
    totalUnsecuredDebtAmount: reportSummary.totalUnsecuredDebtAmount ?? 0,
    unsecuredDebtLiabilitiesCount: reportSummary.unsecuredDebtLiabilitiesCount ?? 0,
    totalUnsecuredDebtAmountExcludingStudent: reportSummary.totalUnsecuredDebtAmountExcludingStudent ?? 0,
    unsecuredDebtLiabilitiesCountExcludingStudent: reportSummary.unsecuredDebtLiabilitiesCountExcludingStudent ?? 0,
    totalUnknownDebtAmount: reportSummary.totalUnknownDebtAmount ?? 0,
    unknownDebtLiabilitiesCount: reportSummary.unknownDebtLiabilitiesCount ?? 0
  };

  // Helper to map single liability category
  const normalizeLiabilityList = (list: any[], category: string) => {
    if (!Array.isArray(list)) return [];
    return list.map((item) => {
      const p = item.cardProfile || item.liabilityProfile || {};
      const bal = item.balanceDetails || {};
      const stmt = item.statementSummary || {};
      const cred = item.creditor || {};
      const caps = item.capabilities || {};
      const trans = p.liabilityTransfers || {};

      // Resolve interest rate
      let interestRate = 0;
      if (item.aprs && item.aprs.length > 0) {
        interestRate = item.aprs[0].rate || 0;
      } else if (p.interestRateDerived !== undefined) {
        interestRate = p.interestRateDerived;
      }

      return {
        id: item.creditCardId || item.autoLoanId || item.homeLoanId || item.personalLoanId || item.studentLoanId || item.miscellaneousLiabilityId || Math.random().toString(),
        category,
        displayName: item.displayName || cred.originalName || 'Unknown Creditor',
        logoUrl: item.logoUrl || '',
        institutionName: cred.originalName || item.displayName || 'Unknown Creditor',
        institutionIndustryType: cred.industryType || '',
        institutionIndustryCode: cred.industryCode || '',
        institutionPhone: cred.phoneNumber || '',
        institutionSubscriberCode: cred.bureauSubscriberCode || '',
        institutionAddress: cred.address || null,
        maskedAccount: p.creditCardNumberMasked || p.accountNumberLastFour || '****',
        status: p.status || 'UNKNOWN',
        subtype: p.liabilitySubtype || '',
        debtType: p.debtType || '',
        outstandingBalance: bal.outstandingBalance ?? 0,
        minimumPaymentAmount: stmt.minimumPaymentAmount ?? 0,
        statementBalance: stmt.statementBalance ?? 0,
        principalBalance: stmt.principalBalance ?? 0,
        dueDate: stmt.dueDate || '',
        accountOriginationDate: p.accountOriginationDate || '',
        reportedDate: p.reportedDateWithFormat?.value || '',
        lastActivityDate: p.lastActivityDateWithFormat?.value || '',
        accountRating: p.accountRating || '',
        accountOwnershipType: p.accountOwnershipType || '',
        accountType: p.accountType || '',
        termsFrequency: p.termsFrequency || '',
        utilization: p.creditUtilization ?? null,
        availableCredit: p.availableCreditDerived ?? null,
        interestRate,
        loanOriginationAmount: p.loanOriginationAmount ?? 0,
        highCreditAmount: p.highCreditAmount ?? 0,
        loanTermInMonths: p.loanTermInMonths ?? 0,
        pendingLoanTermInMonthsDerived: p.pendingLoanTermInMonthsDerived ?? 0,
        derogatoryDataStatus: p.derogatoryDataStatus || '',
        collectionStatus: p.collectionStatus || '',
        chargeOffStatus: p.chargeOffStatus || '',
        adverseRatingCount: p.adverseRatingCount ?? 0,
        paymentHistoryLastAssessedStatementDate: p.paymentHistory?.lastAssessedStatementDate || '',
        paymentHistoryItems: p.paymentHistory?.details || [],
        narratives: (p.narratives || []).map((n: any) => n.description || n.code || ''),
        liabilityTransferFrom: trans.transferredFrom || null,
        liabilityTransferTo: trans.transferredTo || null,
        capabilities: caps
      };
    });
  };

  // Combine all liabilities
  const liabilities = [
    ...normalizeLiabilityList(data.creditCards, 'creditCard'),
    ...normalizeLiabilityList(data.autoLoans, 'autoLoan'),
    ...normalizeLiabilityList(data.homeLoans, 'homeLoan'),
    ...normalizeLiabilityList(data.personalLoans, 'personalLoan'),
    ...normalizeLiabilityList(data.studentLoans, 'studentLoan'),
    ...normalizeLiabilityList(data.miscellaneousLiabilities, 'miscellaneousLiability')
  ];

  return {
    userId: data.userId || '',
    extUserId: data.extUserId || '',
    fullName,
    ssnLastFour: profile.ssn || '',
    dateOfBirth: profile.dateOfBirth || '',
    currentAddress,
    bureau: latestScoreDetail?.sourceBureau || creditReport.sourceBureau || 'N/A',
    scoreValue: latestScoreDetail?.creditScore || profile.creditScore || null,
    scoreModel: latestScoreDetail?.model || profile.model || profile.modelName || 'VANTAGE_SCORE_3_0',
    scoreReportedDate: latestScoreDetail?.reportedDate || '',
    reportType: creditReport.type || '1_BUREAU.FULL',
    statusCode: status.code || 200,
    statusDesc: status.desc || 'success',
    factors: normalizedFactors,
    bankruptcies,
    inquiries,
    creditAttributes,
    summary,
    liabilities
  };
}

/**
 * Normalizes liabilities specifically for Balance Transfer offer matching & interest savings calculations.
 */
export function normalizeBalanceTransferLiabilities(debtProfile: any): any {
  if (!debtProfile || !Array.isArray(debtProfile.liabilities)) {
    return {
      userId: debtProfile?.userId || '',
      fullName: debtProfile?.fullName || 'Applicant',
      eligibleCards: []
    };
  }

  // Filter credit card and high-interest liabilities
  const eligibleCards = debtProfile.liabilities
    .filter((l: any) => l.category === 'creditCard' || l.category === 'personalLoan')
    .map((card: any) => {
      const balance = card.outstandingBalance > 0 ? card.outstandingBalance : 2500;
      const apr = card.interestRate > 0 ? card.interestRate : 23.99;
      
      // Calculate 18-month interest cost at current APR vs 0% Intro APR with 3% transfer fee
      const monthlyRate = (apr / 100) / 12;
      const currentMonthlyInterest = balance * monthlyRate;
      const total18moInterestNoBT = currentMonthlyInterest * 18;
      const btFee = balance * 0.03;
      const netSavings18mo = Math.max(0, total18moInterestNoBT - btFee);

      return {
        liabilityId: card.id,
        displayName: card.displayName || 'Credit Card Account',
        institutionName: card.institutionName || 'Card Issuer',
        maskedAccount: card.maskedAccount || '****',
        outstandingBalance: balance,
        balanceInCents: Math.round(balance * 100),
        payoffQuoteId: `pq_${card.id}_${Date.now()}`,
        currentApr: apr,
        minimumPaymentAmount: card.minimumPaymentAmount || Math.round(balance * 0.025),
        estimatedMonthlyInterest: Math.round(currentMonthlyInterest * 100) / 100,
        estimated18moSavings: Math.round(netSavings18mo * 100) / 100,
        btFee: Math.round(btFee * 100) / 100
      };
    });

  return {
    userId: debtProfile.userId,
    fullName: debtProfile.fullName,
    bureauScore: debtProfile.scoreValue || 720,
    eligibleCards
  };
}

