# Cartelle (Folders)

Launcher personale: raccoglie le app dell'orologio in cartelle, perché il menu di sistema non
si riordina.

## Stato

**v0.1.1**. La 0.1.0 funziona sull'orologio; la 0.1.1 evita che uno swipe apra l'app sotto il
dito (`addTap` in `lib/ui.js`), da provare sul device. Nel simulatore c'è una sola app installata alla volta: le aperture si provano
solo sul device.

## Cosa fa

- Vista **lista** (icona e nome) o **griglia** (4 o 9 icone per pagina, a scelta per ogni
  cartella e per il primo livello, swipe destra/sinistra). Nella griglia da 4 c'è il nome sotto
  l'icona, con i puntini se è lungo
- Al primo livello ci sono cartelle e singole app
- Tutto si configura dall'orologio con **Modifica**: aggiungere app, creare, rinominare ed
  eliminare cartelle, cambiare l'ordine
- Ogni cartella ha un colore e una sigla di massimo tre lettere (di default le iniziali del
  nome), scelti alla creazione e modificabili dalle sue azioni
- Ogni app sta in un posto solo: aggiungerla altrove la sposta
- Eliminando una cartella le sue app passano al primo livello

## Limiti

- Nessuna API elenca le app installate né fornisce le icone. L'elenco è fisso in
  `lib/catalog.js`: le nostre app e quelle di sistema scelte. Le app dello store sono escluse.
- Mappe non si può aprire: non ha una costante di sistema e la ricerca per nome non la trova.
- Le icone delle app di sistema sono ridisegnate da noi e fisse (Calendario mostra sempre 31).

## Struttura

- `lib/model.js`: dati del launcher (puro, senza API della piattaforma)
- `lib/store.js`: salvataggio in LocalStorage
- `lib/catalog.js`: app disponibili
- `lib/launch.js`: apertura delle app
- `lib/view.js`: disegno di lista e griglia
- `lib/input.js`, `lib/ui.js`, `lib/theme.js`: tastiera, card, colori
- `page/`: index (primo livello), folder, edit, item (azioni su una voce), pick (scelta app);
  coordinate condivise in `launcher.r.layout.js`
- `assets/default.r/`: `g_<id>.png` 120 px e `m_<id>.png` 100 px per la griglia, `l_<id>.png`
  64 px per la lista.
  Generate da `private/scripts/make-folders-assets.ps1` (nostre app e cartella) e
  `make-folders-system-icons.ps1` (app di sistema)

Ogni voce di `lib/catalog.js` deve avere le sue due immagini.

## Prossimi passi

- Prova sull'orologio
