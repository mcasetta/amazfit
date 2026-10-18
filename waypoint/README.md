# Waypoint (Segnaposto)

Salva un posto (auto parcheggiata, inizio sentiero, ombrellone) e ti riporta lì con distanza e
direzione. Per **Amazfit Balance 2 XT**.

- appId: `23479` · API level: 4.0 · schermo: round 480x480 · versione 0.1.0
- Stato: ✅ compila · ✅ provata nel simulatore (2026-10-18) · 📱 da provare all'aperto con
  l'orologio
- Icona: segnaposto arancione con anello e indicatore (`private/scripts/make-waypoint-icon.ps1`)
- Permessi: `device:os.local_storage`, `device:os.geolocation`, `device:os.compass`

## Cosa fa

- **Home**: **Salva qui** e **Importa** in alto, poi i posti salvati (il più recente in cima) con data e ora.
- **Salva qui**: accende il GPS e aspetta il fix (mostra i satelliti usati/visti e "Meglio
  all'aperto"); quando la posizione è trovata compare **Salva**, che la memorizza come
  "Punto N" e torna alla lista. Un tocco solo: il nome si cambia dopo.
- **Importa**: tastiera **numerica** di sistema per scrivere le coordinate, come le mostra Google Maps
  (tenere premuto un punto sulla mappa → coordinate in alto, copiabili): `45.46420, 9.19000`.
  Accetta anche `45.4642 9.19`, `45.4642 N 9.19 E` (S/W/O = negative), virgole decimali
  (`45,4642 9,19` o `45,4642, 9,19`) e un link Maps con `@lat,lon`. Non i gradi/primi/secondi.
  Se la tastiera non permette di separare due numeri basta scrivere la latitudine: la tastiera si
  riapre ("Ora la longitudine") per la seconda. 📱 Da verificare quali tasti ha la tastiera
  numerica (punto/virgola, meno, spazio): nei tipi SDK non è documentato.
  Coordinate valide → nuovo "Punto N" e si apre la sua pagina; altrimenti "Coordinate non valide".
- **Pagina del posto** (tocco sulla lista):
  - nome in alto, **distanza** grande (`230 m`, `1,4 km`), sotto il punto cardinale e i gradi
    verso il posto (`NE 45°`);
  - **indicatore arancione sull'anello** del bordo: punta verso il posto rispetto alla parte alta
    dell'orologio (tenere l'orologio davanti, con le 12 in avanti). Serve la bussola calibrata:
    se non lo è l'indicatore sparisce e compare "Bussola: muovi il polso a 8" (restano punto
    cardinale e gradi);
  - entro **15 m**: distanza in verde, "Sei arrivato" e una vibrazione (di nuovo solo dopo
    essersi allontanati oltre 30 m);
  - **Rinomina** (tastiera), **Maps** ed **Elimina** (con conferma).
- **Maps**: QR code a tutto schermo con il link alle indicazioni a piedi di Google Maps
  (`https://www.google.com/maps/dir/?api=1&destination=lat,lon&travelmode=walking`): si
  inquadra con la fotocamera del telefono e si apre Maps già pronto a portarti lì (o il
  browser se Maps non c'è). Funziona anche per mandare il posto a qualcun altro. Schermo acceso
  durante la scansione.
- Schermo acceso mentre si cerca il GPS o si naviga (altrimenti il sistema chiude l'app);
  GPS e bussola si spengono uscendo dalla pagina.
- Fino a 30 posti; oltre, il più vecchio viene tolto.

## Struttura

```
lib/geo.js        distanza (haversine), rotta, angolo relativo, punto cardinale, formato distanza,
                  lettura coordinate scritte a mano, link Google Maps
lib/points.js     LocalStorage: posti salvati { id, name, lat, lon, savedAt }
lib/sensors.js    GPS (watchPosition), bussola (watchHeading), schermo acceso, vibrazione
lib/theme.js      colori (accento arancione)
lib/ui.js         createCard() (copiata da pulse)
page/index.js     home: Salva qui + lista
page/save.js      attesa fix GPS e salvataggio
page/point.js     navigazione verso il posto: anello, distanza, direzione, rinomina, Maps, elimina
page/qr.js        QR code con il link Google Maps del posto
```

## Prossimi passi

- Prova nel simulatore e poi all'aperto (tempo del primo fix, precisione, bussola).
- Possibili: salvare anche la quota (barometro), freccia anche senza bussola usando la
  direzione di marcia, pagina impostazioni nella Zepp app per importare incollando coordinate/link e "Apri in Maps"
  (serve il canale orologio-telefono), nome a voce.
