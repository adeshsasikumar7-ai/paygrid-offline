# PayGrid-Offline

Offline-first prepaid/postpaid power app with resident and worker apps, live sync and a meter simulator (`/simulator`).

## Links

| Where | Address | Who can open it |
| --- | --- | --- |
| This repository | https://github.com/adeshsasikumar7-ai/paygrid-offline | anyone |

| Live app | https://wonder-workshop-wander.lovable.app | anyone |

## Pages

| Path | What it is |
| --- | --- |
| `/` | Landing page |
| `/app` | Resident app — balance, relay, live watts, recharge, history |
| `/worker` | Worker app — meter list, doorstep collection, tamper queue |
| `/simulator` | Meter simulator — post readings like a real ESP32 device |

## Demo access

Every page opens with one click using the **Open demo** button — no sign-up needed.

- Worker code: `AGENT2026`
- Demo meters: `PG-ESP32-001`, `PG-ESP32-002`, `PG-ESP32-003`
- Device keys: `dev-key-001`, `dev-key-002`, `dev-key-003`

## Development

You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone https://github.com/adeshsasikumar7-ai/paygrid-offline.git
cd paygrid-offline
npm i
npm run dev
```

## Notes

- `.env` holds only the public backend address and publishable key — no private keys.
- Every change made in the Lovable editor is committed straight to this repository once Git sync is connected.
