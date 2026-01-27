'use strict';

const { DateTime } = require('luxon');
const earthHourDate = require('./earthHourDate');

/**
 * Boolean checks for Earth Hour state. Used by flow conditions "Is currently Earth Hour"
 * and "Is Earth Hour day."
 */

/**
 * True if the current moment falls within 20:30–21:30 on Earth Hour day (last Saturday of March).
 * Uses this year's Earth Hour window so it remains correct during the event.
 * @param {string} timezone - The timezone string (e.g. 'Europe/Amsterdam')
 * @returns {boolean} True when now is within the Earth Hour window
 */
function isCurrentlyEarthHour(timezone) {
  const now = DateTime.now().setZone(timezone);
  const start = DateTime.fromJSDate(earthHourDate.getThisYearsEarthHourStart(timezone)).setZone(timezone);
  const end = DateTime.fromJSDate(earthHourDate.getThisYearsEarthHourEnd(timezone)).setZone(timezone);

  return now >= start && now < end;
}

/**
 * True if today's calendar date matches Earth Hour day (last Saturday of March), regardless of time.
 * Uses this year's Earth Hour date so it remains correct all day.
 * @param {string} timezone - The timezone string (e.g. 'Europe/Amsterdam')
 * @returns {boolean} True when today is the last Saturday of March this year
 */
function isEarthHourDay(timezone) {
  const now = DateTime.now().setZone(timezone);
  const earthHourStart = DateTime.fromJSDate(earthHourDate.getThisYearsEarthHourStart(timezone)).setZone(timezone);
  return earthHourStart.hasSame(now, 'day');
}

module.exports = {
  isCurrentlyEarthHour,
  isEarthHourDay,
};
