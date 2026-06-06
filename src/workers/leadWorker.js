const { Worker } = require('bullmq');
const { connection } = require('../queue/leadQueue');
const logger = require('../core/logger');
const { processLead } = require('../ai');
const { upsertLead } = require('../airtable');
const { sendWhatsApp } = require('../whatsapp');

const worker = new Worker(
  'lead-processing',
  async (job) => {
    const { lead } = job.data;
    logger.info({ jobId: job.id, lead: lead.naam }, 'Start');
    const ai = await processLead(lead);
    const airtable = await upsertLead(lead, ai);
    let whatsapp = null;
    if (ai.urgentie === 'hoog' || ai.score >= 7) {
      whatsapp = await sendWhatsApp(lead.telefoon, ai.whatsapp_bericht);
    }
    return { ai, airtable, whatsapp };
  },
  { connection, concurrency: 5 }
);

worker.on('failed', (job, err) => logger.error({ err }, 'Job failed'));

module.exports = { worker };
