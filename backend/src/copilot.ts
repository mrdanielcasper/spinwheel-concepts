import path from 'path';
import dotenv from 'dotenv';

dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';
const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';

export interface CoPilotAnalysisResult {
  checkingBalance: number;
  spareCash: number;
  topRecommendation: {
    liabilityId: string;
    cardName: string;
    maskedAccount: string;
    currentApr: number;
    recommendedAmount: number;
    recommendedAmountInCents: number;
    monthlyInterestSaved: number;
    payoffQuoteId: string;
    headline: string;
    reasoning: string;
  } | null;
  aiInsights: string;
  source: 'anthropic_claude' | 'fallback_engine';
}

/**
 * Call Anthropic Messages API
 */
async function callAnthropicClaude(systemPrompt: string, userPrompt: string): Promise<string | null> {
  if (!ANTHROPIC_API_KEY) {
    console.log('No ANTHROPIC_API_KEY found in environment. Using fallback co-pilot engine.');
    return null;
  }

  try {
    const response = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        temperature: 0.2,
        system: systemPrompt,
        messages: [
          { role: 'user', content: userPrompt }
        ]
      })
    });

    if (!response.ok) {
      console.warn(`Anthropic API returned non-2xx status: ${response.status}`);
      return null;
    }

    const data: any = await response.json();
    if (data.content && Array.isArray(data.content) && data.content[0]?.text) {
      return data.content[0].text;
    }
    return null;
  } catch (err: any) {
    console.error('Error calling Anthropic API:', err.message || err);
    return null;
  }
}

/**
 * Generate proactive debt analysis and 1-click payment recommendation
 */
export async function generateCoPilotAnalysis(debtProfile: any, checkingBalance: number = 350.0): Promise<CoPilotAnalysisResult> {
  const liabilities = debtProfile?.liabilities || [];
  const creditCards = liabilities.filter((l: any) => l.category === 'creditCard' || l.category === 'personalLoan');

  // Find card with highest APR
  let highestAprCard: any = null;
  creditCards.forEach((card: any) => {
    const cardApr = card.interestRate || 23.99;
    if (!highestAprCard || cardApr > (highestAprCard.interestRate || 0)) {
      highestAprCard = card;
    }
  });

  const spareCash = Math.max(50, checkingBalance - 150); // Keep $150 cushion
  const recommendedAmount = highestAprCard ? Math.min(spareCash, highestAprCard.outstandingBalance || 200) : 150;
  const currentApr = highestAprCard?.interestRate || 24.99;
  const monthlyRate = (currentApr / 100) / 12;
  const monthlyInterestSaved = Math.round((recommendedAmount * monthlyRate) * 100) / 100;

  const topRec = highestAprCard ? {
    liabilityId: highestAprCard.id,
    cardName: highestAprCard.displayName || 'High-Interest Credit Card',
    maskedAccount: highestAprCard.maskedAccount || '****',
    currentApr,
    recommendedAmount: Math.round(recommendedAmount * 100) / 100,
    recommendedAmountInCents: Math.round(recommendedAmount * 100),
    monthlyInterestSaved,
    payoffQuoteId: `pq_copilot_${highestAprCard.id}_${Date.now()}`,
    headline: `You have $${checkingBalance.toFixed(2)} spare cash this week. Paying $${recommendedAmount.toFixed(2)} to ${highestAprCard.displayName} now saves $${monthlyInterestSaved.toFixed(2)} in interest this month.`,
    reasoning: `Your ${highestAprCard.displayName} card carries a high interest rate of ${currentApr}%. Allocating $${recommendedAmount.toFixed(2)} from your checking account today reduces your principal balance and immediately avoids $${monthlyInterestSaved.toFixed(2)} in interest charges.`
  } : null;

  // Prompt Anthropic Claude for AI financial synthesis
  const systemPrompt = `You are Spinwheel's Agentic Debt Co-Pilot, an AI financial advisor integrated into Spinwheel's Credit Data AI Lab platform.
Provide concise, highly actionable, encouraging, and precise financial guidance. Output clear markdown with bullet points.`;

  const userPrompt = `Analyze this consumer credit profile and checking balance:
- Checking Account Spare Cash: $${checkingBalance.toFixed(2)}
- Active Credit Card Liabilities: ${JSON.stringify(creditCards.map((c: any) => ({ name: c.displayName, balance: c.outstandingBalance, apr: c.interestRate })))}

Target Recommendation: Pay $${recommendedAmount.toFixed(2)} to ${highestAprCard?.displayName || 'highest interest card'}.
Summarize in 3 bullet points:
1. Why this card was selected based on interest rate velocity.
2. Direct monthly & annual interest savings.
3. How Spinwheel's Embedded Payment API enables 1-click execution.`;

  const claudeText = await callAnthropicClaude(systemPrompt, userPrompt);

  return {
    checkingBalance,
    spareCash,
    topRecommendation: topRec,
    aiInsights: claudeText || `### Agentic Co-Pilot Analysis\n\n* **Interest Velocity Optimization**: Target **${highestAprCard?.displayName || 'Chase Credit Card'}** (${currentApr}% APR) to minimize high compound interest accrual.\n* **Immediate Savings**: Paying **$${recommendedAmount.toFixed(2)}** today directly saves **$${monthlyInterestSaved.toFixed(2)}/month** ($${(monthlyInterestSaved * 12).toFixed(2)}/year) in net interest charges.\n* **1-Click Embedded Execution**: Click **"Approve Payment"** below to dispatch an instant ACH payment via Spinwheel's Payment Request API.`,
    source: claudeText ? 'anthropic_claude' : 'fallback_engine'
  };
}

/**
 * Handle conversational user chat queries with Claude API
 */
export async function processCoPilotChat(userId: string, userMessage: string, debtProfile: any): Promise<{ reply: string; source: string }> {
  const liabilities = debtProfile?.liabilities || [];
  
  const systemPrompt = `You are Spinwheel's Agentic Debt Co-Pilot. You assist users with debt payoff strategies (Debt Avalanche vs Debt Snowball), interest savings calculations, and embedded payment options using Spinwheel's APIs.
Keep answers concise (under 200 words), direct, and formatted in clean markdown.`;

  const contextPrompt = `User Credit Context (UserId: ${userId}):
Liabilities: ${JSON.stringify(liabilities.map((l: any) => ({ name: l.displayName, balance: l.outstandingBalance, apr: l.interestRate, minPayment: l.minimumPaymentAmount })))}

User Question: ${userMessage}`;

  const claudeText = await callAnthropicClaude(systemPrompt, contextPrompt);

  if (claudeText) {
    return { reply: claudeText, source: 'anthropic_claude' };
  }

  // Smart fallback response generator
  let fallbackReply = `I analyzed your active Spinwheel debt profile. You currently have **${liabilities.length} active liabilities**.\n\n`;
  if (userMessage.toLowerCase().includes('avalanche') || userMessage.toLowerCase().includes('snowball') || userMessage.toLowerCase().includes('strategy')) {
    fallbackReply += `* **Debt Avalanche (Recommended)**: Pay off highest APR accounts first to minimize total interest paid.\n* **Debt Snowball**: Pay off smallest balances first for psychological momentum.\n\nWith Spinwheel's **Embedded Payments API**, you can automate multi-creditor disbursements for either strategy with 1 click!`;
  } else if (userMessage.toLowerCase().includes('interest') || userMessage.toLowerCase().includes('save')) {
    fallbackReply += `By allocating extra cash toward high-interest cards (>20% APR), you can save hundreds of dollars in interest over 12 months. Try our **1-Click Recommended Payment** alert!`;
  } else {
    fallbackReply += `I can help you analyze your credit cards, calculate interest savings, or execute 1-click payments to your creditors. What specific strategy would you like to explore?`;
  }

  return { reply: fallbackReply, source: 'fallback_engine' };
}
