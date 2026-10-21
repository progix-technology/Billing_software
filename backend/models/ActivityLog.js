const { createModel } = require('../config/nedbAdapter');

const ActivityLog = createModel('activitylogs');

module.exports = ActivityLog;
