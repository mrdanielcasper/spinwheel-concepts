import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { validateConnectUser, validateVerifyUser, validateDebtProfileParams, validateBalanceTransferSubmit } from './validation';
import { normalizeError } from './parser';
import { connectUserSms, verifyUserSms, fetchDebtProfile, connectPreVerifiedUser, createLiabilityPayment } from './client';
import { normalizeDebtProfile, normalizeBalanceTransferLiabilities } from './mapper';
import { generateCoPilotAnalysis, processCoPilotChat, simulatePayoffStrategies, calculateDebtMetrics } from './copilot';
import { orchestrateIdentityWaterfall, getWaterfallKpis, getRiskOSEvaluation } from './socure';
import { evaluateQslpCompliance, dispatchQslpRecordkeeperMatch, getQslpKpis, generateQslpAuditCertificate } from './qslp';
import { openApiSpec } from './openapi';



dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const app = express();
const PORT = process.env.PORT || 3001;

// Setup basic in-memory rate limiting map for best-effort abuse protection
interface RateLimitData {
  count: number;
  resetTime: number;
}
const ipRateLimits = new Map<string, RateLimitData>();
const phoneRateLimits = new Map<string, RateLimitData>();

const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute window
const MAX_REQUESTS_PER_WINDOW = 120;    // Max 120 requests per minute for smooth interactive demoing

/**
 * Basic in-memory rate limiter middleware.
 */
function rateLimiter(req: Request, res: Response, next: NextFunction) {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();

  let limitData = ipRateLimits.get(ip);

  if (!limitData || now > limitData.resetTime) {
    limitData = { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS };
    ipRateLimits.set(ip, limitData);
  } else {
    limitData.count++;
  }

  if (limitData.count > MAX_REQUESTS_PER_WINDOW) {
    return res.status(429).json({
      success: false,
      error: {
        code: 'TOO_MANY_REQUESTS',
        message: 'Too many requests from this IP. Please wait a minute and try again.',
        details: [{ desc: 'Rate limit exceeded' }],
        httpStatus: 429,
        source: 'backend'
      }
    });
  }

  next();
}

// 1. JSON Request Size Limit
app.use(express.json({ limit: '10kb' })); // strictly limit request body size to 10kb

// 2. Strict CORS Configuration (no wildcard CORS on sensitive routes)
const allowedOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000'];
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl) or matching allowed origins
      if (!origin || allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS policy'));
      }
    },
    credentials: true
  })
);

// 3. Security Headers
app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Content-Security-Policy', "default-src 'self'");
  next();
});

// Helper: Set cache-control headers on sensitive payloads
function setNoCacheHeaders(res: Response) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
}

// Helper: Redact sensitive information for console logging
function redactSensitiveData(data: any): any {
  if (!data || typeof data !== 'object') return data;
  const redacted = { ...data };
  if (redacted.phoneNumber) redacted.phoneNumber = '[REDACTED_PHONE]';
  if (redacted.dateOfBirth) redacted.dateOfBirth = '[REDACTED_DOB]';
  if (redacted.code) redacted.code = '[REDACTED_CODE]';
  if (redacted.userId) redacted.userId = '[REDACTED_USER_ID]';
  if (redacted.extUserId) redacted.extUserId = '[REDACTED_EXT_USER_ID]';
  if (redacted.connectionId) redacted.connectionId = '[REDACTED_CONN_ID]';
  return redacted;
}

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// POST /api/connect-user
app.post('/api/connect-user', rateLimiter, async (req: Request, res: Response) => {
  setNoCacheHeaders(res);

  // Validate request schema
  const validationResult = validateConnectUser(req.body);
  if (!validationResult.valid || !validationResult.data) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: validationResult.error || 'Invalid request body',
        details: [{ desc: validationResult.error || 'Invalid request body' }],
        httpStatus: 400,
        source: 'backend'
      }
    });
  }

  const { phoneNumber, dateOfBirth } = validationResult.data;

  // Phone number abuse protection throttle
  const now = Date.now();
  let phoneLimit = phoneRateLimits.get(phoneNumber);
  if (!phoneLimit || now > phoneLimit.resetTime) {
    phoneLimit = { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS };
    phoneRateLimits.set(phoneNumber, phoneLimit);
  } else {
    phoneLimit.count++;
  }

  if (phoneLimit.count > 5) {
    return res.status(429).json({
      success: false,
      error: {
        code: 'TOO_MANY_VERIFICATIONS',
        message: 'Too many verification attempts - this phone number is temporarily disabled.',
        details: [{ desc: 'Verification request limit reached for this number' }],
        httpStatus: 429,
        source: 'backend'
      }
    });
  }

  // Generate random UUID for external user ID
  const extUserId = crypto.randomUUID();

  console.log(`Connecting user: extUserId=${extUserId}, phoneNumber=${redactSensitiveData({ phoneNumber }).phoneNumber}`);

  try {
    const apiResponse = await connectUserSms({
      phoneNumber,
      dateOfBirth,
      extUserId
    });

    const responseData = apiResponse.data || {};
    const successData = {
      userId: responseData.userId,
      extUserId: responseData.extUserId || extUserId,
      connectionId: responseData.connectionId,
      connectionStatus: responseData.connectionStatus,
      sms: {
        codeExpiresAt: responseData.sms?.codeExpiresAt || responseData.codeExpiresAt,
        codeTimeoutSeconds: responseData.sms?.codeTimeoutSeconds || responseData.codeTimeoutSeconds || 300
      }
    };

    return res.status(200).json({
      success: true,
      data: successData
    });
  } catch (error: any) {
    const normalized = normalizeError(error, 400, 'spinwheel');
    console.error('Connect User Error:', redactSensitiveData(normalized));
    return res.status(normalized.httpStatus).json({
      success: false,
      error: normalized
    });
  }
});

// POST /api/verify-user
app.post('/api/verify-user', rateLimiter, async (req: Request, res: Response) => {
  setNoCacheHeaders(res);

  // Validate request schema
  const validationResult = validateVerifyUser(req.body);
  if (!validationResult.valid || !validationResult.data) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: validationResult.error || 'Invalid request body',
        details: [{ desc: validationResult.error || 'Invalid request body' }],
        httpStatus: 400,
        source: 'backend'
      }
    });
  }

  const { userId, code } = validationResult.data;

  console.log(`Verifying user: userId=${redactSensitiveData({ userId }).userId}`);

  try {
    const apiResponse = await verifyUserSms(userId, code);
    const responseData = apiResponse.data || {};

    const successData = {
      userId: responseData.userId,
      extUserId: responseData.extUserId,
      connectionId: responseData.connectionId,
      connectionStatus: responseData.connectionStatus,
      profile: {
        firstName: responseData.profile?.firstName,
        lastName: responseData.profile?.lastName,
        ssnLastFourDigits: responseData.profile?.ssnLastFourDigits || responseData.profile?.ssn,
        phoneNumber: responseData.profile?.phoneNumber,
        dateOfBirth: responseData.profile?.dateOfBirth,
        addresses: responseData.profile?.addresses || []
      }
    };

    return res.status(200).json({
      success: true,
      data: successData
    });
  } catch (error: any) {
    const normalized = normalizeError(error, 400, 'spinwheel');
    console.error('Verify User Error:', redactSensitiveData(normalized));
    return res.status(normalized.httpStatus).json({
      success: false,
      error: normalized
    });
  }
});

// POST /api/users/:userId/debt-profile
app.post('/api/users/:userId/debt-profile', rateLimiter, async (req: Request, res: Response) => {
  setNoCacheHeaders(res);

  const userId = req.params.userId;
  const liabilityType = req.body?.liabilityType || req.query?.liabilityType;

  // Validate parameters
  const validationResult = validateDebtProfileParams(userId, liabilityType);
  if (!validationResult.valid) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: validationResult.error || 'Invalid parameters',
        details: [{ desc: validationResult.error || 'Invalid parameters' }],
        httpStatus: 400,
        source: 'backend'
      }
    });
  }

  console.log(`Fetching debt profile: userId=${redactSensitiveData({ userId }).userId}, liabilityType=${liabilityType || 'ALL'}`);

  try {
    const apiResponse = await fetchDebtProfile(userId, liabilityType);
    const normalizedData = normalizeDebtProfile(apiResponse);

    return res.status(200).json({
      success: true,
      data: normalizedData
    });
  } catch (error: any) {
    const normalized = normalizeError(error, 400, 'spinwheel');
    console.error('Debt Profile Error:', redactSensitiveData(normalized));
    return res.status(normalized.httpStatus).json({
      success: false,
      error: normalized
    });
  }
});

// POST /api/balance-transfer/connect-preverified
app.post('/api/balance-transfer/connect-preverified', rateLimiter, async (req: Request, res: Response) => {
  setNoCacheHeaders(res);
  const validationResult = validateConnectUser(req.body);
  if (!validationResult.valid || !validationResult.data) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: validationResult.error || 'Invalid pre-verified request body',
        details: [{ desc: validationResult.error || 'Invalid pre-verified request body' }],
        httpStatus: 400,
        source: 'backend'
      }
    });
  }

  const { phoneNumber, dateOfBirth } = validationResult.data;
  const extUserId = crypto.randomUUID();

  try {
    const apiResponse = await connectPreVerifiedUser({ phoneNumber, dateOfBirth, extUserId });
    const responseData = apiResponse.data || {};
    return res.status(200).json({
      success: true,
      data: {
        userId: responseData.userId || 'c3cf91d9-21c8-413c-82bf-286d6e05593e',
        extUserId: responseData.extUserId || extUserId,
        connectionId: responseData.connectionId || `conn_${Date.now()}`,
        networkToken: `nt_${Date.now()}_bt_verified`,
        connectionStatus: 'VERIFIED'
      }
    });
  } catch (error: any) {
    const normalized = normalizeError(error, 400, 'spinwheel');
    return res.status(normalized.httpStatus).json({ success: false, error: normalized });
  }
});

// POST /api/balance-transfer/liabilities
app.post('/api/balance-transfer/liabilities', rateLimiter, async (req: Request, res: Response) => {
  setNoCacheHeaders(res);
  const { userId } = req.body || {};

  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'userId is required',
        details: [{ desc: 'userId must be provided' }],
        httpStatus: 400,
        source: 'backend'
      }
    });
  }

  try {
    const apiResponse = await fetchDebtProfile(userId, 'CREDIT_CARD');
    const normalizedProfile = normalizeDebtProfile(apiResponse);
    const btData = normalizeBalanceTransferLiabilities(normalizedProfile);

    return res.status(200).json({
      success: true,
      data: btData
    });
  } catch (error: any) {
    const normalized = normalizeError(error, 400, 'spinwheel');
    return res.status(normalized.httpStatus).json({ success: false, error: normalized });
  }
});

// POST /api/balance-transfer/submit
app.post('/api/balance-transfer/submit', rateLimiter, async (req: Request, res: Response) => {
  setNoCacheHeaders(res);
  const validationResult = validateBalanceTransferSubmit(req.body);
  if (!validationResult.valid || !validationResult.data) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: validationResult.error || 'Invalid balance transfer request',
        details: [{ desc: validationResult.error || 'Invalid balance transfer request' }],
        httpStatus: 400,
        source: 'backend'
      }
    });
  }

  try {
    const apiResponse = await createLiabilityPayment(validationResult.data);
    return res.status(200).json({
      success: true,
      data: apiResponse.data
    });
  } catch (error: any) {
    const normalized = normalizeError(error, 400, 'spinwheel');
    return res.status(normalized.httpStatus).json({ success: false, error: normalized });
  }
});

// POST /api/copilot/analyze
app.post('/api/copilot/analyze', rateLimiter, async (req: Request, res: Response) => {
  setNoCacheHeaders(res);
  const { userId, checkingBalance, cachedProfile } = req.body || {};
  const targetUserId = userId || 'c3cf91d9-21c8-413c-82bf-286d6e05593e';

  try {
    let normalizedProfile = cachedProfile;
    if (!normalizedProfile || !Array.isArray(normalizedProfile.liabilities)) {
      const apiResponse = await fetchDebtProfile(targetUserId);
      normalizedProfile = normalizeDebtProfile(apiResponse);
    }

    const analysis = await generateCoPilotAnalysis(normalizedProfile, checkingBalance || 350.0);

    return res.status(200).json({
      success: true,
      data: analysis
    });
  } catch (error: any) {
    const normalized = normalizeError(error, 400, 'spinwheel');
    return res.status(normalized.httpStatus).json({ success: false, error: normalized });
  }
});

// POST /api/copilot/chat
app.post('/api/copilot/chat', rateLimiter, async (req: Request, res: Response) => {
  setNoCacheHeaders(res);
  const { userId, message, conversationHistory, cachedProfile } = req.body || {};
  const targetUserId = userId || 'c3cf91d9-21c8-413c-82bf-286d6e05593e';

  if (!message || typeof message !== 'string') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'message string is required',
        details: [{ desc: 'message must be provided' }],
        httpStatus: 400,
        source: 'backend'
      }
    });
  }

  try {
    let normalizedProfile = cachedProfile;
    if (!normalizedProfile || !Array.isArray(normalizedProfile.liabilities)) {
      const apiResponse = await fetchDebtProfile(targetUserId);
      normalizedProfile = normalizeDebtProfile(apiResponse);
    }

    const chatResult = await processCoPilotChat(
      targetUserId, 
      message, 
      normalizedProfile, 
      Array.isArray(conversationHistory) ? conversationHistory : []
    );

    return res.status(200).json({
      success: true,
      data: chatResult
    });
  } catch (error: any) {
    const normalized = normalizeError(error, 400, 'spinwheel');
    return res.status(normalized.httpStatus).json({ success: false, error: normalized });
  }
});

// POST /api/copilot/simulate
app.post('/api/copilot/simulate', rateLimiter, async (req: Request, res: Response) => {
  setNoCacheHeaders(res);
  const { userId, extraMonthlyAmount, checkingBalance, cachedProfile } = req.body || {};
  const targetUserId = userId || 'c3cf91d9-21c8-413c-82bf-286d6e05593e';

  try {
    let normalizedProfile = cachedProfile;
    if (!normalizedProfile || !Array.isArray(normalizedProfile.liabilities)) {
      const apiResponse = await fetchDebtProfile(targetUserId);
      normalizedProfile = normalizeDebtProfile(apiResponse);
    }

    const liabilities = normalizedProfile.liabilities || [];
    const extra = typeof extraMonthlyAmount === 'number' ? extraMonthlyAmount : 200;
    const balance = typeof checkingBalance === 'number' ? checkingBalance : 350;

    const metrics = calculateDebtMetrics(liabilities, balance);
    const strategies = simulatePayoffStrategies(liabilities, extra);

    return res.status(200).json({
      success: true,
      data: {
        metrics,
        strategies,
        extraMonthlyAmount: extra
      }
    });
  } catch (error: any) {
    const normalized = normalizeError(error, 400, 'spinwheel');
    return res.status(normalized.httpStatus).json({ success: false, error: normalized });
  }
});

// POST /api/identity/waterfall/verify
app.post('/api/identity/waterfall/verify', rateLimiter, async (req: Request, res: Response) => {
  setNoCacheHeaders(res);
  const { userData, scenarioOverride } = req.body || {};

  try {
    const result = await orchestrateIdentityWaterfall(
      userData || {}, 
      scenarioOverride || 'SOCURE_RESCUE'
    );

    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error: any) {
    const normalized = normalizeError(error, 500, 'backend');
    return res.status(normalized.httpStatus).json({ success: false, error: normalized });
  }
});

// GET /api/identity/waterfall/kpis
app.get('/api/identity/waterfall/kpis', (req: Request, res: Response) => {
  setNoCacheHeaders(res);
  return res.status(200).json({
    success: true,
    data: getWaterfallKpis()
  });
});

// GET /api/identity/waterfall/evaluation/:evalId
app.get('/api/identity/waterfall/evaluation/:evalId', async (req: Request, res: Response) => {
  setNoCacheHeaders(res);
  const { evalId } = req.params;

  try {
    const data = await getRiskOSEvaluation(evalId);
    return res.status(200).json({
      success: true,
      data: data || { eval_id: evalId, eval_status: 'evaluation_paused', decision: 'REVIEW' }
    });
  } catch (error: any) {
    const normalized = normalizeError(error, 500, 'backend');
    return res.status(normalized.httpStatus).json({ success: false, error: normalized });
  }
});

// POST /api/identity/waterfall/docv-complete (Simulate or finalize DocV completion)
app.post('/api/identity/waterfall/docv-complete', rateLimiter, async (req: Request, res: Response) => {
  setNoCacheHeaders(res);
  const { evalId, passed } = req.body || {};

  return res.status(200).json({
    success: true,
    data: {
      evalId: evalId || `eval_docv_${Date.now()}`,
      evalStatus: 'evaluation_completed',
      decision: passed !== false ? 'ACCEPT' : 'REJECT',
      docVCompleted: true,
      documentType: 'DRIVERS_LICENSE',
      biometricMatchScore: 0.96,
      tamperDetected: false,
      spinwheelProfileProceed: passed !== false,
      summary: passed !== false 
        ? 'DocV government ID scan & selfie biometric match passed with 96% confidence! User identity verified and unlocked for Debt Profile.' 
        : 'DocV document verification failed (Tamper detected or invalid ID).'
    }
  });
});

// POST /api/identity/waterfall/webhook
app.post('/api/identity/waterfall/webhook', (req: Request, res: Response) => {
  console.log('[Socure RiskOS Webhook Event Received]:', JSON.stringify(req.body));
  return res.status(200).json({ received: true });
});

// ==========================================
// SECURE 2.0 SECTION 110 QSLP ENGINE ROUTES
// ==========================================

// POST /api/qslp/evaluate
app.post('/api/qslp/evaluate', rateLimiter, (req: Request, res: Response) => {
  setNoCacheHeaders(res);
  const body = req.body || {};
  const scenario = body.scenario || 'COMPLIANT_MATCH';
  const customOverrides = {
    ...body.customOverrides,
    ...body.planMatchRules,
    ...(body.paymentDetails ? {
      paymentAmount: body.paymentDetails.paymentAmount,
      servicerName: body.paymentDetails.servicerName,
      payorAccountOwner: body.paymentDetails.payorAccountOwner,
      paymentDate: body.paymentDetails.paymentDate
    } : {}),
    ...(body.employeeId ? { employeeId: body.employeeId } : {}),
    ...(body.annualSalary ? { annualSalary: body.annualSalary } : {}),
    ...(body.matchPercentage ? { matchPercent: body.matchPercentage } : {}),
    ...(body.maxSalaryPercentage ? { maxSalaryPercent: body.maxSalaryPercentage } : {}),
    ...(body.paymentAmount ? { paymentAmount: body.paymentAmount } : {})
  };

  try {
    const result = evaluateQslpCompliance(scenario, customOverrides);
    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error: any) {
    const normalized = normalizeError(error, 500, 'backend');
    return res.status(normalized.httpStatus).json({ success: false, error: normalized });
  }
});

// POST /api/qslp/dispatch-match
app.post('/api/qslp/dispatch-match', rateLimiter, (req: Request, res: Response) => {
  setNoCacheHeaders(res);
  const { eventId, recordkeeper } = req.body || {};

  try {
    const result = dispatchQslpRecordkeeperMatch(
      eventId || `qslp_evt_${Date.now()}`,
      recordkeeper || 'Fidelity Investments'
    );
    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error: any) {
    const normalized = normalizeError(error, 500, 'backend');
    return res.status(normalized.httpStatus).json({ success: false, error: normalized });
  }
});

// GET /api/qslp/kpis
app.get('/api/qslp/kpis', (req: Request, res: Response) => {
  setNoCacheHeaders(res);
  return res.status(200).json({
    success: true,
    data: getQslpKpis()
  });
});

// GET /api/qslp/certificate/:eventId
app.get('/api/qslp/certificate/:eventId', (req: Request, res: Response) => {
  setNoCacheHeaders(res);
  const { eventId } = req.params;
  return res.status(200).json({
    success: true,
    data: generateQslpAuditCertificate(eventId || 'qslp_evt_89230114')
  });
});

// ==========================================
// OPENAPI 3.0 & SWAGGER UI DOCUMENTATION
// ==========================================

// GET /api/docs/openapi.json
app.get('/api/docs/openapi.json', (req: Request, res: Response) => {
  setNoCacheHeaders(res);
  res.setHeader('Content-Type', 'application/json');
  return res.status(200).json(openApiSpec);
});

// GET /api/docs (Interactive Swagger UI)
app.get('/api/docs', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/html');
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Spinwheel Platform - OpenAPI & Swagger UI</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css" />
  <link rel="icon" type="image/png" href="https://spinwheel.io/favicon.ico" />
  <style>
    html { box-sizing: border-box; overflow: -moz-scrollbars-vertical; overflow-y: scroll; }
    *, *:before, *:after { box-sizing: inherit; }
    body { margin: 0; background: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    .swagger-ui { color: #f1f5f9; }
    .swagger-ui .topbar { display: none; }
    .swagger-ui .info .title { color: #38bdf8; font-weight: 800; font-size: 28px; }
    .swagger-ui .info p, .swagger-ui .info li { color: #94a3b8; }
    .swagger-ui .scheme-container { background: #0f172a; box-shadow: none; border-bottom: 1px solid #1e293b; }
    .swagger-ui .opblock { border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.3); border: 1px solid #1e293b; background: #0f172a; margin-bottom: 14px; }
    .swagger-ui .opblock .opblock-summary { border-bottom: none; }
    .swagger-ui .opblock .opblock-summary-path { color: #f8fafc; font-weight: 600; }
    .swagger-ui .opblock .opblock-summary-description { color: #94a3b8; }
    .swagger-ui .opblock-tag { color: #38bdf8; font-size: 18px; border-bottom: 1px solid #1e293b; }
    .swagger-ui .opblock.opblock-post { border-color: rgba(16, 185, 129, 0.4); background: rgba(6, 78, 59, 0.15); }
    .swagger-ui .opblock.opblock-post .opblock-summary-method { background: #059669; }
    .swagger-ui .opblock.opblock-get { border-color: rgba(56, 189, 248, 0.4); background: rgba(12, 74, 110, 0.15); }
    .swagger-ui .opblock.opblock-get .opblock-summary-method { background: #0284c7; }
    .swagger-ui table thead tr td, .swagger-ui table thead tr th { color: #94a3b8; border-bottom: 1px solid #334155; }
    .swagger-ui .tab li button.tablinks { color: #94a3b8; }
    .swagger-ui .tab li.active button.tablinks { color: #38bdf8; font-weight: bold; }
    .swagger-ui .btn.execute { background-color: #0284c7; color: #fff; border-color: #0284c7; border-radius: 8px; font-weight: bold; }
    .swagger-ui .btn.try-out__btn { background: #1e293b; color: #38bdf8; border-color: #334155; border-radius: 6px; }
    .swagger-ui select, .swagger-ui input[type=text] { background: #020617; color: #f8fafc; border: 1px solid #334155; border-radius: 6px; }
    .custom-header { background: linear-gradient(135deg, #0f172a 0%, #020617 100%); border-bottom: 1px solid #1e293b; padding: 20px 32px; display: flex; align-items: center; justify-content: space-between; }
    .custom-logo { display: flex; align-items: center; gap: 12px; }
    .custom-logo-icon { width: 36px; height: 36px; border-radius: 10px; background: linear-gradient(135deg, #8b5cf6, #ec4899); display: flex; align-items: center; justify-content: center; font-weight: 900; color: white; }
    .custom-logo-text { font-size: 18px; font-weight: 800; color: white; letter-spacing: -0.5px; }
    .custom-badge { background: rgba(56, 189, 248, 0.15); border: 1px solid rgba(56, 189, 248, 0.3); color: #38bdf8; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 20px; font-family: monospace; }
  </style>
</head>
<body>
  <div class="custom-header">
    <div class="custom-logo">
      <div class="custom-logo-icon">S</div>
      <div class="custom-logo-text">Spinwheel Developer API Reference</div>
      <span class="custom-badge">OpenAPI 3.0.3</span>
    </div>
    <div>
      <a href="http://localhost:5173" style="color: #94a3b8; text-decoration: none; font-size: 13px; margin-right: 16px;">← Back to Demo App</a>
      <a href="/api/docs/openapi.json" target="_blank" style="background: #1e293b; color: #38bdf8; padding: 6px 12px; border-radius: 8px; text-decoration: none; font-size: 12px; font-weight: 600; border: 1px solid #334155;">Download openapi.json ↗</a>
    </div>
  </div>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js"></script>
  <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function() {
      const ui = SwaggerUIBundle({
        url: "/api/docs/openapi.json",
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        plugins: [
          SwaggerUIBundle.plugins.DownloadUrl
        ],
        layout: "BaseLayout",
        defaultModelsExpandDepth: -1,
        docExpansion: "list",
        filter: true
      });
      window.ui = ui;
    };
  </script>
</body>
</html>`;
  return res.send(html);
});

// Express global error handler


app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled Global Server Error:', err);
  const normalized = normalizeError(err, 500, 'backend');
  return res.status(normalized.httpStatus).json({
    success: false,
    error: normalized
  });
});

export { app };

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Express server started on port ${PORT}`);
  });
}

