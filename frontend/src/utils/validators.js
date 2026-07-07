/** Shared client-side validation helpers used alongside React Hook Form rules. */
export const isValidEmail = (value) => /^\S+@\S+\.\S+$/.test(value);

export const isStrongPassword = (value) => value.length >= 8 && /\d/.test(value);

export const isValidUrl = (value) => {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
};
