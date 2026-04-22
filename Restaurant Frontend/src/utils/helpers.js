// ─────────────────────────────────────────────────────────────────────────────
// General Helper / Utility Functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * API error se readable message nikalna
 * @param {any} error - Axios error object
 * @returns {string}
 */
export const getErrorMessage = (error) => {
  return (
    error?.response?.data?.message ||
    error?.message ||
    'Kuch gadbad ho gayi. Baad mein try karein.'
  );
};

/**
 * Price ko Indian Rupee format mein format karna
 * @param {number} amount
 * @returns {string}
 */
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount);
};

/**
 * Date ko readable format mein convert karna
 * @param {string | Date} date
 * @returns {string}
 */
export const formatDate = (date) => {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
};

/**
 * String ko Title Case mein convert karna
 * @param {string} str
 * @returns {string}
 */
export const toTitleCase = (str) => {
  if (!str) return '';
  return str
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Check karna ki user ka role permission mein hai ya nahi
 * @param {string} userRole
 * @param {string[]} allowedRoles
 * @returns {boolean}
 */
export const hasPermission = (userRole, allowedRoles) => {
  return allowedRoles.includes(userRole);
};
