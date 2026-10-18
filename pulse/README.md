# Pulse

Timer a intervalli per **Amazfit Balance 2 XT**: stretching, plank, ripetute di corsa e
qualsiasi allenamento lavoro/riposo. Ispirato a Timer Plus (VGFIT).

- appId: `23477` · API level: 4.0 · schermo: round 480x480 · versione 0.1.0
- Stato: ✅ funziona nel simulatore · 📱 vibrazioni e uso reale da verificare sul device
- Icona: cronometro bianco su verde (`private/scripts/make-pulse-icon.ps1`)

## Cosa fa

- **Lista timer** salvati (nome + riassunto `8×30s · 2 serie · 12:40`), bottone **+ Nuovo**.
  Preset al primo avvio: Stretching, Plank, Ripetute.
- **Dettaglio timer**: durata totale, **Avvia**, parametri modificabili, **Rinomina**
  (tastiera di sistema, anche toccando il nome), **Elimina** (con conferma).
- **Parametri** (passo 1 s, modificabili con −/+ o corona, salvati con OK):

  | Campo | Range |
  |---|---|
  | Preparazione | 0–60 s |
  | Lavoro | 1–600 s |
  | Riposo | 0–300 s |
  | Ripetizioni | 1–50 |
  | Serie | 1–20 |
  | Riposo serie | 0–600 s (se 0, tra le serie si usa il Riposo normale) |
  | Tempo extra | 1–60 s (default 5): quanto aggiunge il pulsante **+** in allenamento |

- **Allenamento**: anello sul bordo che si svuota, colore per fase (arancio preparati, verde
  lavoro, blu riposo, viola riposo serie), numero grande, ripetizione/serie (nelle pause mostra
  la prossima), tempo totale rimanente, ora attuale in alto (formato 12/24h di sistema).
  - **+Ns** (cerchio a sinistra del numero): allunga la fase in corso del Tempo extra, a ogni
    tocco; funziona anche in pausa.
  - **>>** salta (cerchio a destra del numero): chiude subito la fase in corso e passa alla successiva (sull'ultima termina
    la sessione); funziona anche in pausa.
  - **Pausa/Riprendi** (anche toccando il numero o con il tasto SELECT): sfondo ambra scuro,
    anello grigio, numero lampeggiante.
  - **Stop**, tasto BACK e swipe a destra chiedono conferma.
- **Vibrazioni**: lunga a inizio lavoro, doppia a inizio riposo, tick a 3-2-1 s dalla fine di
  ogni fase, quattro forti a fine allenamento.
- Schermo sempre acceso durante l'allenamento.

## Struttura

```
lib/engine.js     motore puro: buildPhases(timer) → fasi; stateAt(fasi, ms) → fase corrente
lib/timers.js     modello timer, FIELDS (range), CRUD su LocalStorage, preset
lib/format.js     formattazione durate e riassunto
lib/cues.js       vibrazioni
lib/theme.js      colori (fasi, pausa, card)
lib/ui.js         createCard(): card toccabile con titolo + valore/sottotitolo
page/index.js     lista timer
page/detail.js    dettaglio, rinomina, elimina
page/edit.js      modifica di un campo (−/+, corona)
page/run.js       esecuzione allenamento
page/*.r.layout.js, page/i18n/*.po
```

Il tempo è sempre calcolato da `Date.now()` (inizio − pause), quindi non accumula ritardi.
Il motore è separato dalla UI per poterlo riusare in un servizio in background.

## Prossimi passi

- **Modalità schermo spento**: App Service in background che gestisce timer e vibrazioni,
  + interruttore "schermo acceso sì/no" prima dell'avvio (a schermo spento il sistema chiude
  l'app dopo ~10 s, quindi oggi lo schermo resta acceso).
- Verifiche sul device: intensità/riconoscibilità delle vibrazioni, tasti fisici
  (SELECT = pausa, BACK = conferma stop).
