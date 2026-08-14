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
const MAX_REQUESTS_PER_WINDOW = 10;     // Max 10 requests per minute

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

// Express global error handler


app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled Global Server Error:', err);
  const normalized = normalizeError(err, 500, 'backend');
  return res.status(normalized.httpStatus).json({
    success: false,
    error: normalized
  });
});

app.listen(PORT, () => {
  console.log(`Express server started on port ${PORT}`);
});
