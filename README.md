# 🚗 DriveFlow AI Agent v5.0

**Production-ready AI lead qualification system voor rijscholen.**

## ⚡ Quick Start

### Lokaal (zonder Docker)

```bash
# 1. Dependencies
npm install

# 2. Environment
cp .env.example .env
# Vul OPENAI_API_KEY in (rest is optioneel)

# 3. Start (met Redis lokaal of in Docker)
docker-compose up -d redis  # of: redis-server
npm run dev

# 4. Test
curl -X POST http://localhost:3000/test/mock \
  -H "Content-Type: application/json" \
  -d '{"naam":"Jan","telefoon":"0612345678"}'
```

**Response:**
```json
{
  "mock": true,
  "score": 9,
  "bericht": "Hoi Jan, mock antwoord 🚗"
}
```

### Echte webhook (met AI)

```bash
curl -X POST http://localhost:3000/webhook/new-lead \
  -H "Content-Type: application/json" \
  -d '{"naam":"Klaas","telefoon":"0612345678","vraag":"Spoedcursus?"}'
```

**Response (202 Accepted):**
```json
{
  "status": "accepted",
  "jobId": "job-12345"
}
```

## 📋 API Endpoints

- `GET /health` — Status check
- `POST /webhook/new-lead` — Nieuwe lead (async queue)
- `POST /test/mock` — Test zonder AI

## 🔧 Environment Variables

Verplicht:
- `OPENAI_API_KEY` — van openai.com

Optioneel:
- `AIRTABLE_API_KEY` + `AIRTABLE_BASE_ID` — voor Airtable sync
- `MAKE_WEBHOOK_URL` — voor WhatsApp via Make.com
- `REDIS_URL` — Redis connection (default: localhost:6379)

## 🐳 Docker

```bash
docker-compose up -d redis
```

## 📦 Deployment (Render/Heroku)

1. Push naar GitHub
2. Maak Redis instance aan
3. Zet env vars: `OPENAI_API_KEY`, `REDIS_URL`, etc.
4. Deploy!

## 🧪 Testen

```bash
npm test  # later toevoegen
```

---

**Gebouwd voor Nederlandse rijscholen** ✨
