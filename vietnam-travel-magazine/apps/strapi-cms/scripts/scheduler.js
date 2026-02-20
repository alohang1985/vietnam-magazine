const cron = require('node-cron');
const { pipelineRun } = require('./daily_pipeline');
const { run: publishRun } = require('./publish_job');
require('dotenv').config();

const PUBLISH_TIME = process.env.PUBLISH_TIME || '09:30';
const [ph, pm] = PUBLISH_TIME.split(':').map(Number);

// schedule daily_pipeline at 07:00 server time
cron.schedule('0 7 * * *', () => {
  console.log('Scheduled: pipelineRun at 07:00');
  pipelineRun().catch(e=>console.error(e));
});

// schedule publish_job at PUBLISH_TIME
cron.schedule(`${pm} ${ph} * * *`, () => {
  console.log('Scheduled: publishRun at', PUBLISH_TIME);
  publishRun().catch(e=>console.error(e));
});

console.log('Scheduler started.');
