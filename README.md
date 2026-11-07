# Amazfit apps

Mini program **Zepp OS** per lo smartwatch **Amazfit Balance 2 XT** (API level 4.0, schermo
round 480x480; girano anche sugli altri Zepp OS round 480). Sviluppati con la CLI
[zeus](https://docs.zepp.com/docs/guides/quick-start/) e il simulatore Zepp.

| App | Cosa fa | Stato |
|---|---|---|
| [hello-world](hello-world/) | Primo mini program, prova della toolchain | ✅ simulatore · ✅ orologio |
| [sensor-lab](sensor-lab/) | Letture live dei sensori (battito, GPS, bussola, barometro...) | ✅ simulatore · ✅ orologio |
| [pulse](pulse/) | Timer a intervalli (stretching, plank, ripetute) | ✅ simulatore · ✅ orologio |
| [score](score/) | Segnapunti: padel, calcio con timer cambi, carte (a punti, a eliminazione, burraco, canasta), giochi da tavolo (Catan, Carcassonne, Ticket to Ride e Europa, 7 Wonders Duel, Puerto Rico), dadi | ✅ simulatore · ✅ orologio |
| [waypoint](waypoint/) | Segnaposto: salva un posto e riportami lì, QR per Google Maps | ✅ simulatore · ✅ orologio |
| [checklist](checklist/) | Liste incollate dal telefono (impostazioni nella Zepp app), spuntate sull'orologio | ✅ orologio |

Ogni app ha il suo `README.md` (funzioni, struttura, prossimi passi).

## Uso

```bash
cd <app>
npm install     # tipi dell'SDK (@zeppos/device-types)
zeus dev        # simulatore avviato prima; scegliere "Amazfit Balance 2"
zeus build      # pacchetto .zab in dist/
zeus preview    # QR da scansionare con la Zepp app in Developer Mode → installa sull'orologio
```

## Licenza

[MIT](LICENSE)
