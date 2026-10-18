# Hello World

Primo mini program Zepp OS per **Amazfit Balance 2 XT**. Serve come prova minima della
procedura di sviluppo e, all'arrivo dell'orologio, dell'**installazione sul device**.

- appId: `23475` · API level: 4.0 · schermo: round 480x480
- Stato: ✅ funziona nel simulatore (live reload verificato) · 📱 da provare sul device

## Cosa fa

Una pagina con:
- saluto tradotto (i18n `en-US` / `it-IT`);
- nome del device e risoluzione (`getDeviceInfo()`, permesso `data:os.device.info`);
- contatore incrementato da un bottone.

## Struttura

```
app.json                 manifest (appId, permessi, pagine)
app.js                   entry point
page/index.js            UI
page/index.r.layout.js   coordinate per schermo round
page/i18n/*.po           stringhe
app-side/, setting/      generati da zeus, non usati
```

## Comandi

```powershell
zeus dev       # simulatore (scegliere "Amazfit Balance 2")
zeus preview   # QR code per installare sul device dalla Zepp app (Developer Mode)
zeus build     # pacchetto .zab in dist/
```
