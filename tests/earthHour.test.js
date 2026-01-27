'use strict';

const {
  describe, it, beforeEach, afterEach,
} = require('node:test');
const assert = require('node:assert');
const { DateTime, Settings } = require('luxon');

const earthHourDate = require('../lib/utils/earthHourDate');
const earthHourChecks = require('../lib/utils/earthHourChecks');
const earthHourTime = require('../lib/utils/earthHourTime');
const dateFormat = require('../lib/utils/dateFormat');

const TZ = 'Europe/Amsterdam';

/** @type {() => number} */
let originalNow;

/**
 * Sets "now" to a fixed moment in TZ for testing. Mocks DateTime.now() used by the utils
 * to enable deterministic test execution regardless of actual system time.
 * @param {number} year
 * @param {number} month
 * @param {number} day
 * @param {number} hour
 * @param {number} minute
 */
function setNow(year, month, day, hour, minute) {
  const dt = DateTime.fromObject(
    {
      year, month, day, hour, minute, second: 0, millisecond: 0,
    },
    { zone: TZ },
  );
  Settings.now = () => dt.toMillis();
}

beforeEach(() => {
  originalNow = Settings.now;
});

afterEach(() => {
  Settings.now = originalNow;
});

describe('getEarthHourDate / getEarthHourEnd', () => {
  it('returns last Saturday of March 20:30 for given year', () => {
    const d2024 = earthHourDate.getEarthHourDate(2024, TZ);
    const d2025 = earthHourDate.getEarthHourDate(2025, TZ);
    const d2026 = earthHourDate.getEarthHourDate(2026, TZ);

    assert.strictEqual(DateTime.fromJSDate(d2024).setZone(TZ).toFormat('yyyy-MM-dd HH:mm'), '2024-03-30 20:30');
    assert.strictEqual(DateTime.fromJSDate(d2025).setZone(TZ).toFormat('yyyy-MM-dd HH:mm'), '2025-03-29 20:30');
    assert.strictEqual(DateTime.fromJSDate(d2026).setZone(TZ).toFormat('yyyy-MM-dd HH:mm'), '2026-03-28 20:30');
  });

  it('getEarthHourEnd returns start + 1h for given year', () => {
    const start = earthHourDate.getEarthHourDate(2025, TZ);
    const end = earthHourDate.getEarthHourEnd(2025, TZ);
    assert.strictEqual(DateTime.fromJSDate(end).setZone(TZ).toFormat('yyyy-MM-dd HH:mm'), '2025-03-29 21:30');
    assert.strictEqual(DateTime.fromJSDate(end).toMillis() - DateTime.fromJSDate(start).toMillis(), 60 * 60 * 1000);
  });
});

describe('getThisYearsEarthHourStart / getThisYearsEarthHourEnd', () => {
  it('return this year’s EH window regardless of "now"', () => {
    setNow(2025, 3, 29, 20, 45);
    const start = earthHourDate.getThisYearsEarthHourStart(TZ);
    const end = earthHourDate.getThisYearsEarthHourEnd(TZ);
    assert.strictEqual(DateTime.fromJSDate(start).setZone(TZ).toFormat('yyyy-MM-dd HH:mm'), '2025-03-29 20:30');
    assert.strictEqual(DateTime.fromJSDate(end).setZone(TZ).toFormat('yyyy-MM-dd HH:mm'), '2025-03-29 21:30');
  });
});

describe('getUpcomingEarthHourStart / getUpcomingEarthHourEnd', () => {
  it('return this year when before this year’s EH start', () => {
    setNow(2025, 3, 29, 10, 0);
    const start = earthHourDate.getUpcomingEarthHourStart(TZ);
    const end = earthHourDate.getUpcomingEarthHourEnd(TZ);
    assert.strictEqual(DateTime.fromJSDate(start).setZone(TZ).toFormat('yyyy-MM-dd HH:mm'), '2025-03-29 20:30');
    assert.strictEqual(DateTime.fromJSDate(end).setZone(TZ).toFormat('yyyy-MM-dd HH:mm'), '2025-03-29 21:30');
  });

  it('return next year when at or after this year’s EH start', () => {
    setNow(2025, 3, 29, 20, 30);
    const start = earthHourDate.getUpcomingEarthHourStart(TZ);
    const end = earthHourDate.getUpcomingEarthHourEnd(TZ);
    assert.strictEqual(DateTime.fromJSDate(start).setZone(TZ).toFormat('yyyy-MM-dd HH:mm'), '2026-03-28 20:30');
    assert.strictEqual(DateTime.fromJSDate(end).setZone(TZ).toFormat('yyyy-MM-dd HH:mm'), '2026-03-28 21:30');
  });
});

describe('isCurrentlyEarthHour', () => {
  it('is false before 20:30 on EH day', () => {
    setNow(2025, 3, 29, 10, 0);
    assert.strictEqual(earthHourChecks.isCurrentlyEarthHour(TZ), false);
    setNow(2025, 3, 29, 20, 29);
    assert.strictEqual(earthHourChecks.isCurrentlyEarthHour(TZ), false);
  });

  it('is true during 20:30–21:30 on EH day', () => {
    setNow(2025, 3, 29, 20, 30);
    assert.strictEqual(earthHourChecks.isCurrentlyEarthHour(TZ), true);
    setNow(2025, 3, 29, 20, 45);
    assert.strictEqual(earthHourChecks.isCurrentlyEarthHour(TZ), true);
    setNow(2025, 3, 29, 21, 29);
    assert.strictEqual(earthHourChecks.isCurrentlyEarthHour(TZ), true);
  });

  it('is false at 21:30 and after on EH day', () => {
    setNow(2025, 3, 29, 21, 30);
    assert.strictEqual(earthHourChecks.isCurrentlyEarthHour(TZ), false);
    setNow(2025, 3, 29, 22, 0);
    assert.strictEqual(earthHourChecks.isCurrentlyEarthHour(TZ), false);
  });

  it('is false on non–EH days', () => {
    setNow(2025, 3, 28, 20, 45);
    assert.strictEqual(earthHourChecks.isCurrentlyEarthHour(TZ), false);
    setNow(2025, 4, 1, 20, 45);
    assert.strictEqual(earthHourChecks.isCurrentlyEarthHour(TZ), false);
  });
});

describe('isEarthHourDay', () => {
  it('is true all day on EH day', () => {
    setNow(2025, 3, 29, 0, 0);
    assert.strictEqual(earthHourChecks.isEarthHourDay(TZ), true);
    setNow(2025, 3, 29, 12, 0);
    assert.strictEqual(earthHourChecks.isEarthHourDay(TZ), true);
    setNow(2025, 3, 29, 23, 59);
    assert.strictEqual(earthHourChecks.isEarthHourDay(TZ), true);
  });

  it('is false on other days', () => {
    setNow(2025, 3, 28, 12, 0);
    assert.strictEqual(earthHourChecks.isEarthHourDay(TZ), false);
    setNow(2025, 3, 30, 12, 0);
    assert.strictEqual(earthHourChecks.isEarthHourDay(TZ), false);
    setNow(2025, 4, 1, 12, 0);
    assert.strictEqual(earthHourChecks.isEarthHourDay(TZ), false);
  });
});

describe('getMinutesUntilEarthHourStart', () => {
  it('is positive before EH start', () => {
    setNow(2025, 3, 29, 10, 0);
    const m = earthHourTime.getMinutesUntilEarthHourStart(TZ);
    assert.ok(m > 0, `expected positive, got ${m}`);
  });

  it('is negative during 20:30–21:30 (already started)', () => {
    setNow(2025, 3, 29, 20, 45);
    const m = earthHourTime.getMinutesUntilEarthHourStart(TZ);
    assert.ok(m < 0, `expected negative, got ${m}`);
    assert.ok(Math.abs(m) <= 60, `expected within 1h of start, got ${m}`);
  });

  it('is positive after EH end (next year’s start)', () => {
    setNow(2025, 3, 29, 22, 0);
    const m = earthHourTime.getMinutesUntilEarthHourStart(TZ);
    assert.ok(m > 0, `expected positive, got ${m}`);
  });
});

describe('getMinutesUntilEarthHourEnd', () => {
  it('is positive before EH end (includes during 20:30–21:30)', () => {
    setNow(2025, 3, 29, 10, 0);
    const mBefore = earthHourTime.getMinutesUntilEarthHourEnd(TZ);
    assert.ok(mBefore > 0, `expected positive, got ${mBefore}`);

    setNow(2025, 3, 29, 20, 45);
    const mDuring = earthHourTime.getMinutesUntilEarthHourEnd(TZ);
    assert.ok(mDuring > 0, `expected positive (minutes until 21:30), got ${mDuring}`);
    assert.ok(mDuring <= 60, `expected ≤60 min until end, got ${mDuring}`);
  });

  it('is positive after 21:30 on EH day (minutes until next year\'s end)', () => {
    setNow(2025, 3, 29, 21, 45);
    const m = earthHourTime.getMinutesUntilEarthHourEnd(TZ);
    assert.ok(m > 0, `expected positive (next year’s end), got ${m}`);
  });
});

describe('formatDateInTimezone', () => {
  it('formats Date as ISO in timezone with offset in brackets', () => {
    const d = earthHourDate.getEarthHourDate(2025, TZ);
    const s = dateFormat.formatDateInTimezone(d, TZ);
    assert.ok(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}\([^)]+\)$/.test(s), `expected ISO+offset pattern, got: ${s}`);
    assert.ok(s.includes('2025-03-29'), `expected date part, got: ${s}`);
    assert.ok(s.includes('20:30'), `expected time part, got: ${s}`);
    assert.ok(s.endsWith(')') && s.includes('('), `expected offset in brackets, got: ${s}`);
  });
});

describe('getOneMonthBeforeEarthHour', () => {
  it('returns 20:30 one month before Earth Hour for given year', () => {
    const d2024 = earthHourDate.getOneMonthBeforeEarthHour(2024, TZ);
    const d2025 = earthHourDate.getOneMonthBeforeEarthHour(2025, TZ);
    const d2026 = earthHourDate.getOneMonthBeforeEarthHour(2026, TZ);
    assert.strictEqual(DateTime.fromJSDate(d2024).setZone(TZ).toFormat('yyyy-MM-dd HH:mm'), '2024-02-29 20:30');
    assert.strictEqual(DateTime.fromJSDate(d2025).setZone(TZ).toFormat('yyyy-MM-dd HH:mm'), '2025-02-28 20:30');
    assert.strictEqual(DateTime.fromJSDate(d2026).setZone(TZ).toFormat('yyyy-MM-dd HH:mm'), '2026-02-28 20:30');
  });
});

describe('getOneWeekBeforeEarthHour', () => {
  it('returns 20:30 on the Saturday one week before EH', () => {
    const d = earthHourDate.getOneWeekBeforeEarthHour(2025, TZ);
    assert.strictEqual(DateTime.fromJSDate(d).setZone(TZ).toFormat('yyyy-MM-dd HH:mm'), '2025-03-22 20:30');
  });
});

describe('getOneDayBeforeEarthHour', () => {
  it('returns 20:30 on the Friday one day before EH', () => {
    const d = earthHourDate.getOneDayBeforeEarthHour(2025, TZ);
    assert.strictEqual(DateTime.fromJSDate(d).setZone(TZ).toFormat('yyyy-MM-dd HH:mm'), '2025-03-28 20:30');
  });
});

describe('getThirtyMinutesBeforeEarthHour', () => {
  it('returns 20:00 on EH day', () => {
    const d = earthHourDate.getThirtyMinutesBeforeEarthHour(2025, TZ);
    assert.strictEqual(DateTime.fromJSDate(d).setZone(TZ).toFormat('yyyy-MM-dd HH:mm'), '2025-03-29 20:00');
  });
});

describe('formatDateFriendly / formatDateFriendlyNoYear / formatTimeFriendly', () => {
  it('formatDateFriendly returns human-readable date with year', () => {
    const d = earthHourDate.getEarthHourDate(2025, TZ);
    const s = dateFormat.formatDateFriendly(d, TZ);
    assert.ok(s.includes('2025'), `expected year, got: ${s}`);
    assert.ok(s.includes('March') || s.includes('März') || s.includes('maart'), `expected month name, got: ${s}`);
  });

  it('formatDateFriendly uses ordinal and locale for en', () => {
    const d = earthHourDate.getEarthHourDate(2025, TZ);
    const s = dateFormat.formatDateFriendly(d, TZ, 'en');
    assert.ok(/^\d{1,2}(st|nd|rd|th) \w+ \d{4}$/.test(s), `expected "29th March 2025" style, got: ${s}`);
  });

  it('formatDateFriendly uses localized month for nl', () => {
    const d = earthHourDate.getEarthHourDate(2025, TZ);
    const s = dateFormat.formatDateFriendly(d, TZ, 'nl');
    assert.ok(/^\d{1,2} \w+ \d{4}$/.test(s), `expected "29 maart 2025" style, got: ${s}`);
    assert.ok(s.includes('maart'), `expected Dutch month, got: ${s}`);
  });

  it('formatDateFriendlyNoYear returns date without year', () => {
    const d = earthHourDate.getEarthHourDate(2025, TZ);
    const s = dateFormat.formatDateFriendlyNoYear(d, TZ);
    assert.ok(!/\d{4}/.test(s), `expected no year, got: ${s}`);
  });

  it('formatDateFriendlyNoYear uses ordinal and locale for en', () => {
    const d = earthHourDate.getEarthHourDate(2025, TZ);
    const s = dateFormat.formatDateFriendlyNoYear(d, TZ, 'en');
    assert.ok(/^\d{1,2}(st|nd|rd|th) \w+$/.test(s), `expected "28th March" style, got: ${s}`);
  });

  it('formatDateFriendlyNoYear uses localized month for nl', () => {
    const d = earthHourDate.getEarthHourDate(2025, TZ);
    const s = dateFormat.formatDateFriendlyNoYear(d, TZ, 'nl');
    assert.ok(/^\d{1,2} \w+$/.test(s), `expected "28 maart" style, got: ${s}`);
    assert.ok(s.includes('maart'), `expected Dutch month, got: ${s}`);
  });

  it('formatTimeFriendly returns HH:mm', () => {
    const d = earthHourDate.getEarthHourDate(2025, TZ);
    const s = dateFormat.formatTimeFriendly(d, TZ);
    assert.strictEqual(s, '20:30');
  });
});

describe('flow conditions: Earth Hour starts in / ends in', () => {
  it('"starts in" is true only when 0 ≤ minutesUntil ≤ target', () => {
    setNow(2025, 3, 29, 20, 25);
    const minStart = earthHourTime.getMinutesUntilEarthHourStart(TZ);
    assert.ok(minStart >= 0 && minStart <= 10, `~5 min until start: ${minStart}`);

    setNow(2025, 3, 29, 20, 45);
    const minStartDuring = earthHourTime.getMinutesUntilEarthHourStart(TZ);
    assert.ok(minStartDuring < 0, `during EH, starts-in should be negative: ${minStartDuring}`);
  });

  it('"starts in" with unit hours uses amount * 60 as target minutes', () => {
    setNow(2025, 3, 29, 20, 25);
    const minutesUntil = earthHourTime.getMinutesUntilEarthHourStart(TZ);
    const targetMinutes = (args) => (args.unit === 'hours' ? args.amount * 60 : args.amount);
    const inWindow = (m, t) => m >= 0 && m <= t;

    assert.strictEqual(targetMinutes({ unit: 'hours', amount: 1 }), 60);
    assert.strictEqual(inWindow(minutesUntil, 60), true, '~5 min ≤ 60 min');

    assert.strictEqual(targetMinutes({ unit: 'hours', amount: 0 }), 0);
    assert.strictEqual(inWindow(minutesUntil, 0), false, '~5 min > 0 min');
  });

  it('"ends in" is true when 0 ≤ minutesUntil ≤ target during EH', () => {
    setNow(2025, 3, 29, 20, 45);
    const minEnd = earthHourTime.getMinutesUntilEarthHourEnd(TZ);
    assert.ok(minEnd >= 0 && minEnd <= 60, `~45 min until end: ${minEnd}`);
  });
});
