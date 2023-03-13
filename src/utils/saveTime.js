const moment = require("moment");

const saveTime = async (document, field, timeZone) => {
  if (!moment.tz.names().includes(timeZone)) timeZone = "UTC";

  document[field] = moment.tz(document[field], timeZone).toDate();
};

module.exports = saveTime;
