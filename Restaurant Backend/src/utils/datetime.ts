import moment from 'moment-timezone';

/**
 * Asia/Kolkata timezone me current datetime return karta hai
 * Format: "YYYY-MM-DD HH:mm:ss"
 */
export const getNowIST = (): string => {
  return moment().tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss');
};
