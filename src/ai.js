const { OpenAI } = require('openai');
const logger = require('./core/logger');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 15000,
});

async function processLead(data) {
  const prompt = `Je bent de back-office assistent van een rijschool.
Analyseer deze lead: ${JSON.stringify(data, null, 2)}

Geef ALLEEN JSON terug met:
{ "is_serieus": boolean, "score": number(1-10), "urgentie": "laag"|"midden"|"hoog",
  "aanbevolen_pakket": "starter"|"intensief"|"spoedcursus"|"opfriscursus",
  "reden": string, "whatsapp_bericht": string, "volgende_actie": string }`;

  try {
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      response_format: { type: 'json_object' },
      max_tokens: 500,
    });
    const parsed = JSON.parse(completion.choices[0].message.content);
    if (typeof parsed.is_serieus !== 'boolean' || typeof parsed.score !== 'number') {
      throw new Error('Ongeldige AI response');
    }
    return parsed;
  } catch (error) {
    logger.error({ error, lead: data.naam }, 'AI fallback');
    return {
      is_serieus: true,
      score: 5,
      urgentie: 'midden',
      aanbevolen_pakket: 'starter',
      reden: 'Fallback',
      whatsapp_bericht: `Bedankt ${data.naam}, we nemen snel contact op. 🚗`,
      volgende_actie: 'Bel de lead op',
    };
  }
}

async function generateFollowUp(leadData, previousAnalysis, daysSinceContact) {
  try {
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: `Schrijf een kort follow-up WhatsApp (max 2 zinnen) voor: ${JSON.stringify(
            leadData
          )}, ${daysSinceContact} dagen geleden contact. Alleen de tekst.`,
        },
      ],
      temperature: 0.6,
      max_tokens: 120,
    });
    return response.choices[0].message.content.trim();
  } catch {
    return `Hoi ${leadData.naam}, nog vragen over onze rijlessen?`;
  }
}

module.exports = { processLead, generateFollowUp };
