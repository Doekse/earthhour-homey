'use strict';

const Homey = require('homey');
const { CronJob } = require('cron');
const earthHourDate = require('./lib/utils/earthHourDate');
const earthHourChecks = require('./lib/utils/earthHourChecks');
const earthHourTime = require('./lib/utils/earthHourTime');
const dateFormat = require('./lib/utils/dateFormat');
const notifications = require('./lib/utils/notifications');

/**
 * Homey app that provides Earth Hour flow triggers and conditions.
 * Earth Hour occurs 20:30–21:30 local time on the last Saturday of March each year.
 */
module.exports = class EarthHourApp extends Homey.App {

  /**
   * Entry point for app bootstrap. Wires flow triggers, condition cards, and cron jobs
   * to the Homey clock and timezone. Re-runs setup when the user changes timezone.
   */
  async onInit() {
    this.log('Earth Hour app has been initialized');

    // DEBUG: clear notification settings so you can re-test thank-you and scheduled notifications.
    // Remove this block before release.
    // const notificationKeys = [
    //   'notifications.thankYouShown',
    //   'notifications.oneMonthBeforeYear',
    //   'notifications.oneWeekBeforeYear',
    //   'notifications.oneDayBeforeYear',
    //   'notifications.thirtyMinBeforeYear',
    // ];
    // for (const key of notificationKeys) {
    //   this.homey.settings.unset(key);
    // }
    // this.log('[DEBUG] Cleared notification settings');

    const timezone = this.homey.clock.getTimezone();
    this.log(`Using timezone: ${timezone}`);

    this._earthHourStartsTrigger = this.homey.flow.getTriggerCard('earth_hour_starts');
    this._earthHourEndsTrigger = this.homey.flow.getTriggerCard('earth_hour_ends');

    this._registerConditionCards(timezone);
    this._setupCronJobs(timezone);
    await notifications.sendThankYou(this, timezone);

    this.homey.clock.on('timezoneChange', () => {
      this.log('Timezone changed, reinitializing...');
      const newTimezone = this.homey.clock.getTimezone();
      this._setupCronJobs(newTimezone);
      this._registerConditionCards(newTimezone);
    });
  }

  /**
   * Registers flow condition card listeners. Conditions must receive the active timezone
   * so they evaluate correctly; registration runs at init and on timezone change.
   * @param {string} timezone - The timezone string (e.g. 'Europe/Amsterdam')
   */
  _registerConditionCards(timezone) {
    const earthHourStartsInCondition = this.homey.flow.getConditionCard('earth_hour_starts_in');
    earthHourStartsInCondition.registerRunListener(async (args) => {
      const minutesUntil = earthHourTime.getMinutesUntilEarthHourStart(timezone);
      const targetMinutes = args.unit === 'hours' ? args.amount * 60 : args.amount;
      const result = minutesUntil >= 0 && minutesUntil <= targetMinutes;
      this.log(`[earth_hour_starts_in] minutesUntil: ${minutesUntil}, target: ${targetMinutes} ${args.unit}, result: ${result}`);
      return result;
    });

    const earthHourEndsInCondition = this.homey.flow.getConditionCard('earth_hour_ends_in');
    earthHourEndsInCondition.registerRunListener(async (args) => {
      const minutesUntil = earthHourTime.getMinutesUntilEarthHourEnd(timezone);
      const result = minutesUntil >= 0 && minutesUntil <= args.amount;
      this.log(`[earth_hour_ends_in] minutesUntil: ${minutesUntil}, target: ${args.amount} minutes, result: ${result}`);
      return result;
    });

    const isCurrentlyEarthHourCondition = this.homey.flow.getConditionCard('is_currently_earth_hour');
    isCurrentlyEarthHourCondition.registerRunListener(async () => {
      const result = earthHourChecks.isCurrentlyEarthHour(timezone);
      this.log(`[is_currently_earth_hour] result: ${result}`);
      return result;
    });

    const isEarthHourDayCondition = this.homey.flow.getConditionCard('is_earth_hour_day');
    isEarthHourDayCondition.registerRunListener(async () => {
      const result = earthHourChecks.isEarthHourDay(timezone);
      this.log(`[is_earth_hour_day] result: ${result}`);
      return result;
    });

    this.log('Condition cards registered');
  }

  /**
   * Sets up a single cron job for Earth Hour start/end triggers. Runs every minute to detect
   * start/end within a 1-minute window. Existing job is stopped first so timezone changes
   * don't leave a duplicate running.
   * @param {string} timezone - The timezone string (e.g. 'Europe/Amsterdam')
   */
  _setupCronJobs(timezone) {
    if (this._earthHourCron) {
      this.log('[Cron] Stopping existing Earth Hour cron job');
      this._earthHourCron.stop();
    }
    this._lastTriggeredStartYear = null;
    this._lastTriggeredEndYear = null;

    this.log(`[Cron] Registering Earth Hour cron job (timezone: ${timezone})`);
    this._earthHourCron = CronJob.from({
      cronTime: '* * * * *',
      onTick: async () => {
        try {
          const now = new Date();
          const currentYear = now.getFullYear();
          const earthHourStart = earthHourDate.getEarthHourDate(currentYear, timezone);
          const earthHourEnd = earthHourDate.getEarthHourEnd(currentYear, timezone);

          const diffStartMs = Math.abs(now.getTime() - earthHourStart.getTime());
          const diffEndMs = Math.abs(now.getTime() - earthHourEnd.getTime());
          const diffStartMin = diffStartMs / (1000 * 60);
          const diffEndMin = diffEndMs / (1000 * 60);

          this.log(
            `[Cron] now: ${dateFormat.formatDateInTimezone(now, timezone)}, `
            + `start: ${dateFormat.formatDateInTimezone(earthHourStart, timezone)} (Δ${diffStartMin.toFixed(2)}m), `
            + `end: ${dateFormat.formatDateInTimezone(earthHourEnd, timezone)} (Δ${diffEndMin.toFixed(2)}m), `
            + `lastTriggered: start=${this._lastTriggeredStartYear} end=${this._lastTriggeredEndYear}`,
          );

          if (diffStartMin <= 1 && this._lastTriggeredStartYear !== currentYear) {
            this.log('[Cron] Earth Hour starts! Triggering flow...');
            await this._earthHourStartsTrigger.trigger();
            this._lastTriggeredStartYear = currentYear;
          }
          if (diffEndMin <= 1 && this._lastTriggeredEndYear !== currentYear) {
            this.log('[Cron] Earth Hour ends! Triggering flow...');
            await this._earthHourEndsTrigger.trigger();
            this._lastTriggeredEndYear = currentYear;
          }

          await notifications.runScheduledNotifications(this, timezone);
        } catch (error) {
          this.error('Error in Earth Hour cron job:', error);
        }
      },
      start: true,
      timeZone: timezone,
    });
    this.log('[Cron] Earth Hour cron job registered and started');
  }

};
