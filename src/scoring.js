const config = require('../config');

function calculateScore(stats) {
  const w = config.SCORE_WEIGHTS;
  const presenceHours = stats.presenceSeconds / 3600;
  const supportVcHours = stats.supportVcSeconds / 3600;

  const score =
    stats.messages * w.messagePoint +
    presenceHours * w.presenceHourPoint +
    supportVcHours * w.supportVcHourPoint +
    stats.modActions * w.modActionPoint +
    stats.events * w.eventPoint;

  return Math.round(score);
}

function formatHours(seconds) {
  const hours = seconds / 3600;
  return `${hours.toFixed(hours < 10 ? 1 : 0)}h`;
}

module.exports = { calculateScore, formatHours };
