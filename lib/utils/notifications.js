'use strict';

const earthHourDate = require('./earthHourDate');
const dateFormat = require('./dateFormat');

/**
 * True if targetDate is within 1 minute of nowMs. Used to detect notification moments.
 * @param {number} nowMs - Current time in milliseconds
 * @param {Date} targetDate - Target moment
 * @returns {boolean}
 */
function isWithinOneMinute(nowMs, targetDate) {
  const diffMs = Math.abs(nowMs - targetDate.getTime());
  return diffMs <= 60 * 1000;
}

/**
 * Sends the thank-you timeline notification once after installation. Uses upcoming
 * Earth Hour date/time so it is correct even when installed after this year's EH.
 * No-ops if already sent.
 * @param {object} ctx - App context: { homey, log, error }
 * @param {string} timezone - The timezone string (e.g. 'Europe/Amsterdam')
 */
async function sendThankYou(ctx, timezone) {
  try {
    const shown = await ctx.homey.settings.get('notifications.thankYouShown');
    if (shown) return;

    const locale = ctx.homey.i18n.getLanguage();
    const upcoming = earthHourDate.getUpcomingEarthHourStart(timezone);
    const dateStr = dateFormat.formatDateFriendlyNoYear(upcoming, timezone, locale);
    const timeStr = dateFormat.formatTimeFriendly(upcoming, timezone);
    const excerpt = ctx.homey.__('notifications.thankYou', { date: dateStr, time: timeStr });

    await ctx.homey.notifications.createNotification({ excerpt });
    await ctx.homey.settings.set('notifications.thankYouShown', true);
    ctx.log('[Notifications] Thank-you notification sent');
  } catch (error) {
    ctx.error('[Notifications] Error sending thank-you notification:', error);
  }
}

/**
 * Sends the one-month-before reminder notification if due (one month before Earth Hour, 20:30).
 * @param {object} ctx - App context: { homey, log, error }
 * @param {string} timezone
 * @param {number} nowMs
 * @param {number} useYear
 */
async function sendOneMonthBeforeReminder(ctx, timezone, nowMs, useYear) {
  try {
    const oneMonth = earthHourDate.getOneMonthBeforeEarthHour(useYear, timezone);
    if (!isWithinOneMinute(nowMs, oneMonth)) return;

    const sent = await ctx.homey.settings.get('notifications.oneMonthBeforeYear');
    if (sent === useYear) return;

    const locale = ctx.homey.i18n.getLanguage();
    const eh = earthHourDate.getEarthHourDate(useYear, timezone);
    const excerpt = ctx.homey.__('notifications.oneMonthBefore', {
      date: dateFormat.formatDateFriendlyNoYear(eh, timezone, locale),
      time: dateFormat.formatTimeFriendly(eh, timezone),
    });
    await ctx.homey.notifications.createNotification({ excerpt });
    await ctx.homey.settings.set('notifications.oneMonthBeforeYear', useYear);
    ctx.log('[Notifications] One-month-before reminder sent');
  } catch (error) {
    ctx.error('[Notifications] Error sending one-month-before reminder:', error);
  }
}

/**
 * Sends the one-week-before reminder if due (Saturday before EH, 20:30).
 * @param {object} ctx - App context: { homey, log, error }
 * @param {string} timezone
 * @param {number} nowMs
 * @param {number} useYear
 */
async function sendOneWeekBeforeReminder(ctx, timezone, nowMs, useYear) {
  try {
    const oneWeek = earthHourDate.getOneWeekBeforeEarthHour(useYear, timezone);
    if (!isWithinOneMinute(nowMs, oneWeek)) return;

    const sent = await ctx.homey.settings.get('notifications.oneWeekBeforeYear');
    if (sent === useYear) return;

    const excerpt = ctx.homey.__('notifications.oneWeekBefore', {
      time: dateFormat.formatTimeFriendly(earthHourDate.getEarthHourDate(useYear, timezone), timezone),
    });
    await ctx.homey.notifications.createNotification({ excerpt });
    await ctx.homey.settings.set('notifications.oneWeekBeforeYear', useYear);
    ctx.log('[Notifications] One-week-before reminder sent');
  } catch (error) {
    ctx.error('[Notifications] Error sending one-week-before reminder:', error);
  }
}

/**
 * Sends the one-day-before reminder if due (Friday before EH, 20:30).
 * @param {object} ctx - App context: { homey, log, error }
 * @param {string} timezone
 * @param {number} nowMs
 * @param {number} useYear
 */
async function sendOneDayBeforeReminder(ctx, timezone, nowMs, useYear) {
  try {
    const oneDay = earthHourDate.getOneDayBeforeEarthHour(useYear, timezone);
    if (!isWithinOneMinute(nowMs, oneDay)) return;

    const sent = await ctx.homey.settings.get('notifications.oneDayBeforeYear');
    if (sent === useYear) return;

    const excerpt = ctx.homey.__('notifications.oneDayBefore', {
      time: dateFormat.formatTimeFriendly(earthHourDate.getEarthHourDate(useYear, timezone), timezone),
    });
    await ctx.homey.notifications.createNotification({ excerpt });
    await ctx.homey.settings.set('notifications.oneDayBeforeYear', useYear);
    ctx.log('[Notifications] One-day-before reminder sent');
  } catch (error) {
    ctx.error('[Notifications] Error sending one-day-before reminder:', error);
  }
}

/**
 * Sends the thirty-minutes-before reminder if due (EH day, 20:00).
 * @param {object} ctx - App context: { homey, log, error }
 * @param {string} timezone
 * @param {number} nowMs
 * @param {number} useYear
 */
async function sendThirtyMinBeforeReminder(ctx, timezone, nowMs, useYear) {
  try {
    const thirtyMin = earthHourDate.getThirtyMinutesBeforeEarthHour(useYear, timezone);
    if (!isWithinOneMinute(nowMs, thirtyMin)) return;

    const sent = await ctx.homey.settings.get('notifications.thirtyMinBeforeYear');
    if (sent === useYear) return;

    const excerpt = ctx.homey.__('notifications.thirtyMinBefore');
    await ctx.homey.notifications.createNotification({ excerpt });
    await ctx.homey.settings.set('notifications.thirtyMinBeforeYear', useYear);
    ctx.log('[Notifications] Thirty-min-before reminder sent');
  } catch (error) {
    ctx.error('[Notifications] Error sending thirty-min-before reminder:', error);
  }
}

/**
 * Runs scheduled notification checks: if within ~1 minute of a notification moment,
 * sends the corresponding timeline notification and persists "sent" state per year.
 * @param {object} ctx - App context: { homey, log, error }
 * @param {string} timezone - The timezone string (e.g. 'Europe/Amsterdam')
 */
async function runScheduledNotifications(ctx, timezone) {
  const now = new Date();
  const nowMs = now.getTime();
  const currentYear = now.getFullYear();
  const thisYearEh = earthHourDate.getEarthHourDate(currentYear, timezone);
  const useYear = now >= thisYearEh ? currentYear + 1 : currentYear;

  await sendOneMonthBeforeReminder(ctx, timezone, nowMs, useYear);
  await sendOneWeekBeforeReminder(ctx, timezone, nowMs, useYear);
  await sendOneDayBeforeReminder(ctx, timezone, nowMs, useYear);
  await sendThirtyMinBeforeReminder(ctx, timezone, nowMs, useYear);
}

module.exports = {
  sendThankYou,
  runScheduledNotifications,
};
