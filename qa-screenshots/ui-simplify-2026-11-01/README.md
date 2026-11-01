# Local UI QA evidence

375×844, 390×844, 1440×1000. `before-*` and `after-*` show the actual Expo web app, not HTML mockups. The backend used an isolated PostgreSQL database on loopback port 15432 and Redis on 16379; no production database connections were used. LOCAL_QA_FIXTURE is a deliberately marked article for layout and navigation checks, not a real market report. Market providers were disabled or pointed to loopback port 9. QA credentials and tokens are absent from these artifacts.

`flow-verification.json` records successful UI login → home → article → judgement → completion reload → history → detail reload, invalid identifier and missing record checks, and browser exception count. The screenshots show the pending outcome, not an invented graded result. The before/after history comparison was captured before creating that local judgement so the same empty-data state is compared.
