const Airtable = require('airtable');
const logger = require('./core/logger');
const { config } = require('./core/config');

let base = null;
if (config.AIRTABLE_API_KEY && config.AIRTABLE_BASE_ID) {
  base = new Airtable({ apiKey: config.AIRTABLE_API_KEY }).base(
    config.AIRTABLE_BASE_ID
  );
}

async function upsertLead(leadData, ai) {
  if (!base) {
    logger.warn('Airtable niet geconfigureerd, alleen log');
    return { action: 'skipped', reason: 'no_airtable' };
  }
  const table = config.AIRTABLE_TABLE_NAME;
  const fields = {
    Naam: leadData.naam,
    Telefoon: leadData.telefoon,
    Email: leadData.email || '',
    Vraag: leadData.vraag || '',
    Score: ai.score,
    Urgentie: ai.urgentie,
    Serieus: ai.is_serieus ? 'Ja' : 'Nee',
    Pakket: ai.aanbevolen_pakket,
    WhatsApp_Bericht: ai.whatsapp_bericht,
    Volgende_Actie: ai.volgende_actie,
    Reden: ai.reden,
    Laatste_Contact: new Date().toISOString(),
  };
  try {
    const existing = await base(table)
      .select({
        filterByFormula: `{Telefoon} = "${leadData.telefoon}"`,
        maxRecords: 1,
      })
      .firstPage();
    if (existing.length > 0) {
      await base(table).update(existing[0].id, { fields });
      return { action: 'updated', recordId: existing[0].id };
    } else {
      fields.Status = 'Nieuw';
      fields.Aangemeld_Op = new Date().toISOString();
      const rec = await base(table).create({ fields });
      return { action: 'created', recordId: rec.id };
    }
  } catch (error) {
    logger.error(error, 'Airtable fout');
    return { action: 'failed', error: error.message };
  }
}

async function getLeads(maxRecords = 100) {
  if (!base) return [];
  try {
    return await base(config.AIRTABLE_TABLE_NAME)
      .select({
        maxRecords,
        sort: [{ field: 'Aangemeld_Op', direction: 'desc' }],
      })
      .firstPage();
  } catch {
    return [];
  }
}

async function updateLeadStatus(recordId, status) {
  if (!base) return;
  await base(config.AIRTABLE_TABLE_NAME).update(recordId, {
    fields: { Status: status },
  });
}

module.exports = { upsertLead, getLeads, updateLeadStatus };
