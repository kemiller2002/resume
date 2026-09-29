# Resume

Kevin Miller's resume, published with GitHub Pages.

- `index.html` — executive resume.
- `developer.html` — developer resume.

## How it is built

```text
resume.json            application data (owned here)
  -> resume.js         selection, sorting, date formatting (owned here)
  -> Knockout bindings in index.html / developer.html
  -> semantic HTML
  -> Folio recipes (.ef-identity, .ef-row, .ef-entry, .ef-lead-list,
     .ef-inline-list, .ef-labeled, .ef-category-grid, .ef-dense)
  -> Folio print.css + resume.css
  -> browser print / PDF (A4, 10 mm margins)
```

[Folio](https://github.com/kemiller2002/folio) supplies the reusable layout
contracts. It does not know about `resume.json`; this repository keeps the data,
what is shown, in which order, and how dates read. `resume.css` keeps only this
resume's look: page size and frame, type sizes, spacing.

The Folio stylesheet is loaded from jsDelivr pinned to a Folio commit and
checked with a Subresource Integrity hash. To move to a newer Folio commit,
change the SHA in both HTML files and recompute the hash:

```bash
git -C ../folio show <sha>:src/styles/print.css | openssl dgst -sha384 -binary | base64
```

No Folio JavaScript is needed: the stylesheet alone styles the page, and
printing does not measure the DOM.

## Tests

```bash
npm install
npx playwright install chromium firefox webkit   # and poppler-utils for pdftotext
npm test
```

The tests render the pre-migration pages kept in `tests/baseline/` and the
current pages with the same `resume.json`, then check:

- the PDFs contain the same words, apart from the fixes listed in
  `tests/baseline/manifest.json`;
- A4 pages, text inside the 10 mm margins, and the same page count (±1);
- dates right-aligned on one line and never overlapping titles;
- bold accomplishment lead phrases and a multi-column technology grid;
- Letter output loses no words;
- phones at 320/390/430 px have no horizontal overflow, and print keeps the
  A4 layout.

Set `FOLIO_ROOT=/path/to/folio` to read the pinned stylesheet from a local
Folio checkout instead of jsDelivr, and `RESUME_ENGINES=chromium` to skip
Firefox/WebKit when they are not installed.
