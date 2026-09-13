# Strava-oppsett

Dashboardet leser bare fra tabellen `activities`. Gammel `Zapier`-data brukes ikke.

## 1. Strava-app

1. Ha et Strava-abonnement.
2. Opprett appen på https://www.strava.com/settings/api
3. Authorization Callback Domain: Vercel-domenet i prod, f.eks. `din-app.vercel.app` (uten `https://`). `localhost` bare når du tester lokalt — venner må ha prod-domenet, ellers sendes de til localhost.
4. Oppgrader til 10 utøvere i API-dashboardet.
5. Søk Extended Access for alle 13. Inntil det er godkjent kan bare 10 koble til.

## 2. Supabase

Kjør SQL-en i `supabase/migrations/20260313_strava.sql` i SQL-editoren.

Kopier `SUPABASE_SERVICE_ROLE_KEY` fra Project Settings → API. Den skal aldri i nettleseren.

## 3. Miljøvariabler

Se `.env.example`. Sett de samme på Vercel.

På Vercel, ikke lim inn localhost-verdier fra `.env.local`.

`NEXT_PUBLIC_APP_URL` i prod:

`https://<ditt-domene>`

`STRAVA_REDIRECT_URI` i prod:

`https://<ditt-domene>/api/strava/callback`

`STRAVA_CONNECT_PIN` er den felles koden vennene skriver på `/koble-til`.

`CRON_SECRET` er en tilfeldig streng. Vercel sender den som `Authorization: Bearer <CRON_SECRET>` mot `/api/strava/sync`.

## 4. Webhook

Etter deploy, én gang:

```bash
curl -X POST "https://<ditt-domene>/api/strava/webhook/subscribe" \
  -H "Authorization: Bearer <CRON_SECRET>"
```

Strava kaller `GET /api/strava/webhook` for å verifisere, deretter `POST` når noen logger en økt.

## 5. Test

1. `npm run dev`
2. Åpne `/koble-til`, skriv PIN, koble til med din Strava-konto.
3. Sjekk at `strava_athletes` og `activities` fylles.
4. Send lenken og PIN til gjengen.
