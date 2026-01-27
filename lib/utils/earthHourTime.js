'use strict';

const { DateTime } = require('luxon');
const earthHourDate = require('./earthHourDate');

/**
 * Helpers for "minutes until" Earth Hour start/end. Used by flow conditions
 * (e.g. "Earth Hour starts in X minutes") to compare against user-specified windows.
 */

/**
 * Calculates rounded minutes between now and a target date. Helper function
 * used by getMinutesUntilEarthHourStart and getMinutesUntilEarthHourEnd.
 * @param {Date} targetDate - Target moment
 * @param {string} timezone - The timezone string (e.g. 'Europe/Amsterdam')
 * @param {object} now - DateTime (Luxon) for current moment in timezone
 * @returns {number} Rounded minutes from now until target
 */
function minutesUntil(targetDate, timezone, now) {
  const target = DateTime.fromJSDate(targetDate).setZone(timezone);
  return Math.round(target.diff(now, 'minutes').minutes);
}

/**
 * Minutes until the next Earth Hour start. Positive = future, negative = already started or passed.
 * Uses this year's start when we're before this year's end (so during 20:30–21:30 we correctly
 * return negative); otherwise uses the upcoming (next year's) start.
 * @param {string} timezone - The timezone string (e.g. 'Europe/Amsterdam')
 * @returns {number} Minutes until 20:30 on the last Saturday of March (current or next year)
 */
function getMinutesUntilEarthHourStart(timezone) {
  const now = DateTime.now().setZone(timezone);
  const thisYearEnd = DateTime.fromJSDate(earthHourDate.getThisYearsEarthHourEnd(timezone)).setZone(timezone);
  const startDate = now < thisYearEnd
    ? earthHourDate.getThisYearsEarthHourStart(timezone)
    : earthHourDate.getUpcomingEarthHourStart(timezone);
  return minutesUntil(startDate, timezone, now);
}

/**
 * Minutes until the next Earth Hour end. Positive = future, negative = already ended or passed.
 * Uses this year's end when we're before this year's end (so during 20:30–21:30 we correctly
 * return positive minutes until 21:30); otherwise uses the upcoming (next year's) end.
 * @param {string} timezone - The timezone string (e.g. 'Europe/Amsterdam')
 * @returns {number} Minutes until 21:30 on the last Saturday of March (current or next year)
 */
function getMinutesUntilEarthHourEnd(timezone) {
  const now = DateTime.now().setZone(timezone);
  const thisYearEnd = DateTime.fromJSDate(earthHourDate.getThisYearsEarthHourEnd(timezone)).setZone(timezone);
  const endDate = now < thisYearEnd
    ? earthHourDate.getThisYearsEarthHourEnd(timezone)
    : earthHourDate.getUpcomingEarthHourEnd(timezone);
  return minutesUntil(endDate, timezone, now);
}

module.exports = {
  getMinutesUntilEarthHourStart,
  getMinutesUntilEarthHourEnd,
};
