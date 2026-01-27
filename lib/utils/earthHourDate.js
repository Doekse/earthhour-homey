'use strict';

const { DateTime } = require('luxon');

/**
 * Earth Hour date helpers. Earth Hour is 20:30–21:30 local time on the last Saturday of March.
 * All functions accept a timezone string (e.g. 'Europe/Amsterdam') and return JS Date objects.
 */

/**
 * Returns 20:30 local time on the last Saturday of March for the given year.
 * @param {number} year - The year to calculate for
 * @param {string} timezone - The timezone string (e.g. 'Europe/Amsterdam')
 * @returns {Date} 8:30 PM local time on the last Saturday of March
 */
function getEarthHourDate(year, timezone) {
  // Start from March 31 and work backwards; the last Saturday is never later than the 31st.
  const date = DateTime.fromObject({ year, month: 3, day: 31 }, { zone: timezone });

  // Luxon weekdays: 1 = Monday … 7 = Sunday; Saturday = 6.
  // Calculate days to subtract to reach the last Saturday: if already Saturday (6), subtract 0;
  // if Sunday (7), subtract 1; otherwise subtract (weekday + 1) to go back to the previous Saturday.
  const { weekday } = date;
  const daysToSubtract = { 6: 0, 7: 1 }[weekday] ?? weekday + 1;
  const lastSaturday = date.minus({ days: daysToSubtract });
  const earthHourDateTime = lastSaturday.set({
    hour: 20, minute: 30, second: 0, millisecond: 0,
  });

  return earthHourDateTime.toJSDate();
}

/**
 * Adds one hour to the Earth Hour start date. Used to calculate the end time
 * while preserving timezone handling.
 * @param {Date} startDate - Earth Hour start
 * @param {string} timezone - The timezone string (e.g. 'Europe/Amsterdam')
 * @returns {Date} startDate + 1 hour
 */
function addHourToStart(startDate, timezone) {
  return DateTime.fromJSDate(startDate).setZone(timezone).plus({ hours: 1 }).toJSDate();
}

/**
 * Returns 21:30 local time on the last Saturday of March for the given year (start + 1 hour).
 * @param {number} year - The year to calculate for
 * @param {string} timezone - The timezone string (e.g. 'Europe/Amsterdam')
 * @returns {Date} 9:30 PM on the last Saturday of March
 */
function getEarthHourEnd(year, timezone) {
  return addHourToStart(getEarthHourDate(year, timezone), timezone);
}

/**
 * Returns the next upcoming Earth Hour start (current year if still ahead, otherwise next year).
 * Used by conditions and "minutes until" logic to evaluate against the relevant occurrence.
 * @param {string} timezone - The timezone string (e.g. 'Europe/Amsterdam')
 * @returns {Date} 8:30 PM on the last Saturday of March (current or next year)
 */
function getUpcomingEarthHourStart(timezone) {
  const now = DateTime.now().setZone(timezone);
  const currentYear = now.year;

  const thisYearEarthHour = DateTime.fromJSDate(getEarthHourDate(currentYear, timezone)).setZone(timezone);

  if (now >= thisYearEarthHour) {
    return getEarthHourDate(currentYear + 1, timezone);
  }

  return thisYearEarthHour.toJSDate();
}

/**
 * Returns the next upcoming Earth Hour end (start + 1 hour). Mirrors getUpcomingEarthHourStart.
 * @param {string} timezone - The timezone string (e.g. 'Europe/Amsterdam')
 * @returns {Date} 9:30 PM on the last Saturday of March (current or next year)
 */
function getUpcomingEarthHourEnd(timezone) {
  return addHourToStart(getUpcomingEarthHourStart(timezone), timezone);
}

/**
 * Returns this year's Earth Hour start (20:30 on the last Saturday of March).
 * Use for "is currently Earth Hour?" and "is Earth Hour day?" checks; use getUpcomingEarthHourStart
 * for "minutes until" logic.
 * @param {string} timezone - The timezone string (e.g. 'Europe/Amsterdam')
 * @returns {Date} 8:30 PM on the last Saturday of March this year
 */
function getThisYearsEarthHourStart(timezone) {
  const { year } = DateTime.now().setZone(timezone);
  return getEarthHourDate(year, timezone);
}

/**
 * Returns this year's Earth Hour end (start + 1 hour). Mirrors getThisYearsEarthHourStart.
 * @param {string} timezone - The timezone string (e.g. 'Europe/Amsterdam')
 * @returns {Date} 9:30 PM on the last Saturday of March this year
 */
function getThisYearsEarthHourEnd(timezone) {
  return addHourToStart(getThisYearsEarthHourStart(timezone), timezone);
}

/**
 * Returns 20:30 local time one month before Earth Hour.
 * @param {number} year - The year of the Earth Hour (same as getEarthHourDate)
 * @param {string} timezone - The timezone string (e.g. 'Europe/Amsterdam')
 * @returns {Date} 8:30 PM one month before Earth Hour
 */
function getOneMonthBeforeEarthHour(year, timezone) {
  const eh = DateTime.fromJSDate(getEarthHourDate(year, timezone)).setZone(timezone);
  return eh.minus({ months: 1 }).toJSDate();
}

/**
 * Returns 20:30 local time on the Saturday one week before Earth Hour.
 * @param {number} year - The year of the Earth Hour (same as getEarthHourDate)
 * @param {string} timezone - The timezone string (e.g. 'Europe/Amsterdam')
 * @returns {Date} 8:30 PM on the Saturday one week before Earth Hour
 */
function getOneWeekBeforeEarthHour(year, timezone) {
  const eh = DateTime.fromJSDate(getEarthHourDate(year, timezone)).setZone(timezone);
  return eh.minus({ days: 7 }).toJSDate();
}

/**
 * Returns 20:30 local time on the Friday one day before Earth Hour.
 * @param {number} year - The year of the Earth Hour (same as getEarthHourDate)
 * @param {string} timezone - The timezone string (e.g. 'Europe/Amsterdam')
 * @returns {Date} 8:30 PM on the Friday before Earth Hour
 */
function getOneDayBeforeEarthHour(year, timezone) {
  const eh = DateTime.fromJSDate(getEarthHourDate(year, timezone)).setZone(timezone);
  return eh.minus({ days: 1 }).toJSDate();
}

/**
 * Returns 20:00 local time on Earth Hour day (30 minutes before 20:30 start).
 * @param {number} year - The year of the Earth Hour (same as getEarthHourDate)
 * @param {string} timezone - The timezone string (e.g. 'Europe/Amsterdam')
 * @returns {Date} 8:00 PM on the last Saturday of March
 */
function getThirtyMinutesBeforeEarthHour(year, timezone) {
  const eh = DateTime.fromJSDate(getEarthHourDate(year, timezone)).setZone(timezone);
  return eh.set({
    hour: 20, minute: 0, second: 0, millisecond: 0,
  }).toJSDate();
}

module.exports = {
  getEarthHourDate,
  getEarthHourEnd,
  getUpcomingEarthHourStart,
  getUpcomingEarthHourEnd,
  getThisYearsEarthHourStart,
  getThisYearsEarthHourEnd,
  getOneMonthBeforeEarthHour,
  getOneWeekBeforeEarthHour,
  getOneDayBeforeEarthHour,
  getThirtyMinutesBeforeEarthHour,
};
