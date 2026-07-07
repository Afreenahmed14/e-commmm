const bcrypt = require('bcryptjs');
const { USER_STATUS } = require('../../constants/status');

/**
 * Mongoose plugin that adds authentication fields + password hashing +
 * helper methods to a schema. Applied to Candidate, Company, and Admin so
 * each role owns its own login credentials directly on its own document —
 * there is intentionally no shared `users` collection mixing candidate and
 * company data together. Every role-specific collection is self-contained:
 * one document per person, holding both their login credentials and their
 * profile.
 */
function authFieldsPlugin(schema, options = {}) {
  const role = options.role; // 'candidate' | 'company' | 'admin'

  schema.add({
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    email: {
      // Not `required` at the schema level: Firebase phone-only sign-ins may
      // have no email at all. Uniqueness is still enforced when present via
      // the sparse index below, and findAccountByEmail/authValidator still
      // require it on the classic local-password register/login paths.
      type: String,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    phone: {
      // E.164 format (e.g. +919876543210), set when the account signs in
      // (or links) via Firebase Phone-OTP auth.
      type: String,
      trim: true,
    },
    password: {
      // Only required for the classic local email/password path. Accounts
      // created purely via Firebase (Google / phone / email-link) have no
      // local password at all — `authProvider` tells you which is which.
      type: String,
      required: [
        function passwordRequired() {
          return this.authProvider === 'local';
        },
        'Password is required',
      ],
      minlength: 8,
      select: false,
    },
    // How this account authenticates. 'local' = classic email/password
    // against this collection. The rest are Firebase-verified: the actual
    // credential (Google identity, phone number, email link) lives in
    // Firebase; we just trust its verified ID token. An account can have
    // been created via one provider and later linked to another — this
    // field reflects the most recently used one, while `firebaseUid` is
    // the durable link back to the Firebase user record.
    authProvider: {
      type: String,
      enum: ['local', 'google', 'phone', 'firebase-email'],
      default: 'local',
    },
    firebaseUid: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      default: role,
      immutable: true,
    },
    status: {
      type: String,
      enum: Object.values(USER_STATUS),
      default: USER_STATUS.ACTIVE,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    tokenVersion: {
      type: Number,
      default: 0,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
    resetPasswordToken: {
      type: String,
      select: false,
    },
    resetPasswordExpires: {
      type: Date,
      select: false,
    },
  });

  // Sparse unique indexes: multiple documents can have email/phone/firebaseUid
  // unset (e.g. a phone-only Firebase account has no email), but whenever one
  // IS set it must be unique within this collection.
  schema.index({ email: 1 }, { unique: true, sparse: true });
  schema.index({ phone: 1 }, { unique: true, sparse: true });
  schema.index({ firebaseUid: 1 }, { unique: true, sparse: true });

  schema.pre('save', async function hashPassword(next) {
    if (!this.isModified('password') || !this.password) return next();
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  });

  schema.methods.comparePassword = function comparePassword(candidatePassword) {
    // Firebase-only accounts (authProvider !== 'local') have no local
    // password at all, so there is nothing to compare against.
    if (!this.password) return Promise.resolve(false);
    return bcrypt.compare(candidatePassword, this.password);
  };

  schema.methods.toSafeObject = function toSafeObject() {
    const obj = this.toObject();
    delete obj.password;
    delete obj.__v;
    return obj;
  };
}

module.exports = authFieldsPlugin;
