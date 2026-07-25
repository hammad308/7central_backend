// Simple implementation – you may already have this
const dayjs = require('dayjs');

/**
 * Count number of days between two dates (inclusive).
 */
const countDatesInARange = (start, end) => {
  const startDate = dayjs(start).startOf('day');
  const endDate = dayjs(end).startOf('day');
  const diff = endDate.diff(startDate, 'day') + 1;
  return diff > 0 ? diff : 0;
};

/**
 * Sum days of leave documents that fall within a range.
 */
const countLeaveDaysInARange = (leaves, rangeStart, rangeEnd) => {
  let total = 0;
  for (const leave of leaves) {
    const lStart = dayjs(leave.startDate).startOf('day');
    const lEnd = dayjs(leave.endDate).startOf('day');
    const overlapStart = lStart.isBefore(dayjs(rangeStart)) ? dayjs(rangeStart) : lStart;
    const overlapEnd = lEnd.isAfter(dayjs(rangeEnd)) ? dayjs(rangeEnd) : lEnd;
    if (!overlapEnd.isBefore(overlapStart)) {
      total += overlapEnd.diff(overlapStart, 'day') + 1;
    }
  }
  return total;
};

module.exports = { countDatesInARange, countLeaveDaysInARange };