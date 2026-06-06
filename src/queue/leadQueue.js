const { Queue } = require('bullmq');
const IORedis = require('ioredis');
const { config } = require('../core/config');

const connection = new IORedis(config.REDIS_URL, {
  maxRetriesPerRequest: null,
});

const leadQueue = new Queue('lead-processing', {
  connection,
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: 'exponential', delay: 1000 },
  },
});

module.exports = { leadQueue, connection };
