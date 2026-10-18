# Sensor Lab

App di esplorazione che mostra in tempo reale i dati dei sensori dell'**Amazfit Balance 2 XT**,
per capire cosa è leggibile da un mini program e con che qualità.

- appId: `23476` · API level: 4.0 · schermo: round 480x480 · versione 0.1.0
- Stato: ✅ navigazione e UI funzionano nel simulatore · 📱 dati reali da verificare sul device
- Icona: onda di battito su blu (`private/scripts/make-sensorlab-icon.ps1`)

## Cosa fa

- **Home**: un bottone per sensore.
- **Card sensore**: scorrendo a destra/sinistra si passa da un sensore all'altro
  (swiper orizzontale nativo, funziona anche con la corona). Ordine:
  1. Battito — live, ultimo, a riposo
  2. Altimetro — altitudine, pressione
  3. Temperatura — temperatura della **pelle** (solo da indossato, nessuna API ambiente)
  4. GPS — stato fix, lat/lon, satelliti, tempo al fix
  5. Bussola — direzione, punto cardinale, calibrazione
  6. SpO2 — misura su richiesta (bottone "Misura"), media 24 h
  7. Accelerometro — x/y/z in m/s²
  8. Giroscopio — x/y/z in °/s
  9. Attività — passi, calorie, distanza, stress, batteria, stato indossato
- Per tornare alla lista: pulsante `≡ n/9` sopra il titolo, swipe giù, o tasto BACK.

## Scelte di progetto

- È attivo **solo il sensore della card visibile**; viene fermato quando si scorre via o si esce
  (batteria: battito, GPS, SpO2).
- Schermo tenuto acceso 5 minuti nelle card.
- Ogni sensore parte in try/catch: se manca (device o simulatore) la card mostra "Non disponibile".

## Struttura

```
app.json                   permessi di tutti i sensori, pagine index + sensors
lib/sensors.js             definizioni card: { key, rows, action?, start(ui) → { stop, action? } }
page/index.js              lista sensori
page/sensors.js            swiper orizzontale, una card per sensore
page/*.r.layout.js         layout round
page/i18n/*.po             stringhe
```

Per aggiungere un sensore: nuova voce in `SENSORS` (`lib/sensors.js`), permesso in `app.json`,
stringhe nei `.po`.

## Da verificare sul device

- Valori reali di ogni sensore; presenza della temperatura pelle sull'XT.
- Swipe giù sulle card: possibile conflitto con il centro di controllo di sistema.
- Apertura di una card dalla lista diversa dalla prima (`swipeToIndex`).
