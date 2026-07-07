/**
 * Shared status enums used by users, payments, verification, and contact unlocks.
 */
module.exports = {
  USER_STATUS: {
    ACTIVE: 'active',
    SUSPENDED: 'suspended',
    PENDING: 'pending',
    DELETED: 'deleted',
  },
  PAYMENT_STATUS: {
    CREATED: 'created',
    PAID: 'paid',
    FAILED: 'failed',
    REFUNDED: 'refunded',
  },
  VERIFICATION_STATUS: {
    UNVERIFIED: 'unverified',
    PENDING: 'pending',
    VERIFIED: 'verified',
    REJECTED: 'rejected',
  },
  UNLOCK_STATUS: {
    ACTIVE: 'active',
    REVOKED: 'revoked',
  },
  VISIBILITY: {
    PUBLIC: 'public',
    PRIVATE: 'private',
  },
};
