Curated ingestion fixtures for the current MVP.

Keep this folder small and representative.

- `10020Records.csv`: medium sales export used by upload integration tests.
- `10020Records.xlsx`: workbook variant used by extraction prompt optimization experiments.
- `field-service-customer-invoice.csv`: small customer invoice export used to verify invoice-family classification and upload UX.
- `field-service-vendor-bill.csv`: small vendor bill export used to verify payables-family classification and upload UX.
- `field-service-job-cost-report.csv`: small job cost export used to verify job-margin-family classification and upload UX.
- `supermarket_sales - Sheet1.csv`: larger transactional sales export used by queued ingestion integration tests.
- `weekly_cash_margin_alert.pdf`: representative weekly brief fixture used by extraction prompt optimization experiments.

Do not add random PDFs, DOCX files, or unrelated sample dumps here unless the current ingestion path and tests actually use them.
