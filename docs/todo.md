# Ingestion TODO

This file tracks the actual local prototype state.

Use [supported-format-matrix.md](./supported-format-matrix.md) for the current format-by-format behavior.

## Current completed work

- [x] Accept uploads for `pdf`, `docx`, `xlsx`, `csv`, `txt`, `html`, `xml`, and `json`
- [x] Detect MIME type independently from the extension
- [x] Detect mismatched extension versus actual file signature or text shape
- [x] Enforce per-format max-size guards at upload time
- [x] Reject password-protected `pdf`, `docx`, and `xlsx` uploads
- [x] Hash uploads for duplicate detection
- [x] Maintain per-format routing policy for structured loader versus text parsing
- [x] Parse `csv` into normalized headers, row counts, records, and confidence
- [x] Parse `xlsx` into workbook sheet summaries, row counts, headers, and confidence
- [x] Parse `pdf` into extracted text, page count, and confidence
- [x] Parse `docx` into extracted text, warning count, and confidence
- [x] Parse `txt` with BOM-aware decoding and confidence scoring
- [x] Parse `html` into cleaned text, title, link count, table count, and confidence
- [x] Parse `xml` into parsed objects, flattened fields, and confidence
- [x] Parse `json` into normalized objects, flattened fields, and confidence
- [x] Queue and process both tabular and text documents through the local ingestion job flow
- [x] Persist both tabular parser artifacts and text parser artifacts locally
- [x] Add regression tests for all currently supported Phase A formats
- [x] Add curated asset-backed ingestion integration tests for CSV uploads
- [x] Publish the supported-format matrix in product docs

## Remaining routing backlog

- [ ] Add page-count guards by format before background parsing
- [ ] Add archive expansion for `zip`, `gzip`, and `tar`
- [ ] Expand encrypted-file detection beyond the current `pdf`, `docx`, and `xlsx` checks
- [ ] Add connector-specific size and batch guards

## Remaining parser backlog

- [ ] Expand `pdf` parsing beyond text and page count into source spans, tables, and embedded attachment handling
- [ ] Expand `docx` parsing beyond raw text into headings, tables, and headers/footers
- [ ] Expand `xlsx` parsing beyond normalized sheet summaries into formulas, merged cells, and hidden-sheet policy
- [ ] Add legacy Office and OpenDocument support: `doc`, `xls`, `ppt`, `pptx`, `rtf`, `odt`, `ods`, `odp`
- [ ] Add image ingestion and a real OCR execution engine for scanned docs
- [ ] Add mailbox and calendar/contact artifact support: `eml`, `msg`, `pst`, `ost`, `ics`, `vcf`
- [ ] Add finance and bank feed parsers: `ofx`, `qfx`, `qif`, `camt`, `mt940`, `iif`

## Remaining trust and downstream backlog

- [x] Attach parser confidence to every currently supported parse
- [x] Validate parsed artifacts before persistence and downstream use
- [x] Define per-format vector eligibility, review requirements, and redaction policy keys
- [ ] Preserve source spans or page refs for downstream citations on text formats
- [ ] Add parser drift detection by source template
- [ ] Add a larger malformed and corrupted-file corpus for supported formats
- [ ] Add heavy-file benchmarks for large spreadsheets and long PDFs
- [ ] Add at least 10 real samples for each supported format
- [ ] Add duplicate-upload regression tests across every connector path

## Remaining extraction backlog

- [ ] Add specialized extractors for bank statements, invoices, bills, receipts, contracts, and payroll docs
- [ ] Add structured extraction contracts for text-first business documents
- [ ] Add format-aware routing into canonical fact extraction for the newly supported text formats
