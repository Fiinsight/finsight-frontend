# FinSight Frontend

React Native + Expo Go mobile app for the FinSight MVP.

## Screens To Build First

1. Home: domestic market status and today's 3 key news cards.
2. News detail: beginner, normal, and analyst summaries.
3. Term popup: contextual economic term explanation.
4. Judgement: UP / NEUTRAL / DOWN selection with reason.
5. Feedback: AI explanation based on judgement and market result.
6. Chart docent: stock chart with connected news events.

## Run

```bash
npm install
npm run start
```

Then scan the QR code with Expo Go.

## Backend URL For Expo Go

When testing on a real phone, do not use `localhost` for the backend. `localhost` points to the phone itself, not your Mac.

Create `.env` from `.env.example` and set your Mac's local IP:

```bash
cp .env.example .env
```

Example:

```text
EXPO_PUBLIC_API_BASE_URL=http://192.168.0.10:8080/api
```

If the app does not pick up a changed env value, restart Expo with:

```bash
npm run start:clear
```
