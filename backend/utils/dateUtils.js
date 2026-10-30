/**
 * dateUtils.js
 * Authoritative Application Date and Timezone Utilities for ChronicOne.
 * Standardizes application calendar dates on Indian Standard Time (Asia/Kolkata)
 * while preserving UTC for timestamp storage.
 */

const APP_TIMEZONE = process.env.APP_TIMEZONE || 'Asia/Kolkata';

/**
 * Returns today's calendar date as YYYY-MM-DD in the authoritative application timezone.
 * @param {Date} [now=new Date()]
 * @param {string} [timeZone=APP_TIMEZONE]
 * @returns {string} YYYY-MM-DD
 */
function getTodayDateString(now = new Date(), timeZone = APP_TIMEZONE) {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(now);
  } catch (err) {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).formatToParts(now);
    const map = {};
    for (const p of parts) map[p.type] = p.value;
    return `${map.year}-${map.month}-${map.day}`;
  }
}

/**
 * Validates that a string is in exact YYYY-MM-DD format and represents an actual calendar date.
 * Rejects impossible dates (e.g., 2026-02-31, 2026-13-10, 2026-04-31).
 * @param {string} dateString
 * @returns {boolean}
 */
function isValidCalendarDate(dateString) {
  if (typeof dateString !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return false;
  }
  const [yearStr, monthStr, dayStr] = dateString.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);

  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return false;
  }

  const dateObj = new Date(Date.UTC(year, month - 1, day));
  return (
    dateObj.getUTCFullYear() === year &&
    dateObj.getUTCMonth() === month - 1 &&
    dateObj.getUTCDate() === day
  );
}

/**
 * Checks whether a YYYY-MM-DD date string is in the future relative to the application timezone today.
 * @param {string} dateString
 * @param {Date} [now=new Date()]
 * @param {string} [timeZone=APP_TIMEZONE]
 * @returns {boolean}
 */
function isFutureDate(dateString, now = new Date(), timeZone = APP_TIMEZONE) {
  const today = getTodayDateString(now, timeZone);
  return dateString > today;
}

/**
 * Parses YYYY-MM-DD into a UTC midnight timestamp for calendar day interval math.
 * @param {string} dateString
 * @returns {number} UTC epoch ms
 */
function parseCalendarDate(dateString) {
  if (!dateString || typeof dateString !== 'string') return 0;
  const parts = dateString.slice(0, 10).split('-');
  if (parts.length !== 3) return 0;
  return Date.UTC(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
}

module.exports = {
  APP_TIMEZONE,
  getTodayDateString,
  isValidCalendarDate,
  isFutureDate,
  parseCalendarDate
};
