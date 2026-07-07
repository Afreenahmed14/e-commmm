/**
 * Centralized user-facing messages so copy stays consistent
 * across controllers and is easy to update or localize later.
 */
module.exports = {
  AUTH: {
    REGISTER_SUCCESS: 'Account created successfully',
    LOGIN_SUCCESS: 'Logged in successfully',
    LOGOUT_SUCCESS: 'Logged out successfully',
    INVALID_CREDENTIALS: 'Invalid email or password',
    EMAIL_IN_USE: 'An account with this email already exists',
    UNAUTHORIZED: 'You must be logged in to access this resource',
    FORBIDDEN: 'You do not have permission to perform this action',
    TOKEN_INVALID: 'Session expired or invalid, please log in again',
    ACCOUNT_SUSPENDED: 'This account has been suspended. Contact support.',
    FIREBASE_ACCOUNT_NOT_FOUND: 'No account found for this sign-in. Please register first.',
    FIREBASE_ADMIN_NOT_PROVISIONED: 'This Google/phone/email is not linked to an admin account.',
    FIREBASE_MISSING_HOURLY_RATE: 'Hourly rate is required to finish creating your freelancer profile',
    FIREBASE_MISSING_COMPANY_NAME: 'Company name is required to finish creating your company profile',
    PHONE_IN_USE: 'An account with this phone number already exists',
  },
  GENERIC: {
    SERVER_ERROR: 'Something went wrong. Please try again later.',
    NOT_FOUND: 'Requested resource was not found',
    VALIDATION_FAILED: 'Validation failed',
  },
  PAYMENT: {
    ORDER_CREATED: 'Payment order created',
    VERIFIED: 'Payment verified and contact unlocked',
    VERIFICATION_FAILED: 'Payment verification failed',
    ALREADY_UNLOCKED: 'Contact details are already unlocked for this candidate',
  },
};
