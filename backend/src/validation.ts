/**
 * Input validation helpers for Spinwheel SMS Connect requests.
 */

export interface ConnectUserPayload {
  phoneNumber: string;
  dateOfBirth: string;
}

export interface VerifyUserPayload {
  userId: string;
  code: string;
}

/**
 * Validates the connection user request body.
 */
export function validateConnectUser(body: any): { valid: boolean; error?: string; data?: ConnectUserPayload } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Request body must be a JSON object' };
  }

  // Check for allowed fields only
  const allowedFields = ['phoneNumber', 'dateOfBirth'];
  const extraFields = Object.keys(body).filter((key) => !allowedFields.includes(key));
  if (extraFields.length > 0) {
    return { valid: false, error: `Unknown extra fields: ${extraFields.join(', ')}` };
  }

  const { phoneNumber, dateOfBirth } = body;

  if (!phoneNumber) {
    return { valid: false, error: 'phoneNumber is required' };
  }

  if (typeof phoneNumber !== 'string') {
    return { valid: false, error: 'phoneNumber must be a string' };
  }

  // Validate E.164 US mobile number (e.g. +14155552671)
  const e164Regex = /^\+1[2-9]\d{9}$/;
  if (!e164Regex.test(phoneNumber)) {
    return { valid: false, error: 'phoneNumber must be a valid E.164 US format (e.g., +14155552671)' };
  }

  if (!dateOfBirth) {
    return { valid: false, error: 'dateOfBirth is required' };
  }

  if (typeof dateOfBirth !== 'string') {
    return { valid: false, error: 'dateOfBirth must be a string' };
  }

  // Validate YYYY-MM-DD format strictly
  const dobRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dobRegex.test(dateOfBirth)) {
    return { valid: false, error: 'dateOfBirth must be in YYYY-MM-DD format' };
  }

  // Check if date is valid
  const parsedDate = Date.parse(dateOfBirth);
  if (isNaN(parsedDate)) {
    return { valid: false, error: 'dateOfBirth must be a valid date' };
  }

  return {
    valid: true,
    data: { phoneNumber, dateOfBirth }
  };
}

/**
 * Validates the SMS OTP verification request body.
 */
export function validateVerifyUser(body: any): { valid: boolean; error?: string; data?: VerifyUserPayload } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Request body must be a JSON object' };
  }

  // Check for allowed fields only
  const allowedFields = ['userId', 'code'];
  const extraFields = Object.keys(body).filter((key) => !allowedFields.includes(key));
  if (extraFields.length > 0) {
    return { valid: false, error: `Unknown extra fields: ${extraFields.join(', ')}` };
  }

  const { userId, code } = body;

  if (!userId) {
    return { valid: false, error: 'userId is required' };
  }

  if (typeof userId !== 'string' || userId.trim() === '') {
    return { valid: false, error: 'userId must be a non-empty string' };
  }

  if (!code) {
    return { valid: false, error: 'code is required' };
  }

  if (typeof code !== 'string') {
    return { valid: false, error: 'code must be a string' };
  }

  // Validate 6-digit numeric OTP code
  const codeRegex = /^\d{6}$/;
  if (!codeRegex.test(code)) {
    return { valid: false, error: 'code must be a 6-digit numeric string' };
  }

  return {
    valid: true,
    data: { userId, code }
  };
}

export const ALLOWED_LIABILITY_TYPES = [
  'STUDENT_LOAN',
  'CREDIT_CARD',
  'HOME_LOAN',
  'AUTO_LOAN',
  'PERSONAL_LOAN',
  'MISCELLANEOUS_LIABILITY'
];

/**
 * Validates the parameters for the debt profile request.
 */
export function validateDebtProfileParams(userId: any, liabilityType?: any): { valid: boolean; error?: string } {
  if (!userId || typeof userId !== 'string' || userId.trim() === '') {
    return { valid: false, error: 'userId must be a non-empty string' };
  }

  // UUID verification check (optional but recommended since Spinwheel uses UUIDs)
  const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  if (!uuidRegex.test(userId)) {
    return { valid: false, error: 'userId must be a valid UUID format' };
  }

  if (liabilityType !== undefined && liabilityType !== null && liabilityType !== '') {
    if (typeof liabilityType !== 'string' || !ALLOWED_LIABILITY_TYPES.includes(liabilityType)) {
      return { valid: false, error: `Invalid liabilityType. Must be one of: ${ALLOWED_LIABILITY_TYPES.join(', ')}` };
    }
  }

  return { valid: true };
}

export interface BalanceTransferSubmitPayload {
  userId: string;
  payments: Array<{
    liabilityId: string;
    amountInCents: number;
    payoffQuoteId?: string;
  }>;
}

export function validateBalanceTransferSubmit(body: any): { valid: boolean; error?: string; data?: BalanceTransferSubmitPayload } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Request body must be a JSON object' };
  }

  const { userId, payments } = body;

  if (!userId || typeof userId !== 'string') {
    return { valid: false, error: 'userId is required and must be a string' };
  }

  if (!Array.isArray(payments) || payments.length === 0) {
    return { valid: false, error: 'payments must be a non-empty array' };
  }

  for (const item of payments) {
    if (!item.liabilityId || typeof item.liabilityId !== 'string') {
      return { valid: false, error: 'Each payment item must have a valid liabilityId string' };
    }
    if (typeof item.amountInCents !== 'number' || item.amountInCents <= 0) {
      return { valid: false, error: 'Each payment item must have a positive amountInCents' };
    }
  }

  return {
    valid: true,
    data: { userId, payments }
  };
}

