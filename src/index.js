require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const { body, validationResult } = require('express-validator');
const { config } = require('./core/config');
const logger = require('./core/logger');
const { leadQueue } = require('./queue/leadQueue');
const { worker } = require('./workers/leadWorker');

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) =>
  res.json({ status: 'ok', version: '5.0.1', timestamp: new Date().toISOString() })
);

const validateLead = [
  body('naam')
    .notEmpty()
    .isLength({ min: 2 }),
  body('telefoon')
    .notEmpty()
    .matches(/^[0-9\s\+]{10,15}$/),
];

app.post('/webhook/new-lead', validateLead, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ errors: errors.array() });
  const lead = req.body;
  try {
    const job = await leadQueue.add('process-lead', { lead });
    res.status(202).json({ status: 'accepted', jobId: job.id });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: 'Queue error' });
  }
});

// Mock test endpoint
app.post('/test/mock', (req, res) => {
  res.json({
    mock: true,
    score: 9,
    bericht: `Hoi ${req.body.naam || 'klant'}, mock antwoord 🚗`,
  });
});

const PORT = config.PORT;
app.listen(PORT, () => logger.info(`API on port ${PORT}`));

// Graceful shutdown
process.on('SIGTERM', async () => {
  await worker.close();
  await leadQueue.close();
  process.exit(0);
});

module.exports = app;
