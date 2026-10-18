# Score (Segnapunti)

Segnapunti per **Amazfit Balance 2 XT**. Giochi: **Sport** (padel, calcio), **Carte** (a punti, a
eliminazione es. Scala 40, burraco, canasta); **Giochi da tavolo** (Catan, Carcassonne, Ticket to Ride, 7 Wonders Duel, Puerto Rico); **Strumenti**: **Dadi** e **Casuale**. Pensata per aggiungere altri giochi (burraco, canasta...) senza toccare home, setup e
storico.

- Permessi: `device:os.local_storage`, `device:os.accelerometer` (dadi scuotendo il polso)
- appId: `23478` · API level: 4.0 · schermo: round 480x480 · versione 0.1.0
- Stato: ✅ compila (`zeus build`) · ✅ funziona nel simulatore (2026-10-18) · 📱 da provare in campo
- Icona: punteggio 6-4 su cerchio blu/rosso con pallina (`private/scripts/make-score-icon.ps1`)

## Cosa fa

- **Home**: *Riprendi* la partita in corso (con il punteggio), le **categorie** (Sport, Carte,
  Giochi da tavolo, Strumenti), *Storico*. Una categoria apre la lista dei suoi
  giochi (*Nuova partita*).
- **Nuova partita** (padel): *Inizia* in alto (ricorda l'ultima configurazione), poi per ogni
  squadra il nome e i due giocatori (**una lettera** ciascuno, default `1`/`2`: il primo gioca a
  destra/drive, il secondo a sinistra), tutti modificabili con la tastiera di sistema; poi le
  opzioni, che cambiano a ogni tocco:

  | Opzione | Valori (il primo è il default) |
  |---|---|
  | Punteggio | Punto d'oro · Vantaggi · Star point (vantaggi ai primi 2 deuce, poi punto decisivo) |
  | Set | Al meglio dei 3 · 1 set · Al meglio dei 5 |
  | Set decisivo | Set normale · Super tie-break a 10 |
  | Batte per primo | Squadra 1 · Squadra 2 |
  | Batte prima (una per squadra) | giocatore di destra · di sinistra |

  Avviare una partita nuova con una in corso chiede conferma.
- **Tabellone padel**: schermo diviso a metà (blu = squadra 1 a sinistra, rosso = squadra 2 a
  destra), **un tocco sulla metà = punto** a quella squadra. Per lato: nome, game del set,
  punti grandi (0/15/30/40/AD, numeri nel tie-break), pallina gialla = squadra che batte, sotto la pallina la **lettera
  del giocatore che batte** (gialla); nello stesso punto dell'altro lato la **lettera di chi
  riceve** (bianca; `1/2` sul punto decisivo, dove sceglie chi riceve). In alto ora e
  set conclusi (`6-4 3-6`). Riga avvisi: *Punto d'oro*, *Tie-break*, *Cambio campo*, vincitore.
  - Tie-break a 7 sul 6-6; set a 6 con 2 di scarto (7-5); super tie-break a 10 se scelto.
  - Battuta: alterna a ogni game; nel tie-break 1 punto e poi 2 a testa. Dentro la squadra i
    giocatori si alternano a ogni turno di battuta (A1 B1 A2 B2...), ordine fisso per tutta la
    partita.
  - Ricezione: punti giocati nel game pari = riceve chi sta a destra, dispari = a sinistra.
  - Cambio campo: game dispari, ogni 6 punti nel tie-break, fine set con totale game dispari
    (toast + vibrazione).
  - **Annulla** toglie l'ultimo punto (anche a partita finita). **Fine** salva nello storico
    (se non finita chiede conferma e la segna "non finita").
- **Vibrazioni**: tick a ogni punto (il tocco è stato preso), più forte a fine game, doppia al
  cambio campo, lunga a fine set, quattro forti a fine partita.
- **Ogni punto è salvato subito**: uscire dall'app o lo spegnimento schermo non perdono nulla;
  `setWakeUpRelaunch` riapre il tabellone alzando il polso (📱 da verificare).
- **Carte a punti / Carte a eliminazione** (tabellone a mani, pagine `cards` + `hand`). Due voci
  separate sullo stesso motore: il tipo è fisso (`fixed` nel registro) e ognuna ricorda la sua
  configurazione.
  - Setup, in quest'ordine: **soglia**, **rientro** (solo eliminazione), **numero giocatori**
    (2–6, default 4, pagina a parte con **−/+ e rotella**, confermato con **OK**, BACK annulla;
    al ritorno il setup si ricostruisce con i nomi giusti), infine i **nomi** dei giocatori:

    | Opzione | Carte a punti | Carte a eliminazione |
    |---|---|---|
    | Giocatori (−/+, rotella) | 2–6, default 4 | idem |
    | Soglia (tastiera numerica) | 500 | 101 |
    | Rientro | — | Sì, una volta · No |

  - Tabellone: titolo, "Mano N · fuori a 101" (o "vince a 500"), **+ Mano**, una riga per
    giocatore con il totale, poi Annulla (ultima mano, con conferma) e Fine.
  - **+ Mano**: una riga per giocatore ancora in gioco con totale parziale e voci inserite
    (`Marco: 250` / `+100 +300 -150`). Tocco = pagina del giocatore: **+** e **−** aprono la
    tastiera numerica (il segno lo dà il pulsante), le voci si sommano (chiusura, canaste, punti
    veri, carte da pagare...), **Annulla** toglie l'ultima, **OK** torna. **Salva** in alto
    registra la mano con le somme. Punteggi negativi ammessi.
  - La mano in compilazione è una bozza salvata nella partita (`handDraft`): uscendo senza
    salvare la si ritrova al prossimo **+ Mano**.
  - **Eliminazione** (Scala 40): chi raggiunge la soglia (>=) è **fuori**; vince l'ultimo rimasto (se
    escono tutti nella stessa mano vince il totale più basso). **Rientro** (se attivo): toccando
    un giocatore "rientra?" e confermando rientra col totale più alto tra quelli in gioco, una
    volta sola, solo se in gioco ne restano almeno 2.
  - **A punti**: vince chi supera per primo la soglia col totale più alto (in caso di
    parità in testa si continua).
- **Calcio** (pagina `football`): setup con nomi squadre e **Timer cambi** (minuti, 1–45,
  default 10, pagina −/+ e rotella). Tabellone: metà schermo = **gol** a quella squadra (tick di
  vibrazione), ora in alto, al centro il **timer cambi**:
  - tocco sul timer = **avvia / pausa** (giallo mentre corre, "Timer in pausa" quando fermo);
  - a zero **vibra** (4 colpi, una volta sola) e **non si ferma**: va in negativo (`-0:12`) su
    sfondo **rosso** con "Cambi!"; un tocco in negativo (= cambi fatti) riparte da capo;
    **Reset** lo riporta pieno e fermo;
  - il tempo è calcolato da `Date.now()` e salvato nella partita: uscire dall'app non lo perde
    (se arriva a zero mentre l'app è chiusa, vibra alla riapertura);
  - mentre il timer corre lo **schermo resta acceso** (altrimenti il sistema chiude l'app e la
    vibrazione non arriva); in pausa torna normale.
  - **Annulla** toglie l'ultimo gol, **Fine** (con conferma) salva nello storico; il pareggio
    non è "non finita".
- **Burraco / Canasta** (motore e tabellone delle carte, modalità a punti):
  - setup: **soglia** (burraco 2005, canasta 5000, tastiera numerica), **Squadre o giocatori**
    (2 = coppie o uno contro uno, 3 = tre giocatori; −/+ e rotella), nomi (default Noi/Loro/Squadra 3);
  - vince chi supera per primo la soglia col totale più alto (parità in testa: si continua);
  - nella pagina della mano, sotto i pulsanti (scorrendo), **voci rapide** da un tocco, oltre ai
    punti scritti con +/− (carte calate, carte in mano); ogni tocco vibra (il totale può essere
    fuori schermo), a sinistra di ogni voce in piccolo quante volte è stata usata nella mano;
    **Chiusura** (e Chiusura in mano) una sola volta per mano fra tutte le squadre, **Pozzetto
    non preso** una volta per squadra (altrimenti "Già segnata in questa mano"):
    burraco: Chiusura +100, Burraco pulito +200, semipulito +150, sporco +100, Pozzetto non
    preso −100; canasta: Chiusura +100, Chiusura in mano +200, Canasta pulita +500, sporca
    +300, Tre rosso +100, Quattro tre rossi +800;
  - canasta: accanto a ogni squadra l'**apertura minima** in base al totale (`min 50`:
    negativo 15, fino a 1495 50, fino a 2995 90, poi 120).
- **Giochi da tavolo** (pagina `tally`): una riga per giocatore col totale, tocco = pagina
  delle voci del giocatore (stessa pagina delle carte: +/−, Annulla sua ultima voce, voci rapide
  scorrendo). I punti si segnano in qualsiasi momento della partita (non a mani). **Annulla** sul
  tabellone toglie l'ultima voce di chiunque (chiede conferma dicendo di chi). **Fine** →
  storico, vince il totale più alto.
  - **Catan** (3–6 giocatori): si parte da 2 (due colonie), vince chi arriva a **10**
    (modificabile, avviso sul tabellone). Voci: Colonia +1, Città (da colonia) +1, Carta punto
    vittoria +1, **Strada più lunga** +2 ed **Esercito più grande** +2 che **passano di mano**
    (assegnarle a un giocatore le toglie a chi le aveva).
  - **Carcassonne** (2–6): punti con +/−, Monastero +9.
  - **Ticket to Ride** (2–5): tratte da 1–6 vagoni (+1 +2 +4 +7 +10 +15), Biglietti completati
    e falliti (categorie: si scrive il totale), Percorso più lungo +10 (passa di mano).
  - **7 Wonders Duel** (2): conteggio finale per **categorie** (si tocca la categoria e si scrive
    il valore, riscriverla lo sostituisce, il valore appare a destra): civili, scienza,
    commercio, gilde, meraviglie, gettoni progresso, monete (si scrivono le monete, 1 punto
    ogni 3), militare. Parità: vince chi ha più punti civili.
  - **Puerto Rico** (3–5): categorie gettoni PV, edifici, bonus grandi edifici. (Spareggio
    dobloni + merci non gestito: in parità nessun vincitore.)
- **Strumenti** (voce di primo livello):
- **Dadi**: 2d6 (default), 1d6, 3d6, d20 (pulsante in alto, ricordato); lancio toccando i dadi,
  **Lancia** o **scuotendo il polso** (accelerometro); breve animazione, vibrazione, somma,
  ultimi 6 lanci; con 2d6 il 7 mostra "brigante!".
- **Casuale**: **Chi inizia** (un giocatore a caso) e **Ordine** (tutti in ordine casuale). Usa i
  giocatori della partita in corso, altrimenti G1..Gn con numero scelto con −/+ (2–6).
- **Storico**: ultime 30 partite, `*` accanto al vincitore, dettaglio set e data. *Svuota* con
  conferma.

## Struttura

```
lib/games.js      registro giochi: id, pagina tabellone, opzioni di setup, lati, score(match)
lib/padel.js      motore padel puro: replay(options, log) → stato; punti, set, battuta, eventi
lib/cards.js      motore carte puro: totali per mano, eliminazioni, rientro, vincitore
lib/store.js      LocalStorage: partita in corso, storico, ultimo setup per gioco
lib/cues.js       vibrazioni per evento
lib/theme.js      colori (lati del tabellone, accento giallo pallina)
lib/ui.js         createCard() (copiata da pulse)
page/index.js     home: riprendi, categorie, storico
page/category.js  giochi e strumenti di una categoria
page/tally.js     tabellone giochi da tavolo
page/dice.js      dadi (tocco o scuotendo il polso)
page/random.js    chi inizia, ordine casuale
lib/board.js      motore giochi da tavolo: totali, obiettivo, spareggio, voci rapide per gioco
lib/random.js     dadi, scelta e mescolamento casuali
page/setup.js     nuova partita (generica sulle opzioni del gioco)
page/padel.js     tabellone padel
page/football.js  tabellone calcio con timer cambi
lib/football.js   gol e riassunto partita calcio
lib/timer.js      countdown pausabile (dati puri, tempo da Date.now())
page/cards.js     tabellone carte (a punti e a eliminazione), ricostruito a ogni modifica
page/hand.js      mano in corso: somma e voci per giocatore, Salva
page/points.js    voci +/− di un giocatore nella mano
lib/hand.js       bozza della mano (handDraft), somma e testo delle voci
page/number.js    modifica di un'opzione numerica con −/+ e rotella (es. giocatori)
page/history.js   storico (generico)
```

Una partita è `{ gameId, options, names, log, startedAt }`: il punteggio non è salvato ma
**ricalcolato dal log** dei punti, quindi l'annulla è banale e non ci sono stati incoerenti.

## Aggiungere un gioco

1. `lib/<gioco>.js` con le opzioni e `matchScore(match)` → `{ title, line, detail, winner }`
   (e il motore se serve). Un gioco a mani può riusare `lib/cards.js` + `page/cards`
   (basta una nuova entry in `GAMES` con le sue opzioni e `fixed`, come `cards_penalty`).
2. `page/<gioco>.js` + layout: legge `loadCurrentMatch()`, aggiunge eventi a `match.log`,
   salva, e con *Fine* chiama `addToHistory`.
3. Entry in `GAMES` (`lib/games.js`), pagina in `app.json`, stringhe `game_<id>` e
   `opt_<chiave>_<valore>` nei `.po`.

Burraco e canasta sono entry sul motore carte con opzioni proprie (`BURRACO_OPTIONS`,
`CANASTA_OPTIONS`), voci rapide (`presets`) e nota per riga (`rowNote`). Ogni gioco ha una
`category` (`CATEGORIES` in `lib/games.js`).

## Prossimi passi

- Calcio: eventuale tempo di gioco (1°/2° tempo), timer a schermo spento (App Service / alarm).

- Prova in campo (toccabilità con mani sudate, leggibilità al sole,
  vibrazioni, risveglio sul tabellone).
- Spareggi di Puerto Rico (dobloni + merci); altre espansioni (es. Ticket to Ride Europa:
  stazioni, tratte da 8).
- Cambio ordine di battuta a inizio set (oggi fisso per tutta la partita) e cambio lato dei
  giocatori.
- Possibili: tasti fisici per segnare senza guardare, tennis/ping pong (stesso schema del padel).
