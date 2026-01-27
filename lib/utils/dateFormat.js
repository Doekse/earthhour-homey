'use strict';

const { DateTime } = require('luxon');

/**
 * Formats a Date object as an ISO string in the specified timezone with offset in brackets.
 * @param {Date} date - The date to format
 * @param {string} timezone - The timezone string (e.g. 'Europe/Amsterdam')
 * @returns {string} ISO-formatted date string in the local timezone with offset in brackets
 */
function formatDateInTimezone(date, timezone) {
  const dt = DateTime.fromJSDate(date).setZone(timezone);
  const offset = dt.toFormat('ZZZZ');
  return `${dt.toFormat("yyyy-MM-dd'T'HH:mm:ss.SSS")}(${offset})`;
}

/**
 * English ordinal suffix for day (1st, 2nd, 3rd, 4th, …). Luxon has no built-in day ordinals.
 * @param {number} day - Day of month 1–31
 * @returns {string} e.g. "28th"
 */
function ordinalEn(day) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = day % 100;
  return day + (s[(v - 20) % 10] || s[v] || s[0]);
}

/**
 * Formats a Date for user-facing text (e.g. "28th March 2026" in en, "28 maart 2026" in nl).
 * Month is localized when locale is provided; ordinals only for English.
 * @param {Date} date - The date to format
 * @param {string} timezone - The timezone string (e.g. 'Europe/Amsterdam')
 * @param {string} [locale] - Homey language (e.g. 'en', 'nl'); uses default if omitted
 * @returns {string} Human-readable date
 */
function formatDateFriendly(date, timezone, locale) {
  const loc = locale || 'en';
  const dt = DateTime.fromJSDate(date).setZone(timezone).setLocale(loc);
  const month = dt.toFormat('MMMM');
  const year = dt.toFormat('yyyy');
  const { day } = dt;
  if (loc.startsWith('en')) {
    return `${ordinalEn(day)} ${month} ${year}`;
  }
  return `${day} ${month} ${year}`;
}

/**
 * Formats a Date without year (e.g. "28th March" in en, "28 maart" in nl). Use when context
 * already implies the year (e.g. "this year"). Month is localized via Luxon; ordinals only for English.
 * @param {Date} date - The date to format
 * @param {string} timezone - The timezone string (e.g. 'Europe/Amsterdam')
 * @param {string} [locale] - Homey language (e.g. 'en', 'nl'); uses default if omitted
 * @returns {string} Human-readable date without year
 */
function formatDateFriendlyNoYear(date, timezone, locale) {
  const loc = locale || 'en';
  const dt = DateTime.fromJSDate(date).setZone(timezone).setLocale(loc);
  const month = dt.toFormat('MMMM');
  const { day } = dt;
  if (loc.startsWith('en')) {
    return `${ordinalEn(day)} ${month}`;
  }
  return `${day} ${month}`;
}

/**
 * Formats a Date's time for user-facing text (e.g. "20:30" or "8:30 PM").
 * @param {Date} date - The date whose time to format
 * @param {string} timezone - The timezone string (e.g. 'Europe/Amsterdam')
 * @returns {string} Human-readable time
 */
function formatTimeFriendly(date, timezone) {
  const dt = DateTime.fromJSDate(date).setZone(timezone);
  return dt.toFormat('HH:mm');
}

module.exports = {
  formatDateInTimezone,
  formatDateFriendly,
  formatDateFriendlyNoYear,
  formatTimeFriendly,
};
