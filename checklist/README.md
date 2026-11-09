# Checklist

Liste (spesa, ferramenta, valigia...) **incollate dal telefono** e **spuntate sull'orologio**
Amazfit Balance 2 XT. Prima app del workspace che parla con il telefono.

- Permessi: `device:os.local_storage`
- appId: `23480` · API level: 4.0 · schermo: round 480x480 · versione 0.1.5
- Dipendenza: [`@zeppos/zml`](https://www.npmjs.com/package/@zeppos/zml) 0.0.43 (messaggi
  orologio ↔ telefono) → `npm install` prima di `zeus dev/build/preview`
- Stato: ✅ funziona (v0.1.5, 2026-11-09) · 📱 da provare col telefono lontano
- Icona: tre righe di lista, due spuntate (`private/scripts/make-checklist-icon.ps1`)

## Come si usa

1. Installare l'app sull'orologio (`zeus preview`).
2. Telefono: Zepp app → Dispositivo → elenco app (Mini App / Le mie app) → **Checklist** →
   impostazioni. Toccare **+ Nuova lista** e incollare il testo, ad esempio:

   ```
   Leroy Merlin

   • Pile LR41h
   • Mascherina wc
   • Occhiali trasparenti protettivi
   ```
3. Aprire **Checklist** sull'orologio: scarica le liste dal telefono e le mostra.
   Toccare una lista, poi le voci per spuntarle.

### Formato del testo incollato (`lib/parse.js`)

- Una voce per riga; puntini ammessi e tolti: `• - * + · ▪ ►`, `1.` `2)`, `[ ]` `[x]`.
- **Titolo**: la prima riga se **seguita da una riga vuota** (comodo scrivendo a mano, senza
  puntini), oppure se è senza puntino e tutte le altre ce l'hanno (`Leroy Merlin`).
  Altrimenti titolo automatico `Lista 07/11`. *Modifica* ripropone titolo, riga vuota e voci.
- Se il campo di testo perde gli a capo, i puntini `•` separano comunque le voci
  (`Leroy Merlin • Pile • Mascherina`).
- Una riga sola senza puntini si divide su virgole/punto e virgola (`latte, pane, uova`).
- **Categorie**: una riga tutta in maiuscolo, senza puntino e seguita da una voce è
  l'intestazione delle voci sotto (`COLAZIONE`), anche nelle liste a mano. Con il puntino
  resta una voce (`• WC`); idem se dopo non c'è una voce normale (una lista scritta tutta in
  maiuscolo resta una lista di voci). Il titolo ha la precedenza.
- Voci doppie (maiuscole/minuscole ignorate) tenute una volta; max 100 voci da 100 caratteri.

## Cosa fa

- **Telefono — impostazioni** (`setting/index.js`): *+ Nuova lista* (incolla), poi una scheda
  per lista con le voci e:
  - **▲ ▼** accanto al titolo: ordine delle liste (lo stesso sull'orologio)
  - **Modifica** (testo attuale con titolo e puntini) · **Riscrivi** (stesso campo ma vuoto,
    per ripartire da zero; senza titolo resta quello attuale) · **Rinomina** (solo titolo)
  - **Tutte da prendere** / **Tutte prese**: tolgono / mettono tutte le spunte sull'orologio
  - **Svuota** (toglie le voci, la lista resta) · **Elimina**

  La finestra di testo (Annulla/OK) è della Zepp app: non si possono aggiungere pulsanti, da
  qui *Riscrivi*. Le liste stanno nel `settingsStorage` della Zepp app (chiave `lists`).
- **Telefono — side service** (`app-side/index.js`): risponde a `lists.sync` dall'orologio
  (applica le modifiche in coda, restituisce le liste);
  se le liste cambiano mentre l'app è aperta sull'orologio le spinge con `lists.changed`.
- **Orologio — home** (`page/index.js`): mostra subito la copia salvata, poi chiede le liste
  al telefono (timeout 10 s) e ridisegna. Riga di stato: *Aggiornato* / *Telefono non
  raggiunto · 10:32* (ora dell'ultimo aggiornamento). Ogni lista: titolo e `2/5 fatti`.
  In fondo **Schermo acceso**: *No, si spegne* (default) / *Sempre, nelle liste*.
- **Orologio — lista** (`page/list.js`): voci a capo su più righe, tocco = spunta (cerchio
  pieno, testo grigio, vibrazione leggera); le voci non si spostano. Ultima voce spuntata →
  *Tutto fatto!* con doppia vibrazione. Le categorie sono etichette non toccabili e non
  contano nel totale; senza voci visibili sparisce anche l'etichetta. In fondo cinque
  pulsanti: **Nascondi / Mostra spuntate** (vale per tutte le liste e resta salvato: con
  *Nascondi* una voce spuntata sparisce dopo 0,4 s, contatore e altri pulsanti considerano
  sempre tutte le voci), **Spunta tutte**,
  **Togli spunte** (conferma), **Elimina spuntate** (conferma con il numero), **Svuota lista**
  (conferma, la lista resta).
- **Schermo**: con una lista aperta, se lo schermo si spegne e il sistema chiude l'app,
  alzando il polso l'app si **riapre sulla stessa lista** (`setWakeUpRelaunch`; l'id della
  lista è salvato perché la pagina riaperta potrebbe non avere i parametri). Con
  *Schermo acceso: Sempre* lo schermo non si spegne mentre una lista è aperta
  (`setPageBrightTime` 1 h + `pauseDropWristScreenOff`), consuma batteria.
- **Modifiche fatte sull'orologio** (*Elimina spuntate*, *Svuota lista*, `lib/ops.js`): il
  contenuto delle liste è del telefono, quindi l'orologio le applica subito, le mette in coda
  (`pending`) e la home le manda al telefono a ogni sincronizzazione (`lists.sync`: coda in
  ingresso, liste aggiornate in uscita). Col telefono lontano restano in coda e vengono
  riapplicate sopra quello che arriva dal telefono, quindi le voci eliminate non ricompaiono.
- **Le spunte esistono solo sull'orologio** (`lib/store.js`), legate al testo della voce:
  se dal telefono si aggiunge o toglie una voce le altre spunte restano; una lista eliminata
  sul telefono sparisce dall'orologio al successivo aggiornamento. *Tutte prese / da
  prendere* sul telefono salvano nella lista un comando `reset: { checked, at }` che
  l'orologio applica una volta sola (ricorda `at` già applicato), poi si spunta liberamente.

## Struttura

```
checklist/
├── app.js                 # BaseApp (zml): avvia la messaggistica col telefono
├── app-side/index.js      # side service (gira nella Zepp app)
├── setting/               # pagina impostazioni nella Zepp app (+ i18n)
├── lib/
│   ├── parse.js           # testo ↔ lista (puro, usato da telefono e orologio)
│   ├── ops.js             # modifiche fatte sull'orologio (pure, applicate da entrambi)
│   ├── sync.js            # orologio: invia la coda e riceve le liste (zml request)
│   ├── phone-lists.js     # lettura liste da settingsStorage (impostazioni + side service)
│   ├── store.js           # orologio: copia liste + spunte (LocalStorage)
│   ├── ui.js, theme.js, cues.js
└── page/                  # index (liste), list (voci da spuntare) + layout + i18n
```

## Da verificare / prossimi passi

- 📱 Telefono lontano o Zepp app in background: coda delle modifiche dell'orologio
  consegnata al ritorno.
- 📱 Aggiornamento in tempo reale (`lists.changed`) con l'app aperta sull'orologio.
- Possibili: spunte rimandate al telefono (vederle nelle impostazioni), voci spuntate in
  fondo, più liste da una sola incollata, ordinamento liste.
