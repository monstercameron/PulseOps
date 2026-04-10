import { promises as fs } from "node:fs";

import { expect, test } from "@playwright/test";

test("dashboard upload flow carries a new file through upload and review entry", async ({
  page,
}, testInfo) => {
  test.slow();
  const fileName = `upload-happy-${Date.now()}.csv`;
  const filePath = testInfo.outputPath(fileName);

  await fs.writeFile(
    filePath,
    [
      "invoice_id,invoice_number,customer_name,due_date,amount_due",
      `${Date.now()},INV-${Date.now()},Northwind Service,2026-04-15,4200`,
    ].join("\n"),
    "utf8",
  );

  await page.goto("/dashboard");
  await page.getByRole("button", { name: "Upload files" }).click();
  const modal = page.getByRole("dialog", { name: "Upload files" });

  await expect(modal).toBeVisible();
  await expect(modal.getByText("Recognized document types")).toBeVisible();
  await expect(
    modal.getByText("Customer invoice", { exact: true }).first(),
  ).toBeVisible();
  await expect(modal.getByText("Vendor bill")).toBeVisible();
  await expect(modal.getByText("Job cost report")).toBeVisible();
  await expect(
    modal.getByRole("button", { name: "Upload", exact: true }),
  ).toBeDisabled();

  await modal.locator("#upload-files-input").setInputFiles(filePath);

  await expect(modal.getByText(fileName)).toBeVisible();
  await expect(
    modal.getByText("What happens after you click upload"),
  ).toBeVisible();
  await expect(modal.getByText("Saved your file")).toBeVisible();
  await expect(modal.getByText("Checked the file")).toBeVisible();
  await expect(modal.getByText("Prepared the file for review")).toBeVisible();

  const uploadResponsePromise = page.waitForResponse(
    (response) =>
      response.url().includes("/api/ingest/upload") &&
      response.request().method() === "POST",
  );

  await modal.getByRole("button", { name: "Upload", exact: true }).click();

  await expect(
    modal.getByRole("button", { name: "Uploading..." }),
  ).toBeVisible();
  await expect(modal.getByText("Working on your file now")).toBeVisible();

  const uploadResponse = await uploadResponsePromise;
  const uploadPayload = (await uploadResponse.json()) as {
    documentId: string;
  };

  await expect(modal.getByText("Document ID")).toBeVisible();
  await expect(modal.getByText(uploadPayload.documentId)).toBeVisible();
  await expect(modal.getByText("Import readout")).toBeVisible();
  await expect(
    modal.getByText("Customer invoice", { exact: true }).first(),
  ).toBeVisible();
  await expect(
    modal.getByText("We recognized this file as Customer invoice."),
  ).toBeVisible();
  await expect(modal.getByText("Recognition confidence")).toBeVisible();
  await expect(modal.getByText("Tabular review path")).toBeVisible();
  await expect(modal.getByText("Stored for download")).toBeVisible();
  await expect(
    modal.getByRole("button", { name: "Open Pipeline" }),
  ).toBeVisible();
  await expect(
    modal.getByRole("button", { name: /Review file|Follow progress/i }),
  ).toBeVisible();

  await page.goto(
    `/explorer?documentId=${encodeURIComponent(uploadPayload.documentId)}`,
  );

  await expect(page.getByRole("heading", { name: fileName })).toBeVisible();
  await expect(
    page
      .getByText(/Ready to review|Still getting it ready|Needs attention/i)
      .first(),
  ).toBeVisible();
});

test("pipeline upload flow explains duplicates and validation errors clearly", async ({
  page,
}, testInfo) => {
  const duplicateFileName = `upload-duplicate-${Date.now()}.csv`;
  const duplicateFilePath = testInfo.outputPath(duplicateFileName);
  const invalidFilePath = testInfo.outputPath(
    `upload-invalid-${Date.now()}.xlsx`,
  );
  const unsupportedFilePath = testInfo.outputPath(
    `upload-unsupported-${Date.now()}.txt`,
  );

  await fs.writeFile(
    duplicateFilePath,
    [
      "invoice_number,customer_name,due_date,amount_outstanding",
      `INV-${Date.now()},Acme Heating,2026-04-18,2100`,
    ].join("\n"),
    "utf8",
  );
  await fs.writeFile(
    invalidFilePath,
    "this is not really an xlsx file",
    "utf8",
  );
  await fs.writeFile(unsupportedFilePath, "technician notes", "utf8");

  await page.goto("/pipeline");
  await page.getByRole("button", { name: "Upload file" }).click();
  const modal = page.getByRole("dialog", { name: "Upload files" });
  const initialUploadResponsePromise = page.waitForResponse(
    (response) =>
      response.url().includes("/api/ingest/upload") &&
      response.request().method() === "POST",
  );

  await modal.locator("#upload-files-input").setInputFiles(duplicateFilePath);
  await modal.getByRole("button", { name: "Upload", exact: true }).click();
  await initialUploadResponsePromise;

  await expect(modal.getByText("Document ID")).toBeVisible({ timeout: 15000 });
  await expect(
    modal.getByRole("button", { name: "Upload another" }),
  ).toBeVisible();

  const duplicateUploadResponsePromise = page.waitForResponse(
    (response) =>
      response.url().includes("/api/ingest/upload") &&
      response.request().method() === "POST",
  );

  await modal.getByRole("button", { name: "Upload another" }).click();
  await modal.locator("#upload-files-input").setInputFiles(duplicateFilePath);
  await modal.getByRole("button", { name: "Upload", exact: true }).click();
  await duplicateUploadResponsePromise;

  await expect(modal.getByText("Already in workspace").first()).toBeVisible({
    timeout: 15000,
  });
  await expect(
    modal.getByText(
      "This exact file was already in the workspace, so we kept the existing record instead of creating a second copy.",
    ),
  ).toBeVisible();

  const invalidUploadResponsePromise = page.waitForResponse(
    (response) =>
      response.url().includes("/api/ingest/upload") &&
      response.request().method() === "POST",
  );

  await modal.getByRole("button", { name: "Upload another" }).click();
  await modal.locator("#upload-files-input").setInputFiles(invalidFilePath);
  await modal.getByRole("button", { name: "Upload", exact: true }).click();
  await invalidUploadResponsePromise;

  await expect(
    modal.getByText(
      "This file does not match its extension. Please save or export it again, then try once more.",
    ),
  ).toBeVisible({ timeout: 15000 });
  await expect(
    modal.getByText("The file contents do not match the file extension"),
  ).toBeVisible();
  await expect(
    modal.getByRole("button", { name: "Choose a different file", exact: true }),
  ).toBeVisible();

  await modal
    .getByRole("button", { name: "Choose a different file", exact: true })
    .click();
  await modal.locator("#upload-files-input").setInputFiles(unsupportedFilePath);

  await expect(
    modal.getByText("Choose a CSV or XLSX file for this upload path."),
  ).toBeVisible();
  await expect(
    modal.getByRole("button", { name: "Upload", exact: true }),
  ).toBeDisabled();
});

test("upload flow recognizes separate import families clearly", async ({
  page,
}, testInfo) => {
  test.slow();
  const runId = Date.now();
  const fixtures = [
    {
      content: [
        "invoice_id,invoice_number,customer_name,due_date,amount_due",
        `${runId + 1},INV-${runId + 1},Acme Heating,2026-04-18,2100`,
      ].join("\n"),
      familyLabel: "Customer invoice",
      fileName: `customer-invoice-${runId}.csv`,
    },
    {
      content: [
        "vendor_name,bill_number,bill_date,due_date,amount_due",
        `United Supply,V-${runId + 2},2026-04-05,2026-04-19,1260`,
      ].join("\n"),
      familyLabel: "Vendor bill",
      fileName: `vendor-bill-${runId}.csv`,
    },
    {
      content: [
        "job_id,job_number,labor_cost,material_cost,actual_revenue",
        `${runId + 3},J-${runId + 3},1850,940,3600`,
      ].join("\n"),
      familyLabel: "Job cost report",
      fileName: `job-cost-report-${runId}.csv`,
    },
  ] as const;

  for (const fixture of fixtures) {
    const filePath = testInfo.outputPath(fixture.fileName);

    await fs.writeFile(filePath, fixture.content, "utf8");
    await page.goto("/dashboard");
    await page.getByRole("button", { name: "Upload files" }).click();
    const modal = page.getByRole("dialog", { name: "Upload files" });

    await modal.locator("#upload-files-input").setInputFiles(filePath);

    const uploadResponsePromise = page.waitForResponse(
      (response) =>
        response.url().includes("/api/ingest/upload") &&
        response.request().method() === "POST",
    );

    await modal.getByRole("button", { name: "Upload", exact: true }).click();

    const uploadResponse = await uploadResponsePromise;
    const uploadPayload = (await uploadResponse.json()) as {
      documentId: string;
    };

    await expect(modal.getByText("Import readout")).toBeVisible({
      timeout: 15000,
    });
    await expect(
      modal.getByText(fixture.familyLabel, { exact: true }).first(),
    ).toBeVisible();
    await expect(
      modal.getByText(`We recognized this file as ${fixture.familyLabel}.`),
    ).toBeVisible();

    await page.goto(
      `/explorer?documentId=${encodeURIComponent(uploadPayload.documentId)}`,
    );

    await expect(
      page.getByRole("heading", { name: fixture.fileName }),
    ).toBeVisible();
    await expect(page.getByText(fixture.familyLabel).first()).toBeVisible();
  }
});
