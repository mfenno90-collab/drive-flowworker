const axios = require('axios');
const logger = require('./core/logger');

async function sendWhatsApp(phoneNumber, message) {
  const num = phoneNumber
    .replace(/[^0-9]/g, '')
    .replace(/^0/, '31');
  if (process.env.MAKE_WEBHOOK_URL) {
    try {
      await axios.post(
        process.env.MAKE_WEBHOOK_URL,
        { telefoon: num, bericht: message },
        { timeout: 10000 }
      );
      logger.info({ phone: num }, 'WhatsApp via Make.com');
      return { method: 'make', success: true };
    } catch (e) {
      logger.warn(e.message, 'Make webhook failed');
    }
  }
  logger.info({ phone: num, message }, 'WhatsApp niet verzonden (geen config)');
  return { method: 'log_only', success: false };
}

module.exports = { sendWhatsApp };
