# Supported Format Matrix

Current upload and queued-ingestion support in the local prototype.

| Format | Upload accepted | Parser route | Max size | Current parser output | Vector eligibility | Human review before vector | Redaction policy |
| --- | --- | --- | --- | --- | --- | --- | --- |
| CSV | yes | structured loader | 5 MB | tabular sheet summary + normalized headers + confidence | never | no | `tabular-financial-export` |
| XLSX | yes | structured loader | 20 MB | workbook sheet summaries + normalized headers + confidence | never | no | `tabular-financial-export` |
| PDF | yes | text parse | 20 MB | text + page count + confidence | review | yes | `business-pdf` |
| DOCX | yes | text parse | 15 MB | normalized text + warning count + confidence | review | yes | `business-document-text` |
| TXT | yes | text parse | 2 MB | normalized text + confidence | review | yes | `plain-text-upload` |
| HTML | yes | text parse | 2 MB | cleaned text + title + links + table counts + confidence | review | yes | `structured-web-export` |
| XML | yes | text parse | 3 MB | parsed XML + flattened fields + confidence | after normalization | no | `structured-xml-payload` |
| JSON | yes | text parse | 2 MB | normalized object + flattened fields + confidence | after normalization | no | `machine-json-payload` |

Current guards:

- extension and content sniffing must agree
- MIME is inferred independently from the extension
- per-format max-size limits are enforced at upload time
- duplicate file hashing is enabled
- password-protected PDF, DOCX, and XLSX uploads are rejected

Current gaps:

- no archive expansion for ZIP, GZIP, TAR
- no image OCR execution engine wired into ingestion
- no page-count guard before parsing
- no legacy Office, mailbox container, or bank feed support yet
