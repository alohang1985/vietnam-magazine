const fs = require('fs');
const path = require('path');
const LOG_PATH = path.join(__dirname, '../../logs');
if (!fs.existsSync(LOG_PATH)) fs.mkdirSync(LOG_PATH, { recursive: true });

function ts() { return new Date().toISOString(); }

function write(name, msg) {
  const file = path.join(LOG_PATH, name + '.log');
  fs.appendFileSync(file, `${ts()} ${msg}\n`);
}

function writeDailyReport(entry) {
  const date = new Date().toISOString().slice(0,10);
  const file = path.join(LOG_PATH, `daily_report_${date}.json`);
  let arr = [];
  if (fs.existsSync(file)) {
    try { arr = JSON.parse(fs.readFileSync(file,'utf8')); } catch(e){ arr = []; }
  }
  arr.push(Object.assign({ ts: ts() }, entry));
  fs.writeFileSync(file, JSON.stringify(arr, null, 2));
}

module.exports = {
  info: (msg) => { console.log(msg); write('pipeline-info', msg); },
  error: (msg) => { console.error(msg); write('pipeline-error', typeof msg === 'string' ? msg : JSON.stringify(msg)); },
  report: (entry) => writeDailyReport(entry)
};
