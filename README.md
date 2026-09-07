# Albero genealogico

Sito statico, interattivo e navigabile, che visualizza l'albero genealogico della
famiglia a partire da un export GEDCOM. Nessun backend: tutti i dati sono caricati
dal file JSON incluso nel sito. Costruito con [Vite](https://vitejs.dev) e
[family-chart](https://github.com/donatso/family-chart), pubblicato su GitHub Pages.

## Funzionalità

- Click su una persona → l'albero si ricentra su di lei (antenati sopra, discendenti sotto)
- Ricerca per nome/cognome nella barra in alto
- Pannello laterale (bottom sheet su smartphone) con nascita, morte, luoghi, coniugi e figli
- Link diretto e condivisibile a una persona tramite `?person=ID` nell'URL
- Gestisce famiglie multiple, figli senza data di nascita e campi mancanti senza errori
- Pulsante "⌂" per tornare in un click alla vista completa dell'albero
- **Libro di famiglia stampabile** (`public/libro-famiglia.html`, link "📖 Libro" in
  alto): registro genealogico classico generato automaticamente dai dati, con
  copertina, indice per cognome e persone numerate per generazione con rimandi
  incrociati (genitori/coniugi/figli). Apribile da browser e stampabile o
  esportabile in PDF con il pulsante "Stampa / Salva PDF" — pensato come regalo
  cartaceo per i parenti. Si aggiorna da solo seguendo i dati in
  `family_tree_data.json`, nessuna manutenzione separata richiesta.

## Sviluppo locale

```bash
npm install
npm run dev
```

Apre il sito su `http://localhost:5173/albero-genealogico/`.

Per generare la build statica (usata anche dal deploy automatico):

```bash
npm run build
npm run preview   # per verificarla in locale
```

## Struttura dati

I dati vivono in `public/family_tree_data.json`, con questa struttura:

```json
{
  "individuals": {
    "I500001": {
      "id": "I500001",
      "givenName": "...",
      "surname": "...",
      "marriedName": null,
      "sex": "M" | "F",
      "birthDate": "15 OCT 1988" | "1988" | null,
      "birthPlace": "...",
      "deathDate": null,
      "deathPlace": null,
      "deathCause": null,
      "childOfFamily": "F500001" | null,
      "spouseInFamilies": ["F500002", ...]
    }
  },
  "families": {
    "F500001": {
      "id": "F500001",
      "husbandId": "I500003" | null,
      "wifeId": "I500002" | null,
      "marriageDate": null,
      "marriagePlace": null,
      "divorced": false,
      "childrenIds": ["I500001", ...]
    }
  }
}
```

`src/data.js` trasforma questa struttura nel formato piatto richiesto da
`family-chart` (un array di persone con `rels.parents/spouses/children`).

### ⚠️ Privacy: niente email o telefono nel JSON pubblicato

Il sito è pubblico (necessario per GitHub Pages gratuito). Per questo motivo
`public/family_tree_data.json` **non deve mai contenere** i campi `email` e
`phone` che un export GEDCOM/MyHeritage può includere: chiunque trovi il link
al sito li vedrebbe, indicizzati anche dai motori di ricerca, e resterebbero
comunque nella cronologia Git anche se rimossi in un secondo momento. Quando
rigeneri il file da un nuovo export, rimuovi questi campi prima di committare.

## Aggiungere una persona o correggere un dato

Il modo più semplice: chiedilo a Claude (Claude Code) in una sessione su questo
repository, in linguaggio naturale — ad esempio "aggiungi Anna, sorella di
Mario, nata nel 1960" oppure "correggi la data di morte di Giuseppe Panagia in
1962". Claude modifica `family_tree_data.json` direttamente, verifica che i
collegamenti tra genitori/figli restino coerenti, e fa commit e push. Il sito
e il libro di famiglia si aggiornano da soli al deploy successivo.

Niente moduli o strumenti da mantenere: per un albero che cresce per scoperte
occasionali (non per inserimento dati continuo), è il metodo più robusto e non
richiede gestire token o credenziali.

## Aggiornare l'albero da un nuovo export GEDCOM

1. Esporta un nuovo file GEDCOM da MyHeritage (o altro software genealogico).
2. Convertilo nella struttura `individuals` / `families` mostrata sopra
   (uno script di conversione GEDCOM → JSON, o lo stesso strumento che ha
   generato l'export originale).
3. **Rimuovi i campi `email` e `phone`** da ogni persona, ad esempio con `jq`:
   ```bash
   jq '(.individuals[] |= del(.email, .phone))' nuovo_export.json > public/family_tree_data.json
   ```
4. Controlla che ogni id in `childrenIds`, `husbandId`, `wifeId` e
   `childOfFamily` corrisponda esattamente (senza spazi extra) a un id
   presente in `individuals`/`families` — un export malformato può introdurre
   spazi indesiderati che spezzano silenziosamente i legami di parentela.
5. Verifica in locale (`npm run dev`) prima di pushare su `main`.

## Deploy

Il deploy su GitHub Pages è automatico tramite GitHub Actions
(`.github/workflows/deploy.yml`): ogni push su `main` esegue la build e
pubblica il contenuto di `dist/`.

**Prima del primo deploy**, nel repository su GitHub: *Settings → Pages →
Build and deployment → Source* → seleziona **GitHub Actions**.

Il sito sarà disponibile su:
`https://<utente-github>.github.io/albero-genealogico/`

Se cambi nome al repository, aggiorna anche `base` in `vite.config.js` con
il nuovo nome.

## Condividere un link diretto a una persona

Aggiungi `?person=ID` all'URL del sito, ad esempio:

`https://<utente-github>.github.io/albero-genealogico/?person=I500001`

L'id di ogni persona si trova nel file `public/family_tree_data.json`.
