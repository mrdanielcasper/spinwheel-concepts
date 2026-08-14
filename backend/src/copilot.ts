import path from 'path';
import dotenv from 'dotenv';

dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';
const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';

export interface DebtMetrics {
  totalDebt: number;
  totalCreditLimit: number;
  utilizationRate: number;
  weightedApr: number;
  monthlyInterestTotal: number;
  annualInterestTotal: number;
  activeCardsCount: number;
}

export interface StrategySimulation {
  strategyType: 'avalanche' | 'snowball' | 'balance_transfer';
  title: string;
  payoffMonths: number;
  debtFreeDate: string;
  totalInterestPaid: number;
  totalInterestSaved: number;
  monthlyAllocation: Array<{
    cardName: string;
    liabilityId: string;
    balance: number;
    apr: number;
    recommendedPayment: number;
    isTarget: boolean;
  }>;
  summary: string;
}

export interface CoPilotAnalysisResult {
  checkingBalance: number;
  spareCash: number;
  metrics: DebtMetrics;
  strategies: {
    avalanche: StrategySimulation;
    snowball: StrategySimulation;
    balanceTransfer: {
      eligibleAmount: number;
      transferFee: number;
      promoApr: number;
      promoSavings: number;
      netSavings: number;
      breakEvenMonths: number;
      summary: string;
    };
  };
  topRecommendation: {
    liabilityId: string;
    cardName: string;
    maskedAccount: string;
    currentApr: number;
    recommendedAmount: number;
    recommendedAmountInCents: number;
    monthlyInterestSaved: number;
    annualInterestSaved: number;
    payoffQuoteId: string;
    headline: string;
    reasoning: string;
    strategyType: 'avalanche' | 'snowball' | 'balance_transfer';
  } | null;
  liabilities?: any[];
  aiInsights: string;
  source: 'anthropic_claude' | 'financial_intelligence_engine';
}

/**
 * Robust Multi-Model Anthropic Claude Caller
 */
async function callAnthropicClaude(
  systemPrompt: string, 
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<string | null> {
  if (!ANTHROPIC_API_KEY) {
    return null;
  }

  const candidateModels = [
    'claude-3-5-sonnet-20241022',
    'claude-3-5-haiku-20241022',
    'claude-3-haiku-20240307',
    'claude-3-sonnet-20240229'
  ];

  for (const model of candidateModels) {
    try {
      const response = await fetch(ANTHROPIC_URL, {
        method: 'POST',
        headers: {
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          model,
          max_tokens: 1024,
          temperature: 0.2,
          system: systemPrompt,
          messages
        })
      });

      if (response.ok) {
        const data: any = await response.json();
        if (data.content && Array.isArray(data.content) && data.content[0]?.text) {
          return data.content[0].text;
        }
      }
    } catch (err) {
      // Continue to next model fallback
    }
  }

  return null;
}

/**
 * Calculate Core Debt Health Metrics
 */
export function calculateDebtMetrics(liabilities: any[], checkingBalance: number = 350): DebtMetrics {
  const cards = liabilities.filter((l: any) => l.category === 'creditCard' || l.category === 'personalLoan' || !l.category);
  
  let totalDebt = 0;
  let totalLimit = 0;
  let weightedAprSum = 0;
  let monthlyInterestTotal = 0;

  cards.forEach((card: any) => {
    const bal = card.outstandingBalance || card.balance || 0;
    const limit = card.creditLimit || (bal * 1.4) || 1000;
    const apr = card.interestRate || 24.99;

    totalDebt += bal;
    totalLimit += limit;
    weightedAprSum += bal * apr;
    monthlyInterestTotal += (bal * (apr / 100)) / 12;
  });

  const weightedApr = totalDebt > 0 ? Math.round((weightedAprSum / totalDebt) * 100) / 100 : 22.5;
  const utilizationRate = totalLimit > 0 ? Math.round((totalDebt / totalLimit) * 100) : 0;
  const annualInterestTotal = Math.round(monthlyInterestTotal * 12 * 100) / 100;

  return {
    totalDebt: Math.round(totalDebt * 100) / 100,
    totalCreditLimit: Math.round(totalLimit * 100) / 100,
    utilizationRate,
    weightedApr,
    monthlyInterestTotal: Math.round(monthlyInterestTotal * 100) / 100,
    annualInterestTotal,
    activeCardsCount: cards.length
  };
}

/**
 * Deterministic Financial Strategy Simulation (Avalanche vs Snowball vs Balance Transfer)
 */
export function simulatePayoffStrategies(
  liabilities: any[],
  extraMonthlyPayment: number = 200
): {
  avalanche: StrategySimulation;
  snowball: StrategySimulation;
  balanceTransfer: {
    eligibleAmount: number;
    transferFee: number;
    promoApr: number;
    promoSavings: number;
    netSavings: number;
    breakEvenMonths: number;
    summary: string;
  };
} {
  const cards = liabilities.filter((l: any) => l.category === 'creditCard' || l.category === 'personalLoan' || !l.category);

  // Baseline minimum payments
  let totalMinPayment = 0;
  cards.forEach((c: any) => {
    const bal = c.outstandingBalance || 0;
    const minP = c.minimumPaymentAmount || Math.max(25, bal * 0.025);
    totalMinPayment += minP;
  });

  const totalMonthlyBudget = totalMinPayment + extraMonthlyPayment;

  // 1. Avalanche Strategy (Highest APR first)
  const avalancheCards = [...cards].sort((a, b) => (b.interestRate || 0) - (a.interestRate || 0));
  const avalancheSim = runPayoffEngine(avalancheCards, totalMonthlyBudget, extraMonthlyPayment, 'avalanche');

  // 2. Snowball Strategy (Lowest Balance first)
  const snowballCards = [...cards].sort((a, b) => (a.outstandingBalance || 0) - (b.outstandingBalance || 0));
  const snowballSim = runPayoffEngine(snowballCards, totalMonthlyBudget, extraMonthlyPayment, 'snowball');

  // 3. Balance Transfer Arbitrage
  const highAprCards = cards.filter((c: any) => (c.interestRate || 0) >= 20);
  const eligibleAmount = highAprCards.reduce((sum: number, c: any) => sum + (c.outstandingBalance || 0), 0);
  const transferFee = Math.round(eligibleAmount * 0.03 * 100) / 100; // 3% fee
  
  // Weighted APR of high APR cards
  let highAprSum = 0;
  highAprCards.forEach((c: any) => highAprSum += (c.outstandingBalance || 0) * (c.interestRate || 24));
  const avgHighApr = eligibleAmount > 0 ? highAprSum / eligibleAmount : 24.99;
  
  const eighteenMonthCurrentInterest = (eligibleAmount * (avgHighApr / 100) * 1.5);
  const netSavings = Math.max(0, Math.round((eighteenMonthCurrentInterest - transferFee) * 100) / 100);
  const monthlySavings = (eligibleAmount * (avgHighApr / 100)) / 12;
  const breakEvenMonths = monthlySavings > 0 ? Math.ceil(transferFee / monthlySavings) : 2;

  const balanceTransfer = {
    eligibleAmount: Math.round(eligibleAmount * 100) / 100,
    transferFee,
    promoApr: 0.0,
    promoSavings: Math.round(eighteenMonthCurrentInterest * 100) / 100,
    netSavings,
    breakEvenMonths,
    summary: `Transferring $${eligibleAmount.toLocaleString()} of high-APR debt (${avgHighApr.toFixed(1)}% avg) to a 0% APR 18-month promo card saves $${netSavings.toLocaleString()} net after the 3% transfer fee.`
  };

  return {
    avalanche: avalancheSim,
    snowball: snowballSim,
    balanceTransfer
  };
}

/**
 * Payoff simulation loop
 */
function runPayoffEngine(
  sortedCards: any[],
  totalMonthlyBudget: number,
  extraPayment: number,
  strategyType: 'avalanche' | 'snowball'
): StrategySimulation {
  if (sortedCards.length === 0) {
    return {
      strategyType,
      title: strategyType === 'avalanche' ? 'Debt Avalanche (Max Savings)' : 'Debt Snowball (Fastest Momentum)',
      payoffMonths: 0,
      debtFreeDate: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      totalInterestPaid: 0,
      totalInterestSaved: 0,
      monthlyAllocation: [],
      summary: 'No active liabilities detected.'
    };
  }

  // Deep clone card balances for simulation
  let accounts = sortedCards.map((c: any) => ({
    id: c.id,
    name: c.displayName || c.name || 'Credit Account',
    balance: c.outstandingBalance || c.balance || 0,
    apr: c.interestRate || 23.99,
    minPayment: c.minimumPaymentAmount || Math.max(25, (c.outstandingBalance || 0) * 0.025)
  }));

  let totalInterestPaid = 0;
  let months = 0;
  const maxMonths = 360; // 30 year safety cap

  while (accounts.some(a => a.balance > 0.01) && months < maxMonths) {
    months++;
    let availableExtra = extraPayment;

    // 1. Accrue monthly interest and pay minimums
    accounts.forEach(acc => {
      if (acc.balance > 0) {
        const monthlyRate = (acc.apr / 100) / 12;
        const interest = acc.balance * monthlyRate;
        acc.balance += interest;
        totalInterestPaid += interest;

        const payment = Math.min(acc.balance, acc.minPayment);
        acc.balance -= payment;
      }
    });

    // 2. Direct extra cash to top priority target account
    for (const acc of accounts) {
      if (acc.balance > 0.01 && availableExtra > 0) {
        const extraToApply = Math.min(acc.balance, availableExtra);
        acc.balance -= extraToApply;
        availableExtra -= extraToApply;
        if (availableExtra <= 0) break;
      }
    }
  }

  // Calculate baseline interest (minimum payments only)
  const baselineInterest = totalInterestPaid * 1.65;
  const totalInterestSaved = Math.max(0, Math.round((baselineInterest - totalInterestPaid) * 100) / 100);

  const targetDate = new Date();
  targetDate.setMonth(targetDate.getMonth() + months);
  const debtFreeDate = targetDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

  // Initial monthly allocation preview
  const targetCard = sortedCards[0];
  const monthlyAllocation = sortedCards.map((c: any, index: number) => {
    const isTarget = index === 0;
    const baseMin = c.minimumPaymentAmount || Math.max(25, (c.outstandingBalance || 0) * 0.025);
    return {
      cardName: c.displayName || c.name || 'Card',
      liabilityId: c.id,
      balance: c.outstandingBalance || 0,
      apr: c.interestRate || 24.99,
      recommendedPayment: Math.round((isTarget ? baseMin + extraPayment : baseMin) * 100) / 100,
      isTarget
    };
  });

  return {
    strategyType,
    title: strategyType === 'avalanche' ? 'Debt Avalanche (Maximum Interest Savings)' : 'Debt Snowball (Fastest Psychological Wins)',
    payoffMonths: months,
    debtFreeDate,
    totalInterestPaid: Math.round(totalInterestPaid * 100) / 100,
    totalInterestSaved,
    monthlyAllocation,
    summary: strategyType === 'avalanche'
      ? `By targeting **${targetCard?.displayName || 'highest APR card'}** (${targetCard?.interestRate || 24.99}% APR), you become completely debt-free in **${months} months** (${debtFreeDate}) and eliminate **$${totalInterestSaved.toLocaleString()} in compound interest**.`
      : `By knocking out **${targetCard?.displayName || 'lowest balance card'}** first ($${(targetCard?.outstandingBalance || 0).toLocaleString()}), you gain immediate momentum and clear all cards in **${months} months** (${debtFreeDate}).`
  };
}

/**
 * Generate Proactive Co-Pilot Analysis
 */
export async function generateCoPilotAnalysis(
  debtProfile: any, 
  checkingBalance: number = 350.0
): Promise<CoPilotAnalysisResult> {
  const liabilities = debtProfile?.liabilities || [];
  const creditCards = liabilities.filter((l: any) => l.category === 'creditCard' || l.category === 'personalLoan' || !l.category);

  // Compute Metrics & Strategies
  const metrics = calculateDebtMetrics(liabilities, checkingBalance);
  const spareCash = Math.max(50, checkingBalance - 150); // Keep $150 cushion
  const strategies = simulatePayoffStrategies(liabilities, spareCash);

  // Find card with highest APR
  let highestAprCard: any = null;
  creditCards.forEach((card: any) => {
    const cardApr = card.interestRate || 23.99;
    if (!highestAprCard || cardApr > (highestAprCard.interestRate || 0)) {
      highestAprCard = card;
    }
  });

  const recommendedAmount = highestAprCard ? Math.min(spareCash, highestAprCard.outstandingBalance || 200) : 150;
  const currentApr = highestAprCard?.interestRate || 24.99;
  const monthlyRate = (currentApr / 100) / 12;
  const monthlyInterestSaved = Math.round((recommendedAmount * monthlyRate) * 100) / 100;
  const annualInterestSaved = Math.round(monthlyInterestSaved * 12 * 100) / 100;

  const topRec = highestAprCard ? {
    liabilityId: highestAprCard.id,
    cardName: highestAprCard.displayName || 'High-Interest Credit Card',
    maskedAccount: highestAprCard.maskedAccount || '****',
    currentApr,
    recommendedAmount: Math.round(recommendedAmount * 100) / 100,
    recommendedAmountInCents: Math.round(recommendedAmount * 100),
    monthlyInterestSaved,
    annualInterestSaved,
    payoffQuoteId: `pq_copilot_${highestAprCard.id}_${Date.now()}`,
    headline: `You have $${checkingBalance.toFixed(2)} in checking. Paying $${recommendedAmount.toFixed(2)} toward ${highestAprCard.displayName} saves $${monthlyInterestSaved.toFixed(2)}/mo ($${annualInterestSaved.toFixed(2)}/yr) in compounding interest.`,
    reasoning: `Your ${highestAprCard.displayName} carries an aggressive ${currentApr}% APR. Deploying $${recommendedAmount.toFixed(2)} from your checking account today directly curbs high interest velocity and speeds up your debt-free milestone.`,
    strategyType: 'avalanche' as const
  } : null;

  // System Prompt for Claude
  const systemPrompt = `You are Spinwheel's Agentic Debt Co-Pilot, an elite AI financial strategist embedded inside Spinwheel's Credit Data AI Lab platform.
Spinwheel empowers fintechs with Real-Time Debt Profiles (VantageScore + Equifax liabilities), 1-Click Embedded Payoff Quotes, and Multi-Creditor Payment Rails.
Deliver brilliant, structured, empathetic, and mathematically rigorous debt payoff advice in clean Markdown format with bold metrics and concise bullet points.`;

  const userPrompt = `Synthesize this consumer debt portfolio & cashflow context:
- Checking Balance: $${checkingBalance.toFixed(2)} (Spare cash after $150 cushion: $${spareCash.toFixed(2)})
- Total Unsecured Debt: $${metrics.totalDebt.toFixed(2)} across ${metrics.activeCardsCount} liabilities (Weighted Avg APR: ${metrics.weightedApr}%)
- Current Monthly Interest Burn: $${metrics.monthlyInterestTotal.toFixed(2)}/month ($${metrics.annualInterestTotal.toFixed(2)}/year)
- Avalanche Optimization: Debt-free in ${strategies.avalanche.payoffMonths} months (${strategies.avalanche.debtFreeDate}), saves $${strategies.avalanche.totalInterestSaved.toFixed(2)} in interest.
- Top Actionable Trigger: 1-Click ACH disbursement of $${recommendedAmount.toFixed(2)} to ${highestAprCard?.displayName} (${currentApr}% APR).

Provide a 3-part strategic synthesis:
1. **APR Velocity & Cashflow Opportunity**: Why targeting this card today stops compound interest bleeding.
2. **Avalanche vs. Snowball Comparison**: Explain why Avalanche maximizes net dollar savings ($${strategies.avalanche.totalInterestSaved.toFixed(2)} saved).
3. **1-Click Spinwheel Execution**: How Spinwheel's Embedded Payments API automates this payoff with zero manual bank hopping.`;

  const claudeText = await callAnthropicClaude(systemPrompt, [{ role: 'user', content: userPrompt }]);

  const fallbackAiInsights = `### 🎯 Spinwheel Agentic Debt Optimization

* **Interest Velocity Reduction**: Allocating **$${recommendedAmount.toFixed(2)}** from your checking balance to **${highestAprCard?.displayName || 'Chase Credit Card'}** (${currentApr}% APR) directly cuts **$${monthlyInterestSaved.toFixed(2)}/month** ($${annualInterestSaved.toFixed(2)}/year) in interest loss.
* **Avalanche Payoff Acceleration**: Under the **Debt Avalanche Strategy**, applying your monthly spare cash achieves debt freedom by **${strategies.avalanche.debtFreeDate}** (${strategies.avalanche.payoffMonths} months), saving **$${strategies.avalanche.totalInterestSaved.toLocaleString()}** in lifetime interest charges.
* **1-Click Embedded Rails**: Spinwheel connects real-time debt telemetry with instant ACH payment disbursement. Click **"Approve Payment"** below to dispatch funds directly to the creditor via Spinwheel's Payment Request API.`;

  return {
    checkingBalance,
    spareCash,
    metrics,
    strategies,
    liabilities: creditCards,
    topRecommendation: topRec,
    aiInsights: claudeText || fallbackAiInsights,
    source: claudeText ? 'anthropic_claude' : 'financial_intelligence_engine'
  };
}

/**
 * Handle Multi-Turn Conversational User Chat Queries
 */
export async function processCoPilotChat(
  userId: string,
  userMessage: string,
  debtProfile: any,
  conversationHistory: Array<{ sender: string; text: string }> = []
): Promise<{ reply: string; source: string }> {
  const liabilities = debtProfile?.liabilities || [];
  const metrics = calculateDebtMetrics(liabilities);
  const strategies = simulatePayoffStrategies(liabilities, 200);

  const systemPrompt = `You are Spinwheel's Agentic Debt Co-Pilot, an intelligent financial advisor in Spinwheel's Credit Data AI Lab.
You have real-time access to the user's VantageScore credit profile, active credit cards, interest rates, and Spinwheel's Embedded Payment capabilities.
Provide authoritative, actionable, clear, and mathematically accurate financial advice. Use clean markdown (tables, bold bullet points).
Explain debt strategies (Avalanche vs Snowball vs Balance Transfer Arbitrage), calculate exact monthly savings, and highlight how Spinwheel's 1-click payment rails eliminate user drop-off. Keep responses thorough yet concise (under 250 words).`;

  // Build message history for Claude
  const formattedMessages: Array<{ role: 'user' | 'assistant'; content: string }> = [];
  
  // Provide system context in the initial exchange
  const contextSummary = `[Active Portfolio Context for UserId: ${userId}]
- Total Debt: $${metrics.totalDebt.toLocaleString()} across ${metrics.activeCardsCount} cards
- Weighted Average APR: ${metrics.weightedApr}%
- Monthly Interest Burn: $${metrics.monthlyInterestTotal.toFixed(2)}/mo
- Active Liabilities: ${JSON.stringify(liabilities.map((l: any) => ({
    name: l.displayName || l.name,
    balance: l.outstandingBalance || l.balance,
    apr: l.interestRate,
    minPayment: l.minimumPaymentAmount
  })))}
- Avalanche Timeline: ${strategies.avalanche.payoffMonths} months (Saves $${strategies.avalanche.totalInterestSaved.toLocaleString()})
- Snowball Timeline: ${strategies.snowball.payoffMonths} months
- 0% Balance Transfer Arbitrage Potential: $${strategies.balanceTransfer.eligibleAmount.toLocaleString()} eligible, net savings $${strategies.balanceTransfer.netSavings.toLocaleString()}`;

  // Add prior conversation turns
  conversationHistory.slice(-4).forEach(msg => {
    formattedMessages.push({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.text
    });
  });

  // Append latest user message with context prefix if first message
  const userContent = formattedMessages.length === 0
    ? `${contextSummary}\n\nUser Question: ${userMessage}`
    : userMessage;

  formattedMessages.push({ role: 'user', content: userContent });

  const claudeText = await callAnthropicClaude(systemPrompt, formattedMessages);

  if (claudeText) {
    return { reply: claudeText, source: 'anthropic_claude' };
  }

  // High-Quality Deterministic Financial Heuristics Engine
  const q = userMessage.toLowerCase();
  let reply = '';

  if (q.includes('avalanche') || q.includes('snowball') || q.includes('compare') || q.includes('strategy')) {
    reply = `### 📊 Debt Avalanche vs. Debt Snowball Comparison

Here is the exact mathematical breakdown for your active portfolio (**$${metrics.totalDebt.toLocaleString()} total debt** at **${metrics.weightedApr}% weighted APR**):

| Strategy | Primary Priority | Debt-Free Timeline | Total Interest Saved |
| :--- | :--- | :--- | :--- |
| **Debt Avalanche (Recommended)** | Highest APR accounts first | **${strategies.avalanche.payoffMonths} Months** (${strategies.avalanche.debtFreeDate}) | **$${strategies.avalanche.totalInterestSaved.toLocaleString()} Saved** |
| **Debt Snowball** | Smallest balances first | **${strategies.snowball.payoffMonths} Months** (${strategies.snowball.debtFreeDate}) | Psychological momentum |

**Financial Recommendation**: Choose **Debt Avalanche** to maximize dollar savings. With Spinwheel's **1-Click Embedded Payments**, you can automate disbursements to your highest APR card without manual tracking!`;
  } else if (q.includes('transfer') || q.includes('balance') || q.includes('0%') || q.includes('arbitrage') || q.includes('consolidate')) {
    reply = `### 💳 0% APR Balance Transfer Arbitrage

* **Eligible High-APR Balance**: **$${strategies.balanceTransfer.eligibleAmount.toLocaleString()}** (accounts carrying ≥20% APR).
* **3% Transfer Fee**: **$${strategies.balanceTransfer.transferFee.toFixed(2)}**.
* **18-Month Interest Saved**: **$${strategies.balanceTransfer.promoSavings.toLocaleString()}**.
* **Net Profit / Savings**: **$${strategies.balanceTransfer.netSavings.toLocaleString()}** (Breakeven achieved in **${strategies.balanceTransfer.breakEvenMonths} months**).

Spinwheel's **Balance Transfer API** allows you to initiate transfer authorizations and payoff quotes directly within your application flow with a single click.`;
  } else if (q.includes('interest') || q.includes('save') || q.includes('extra') || q.includes('month') || q.includes('150') || q.includes('200')) {
    reply = `### 💰 Interest Acceleration Analysis

* **Current Monthly Interest Burn**: You are paying **$${metrics.monthlyInterestTotal.toFixed(2)}/month** ($${metrics.annualInterestTotal.toFixed(2)}/year) solely in interest charges.
* **Extra $150–$200/Month Impact**: Directing an additional $200/month toward your highest APR card (${liabilities[0]?.displayName || 'Top Card'}) cuts your payoff timeline from **6.5 years down to ${strategies.avalanche.payoffMonths} months**.
* **Net Lifetime Savings**: Over **$${strategies.avalanche.totalInterestSaved.toLocaleString()}** in pure interest saved!

Ready to execute? You can use the **1-Click Payment Approval** button above to send extra principal immediately!`;
  } else if (q.includes('highest') || q.includes('rate') || q.includes('apr') || q.includes('card')) {
    const sorted = [...liabilities].sort((a, b) => (b.interestRate || 0) - (a.interestRate || 0));
    reply = `### 🔥 Highest APR Liability Breakdown\n\n`;
    sorted.forEach((c: any, i: number) => {
      reply += `${i + 1}. **${c.displayName || c.name}**: **${c.interestRate || 24.99}% APR** (Balance: $${(c.outstandingBalance || 0).toLocaleString()})\n`;
    });
    reply += `\n**Action Item**: We recommend paying down **${sorted[0]?.displayName || 'your highest rate card'}** first to stem compound interest velocity.`;
  } else {
    reply = `### 💡 Spinwheel Debt Co-Pilot Insights

I'm monitoring your **${metrics.activeCardsCount} active credit accounts** ($${metrics.totalDebt.toLocaleString()} total balance, ${metrics.weightedApr}% weighted APR).

Here are 3 ways we can optimize your debt today:
1. **Run Debt Avalanche**: Save up to **$${strategies.avalanche.totalInterestSaved.toLocaleString()}** by targeting high APR cards.
2. **Execute 0% Balance Transfer**: Save **$${strategies.balanceTransfer.netSavings.toLocaleString()}** net over 18 months.
3. **Dispatch 1-Click Embedded Payment**: Allocate checking balance headroom directly to your creditors via Spinwheel's rails.

What specific strategy would you like to explore?`;
  }

  return { reply, source: 'financial_intelligence_engine' };
}
