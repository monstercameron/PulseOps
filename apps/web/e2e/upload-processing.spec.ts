import { promises as fs } from "node:fs";

import { expect, test } from "@playwright/test";

test("dashboard upload flow carries a new file through upload and review entry", async ({
  page,
}, testInfo) => {
  const fileName = `upload-happy-${Date.now()}.csv`;
  const filePath = testInfo.outputPath(fileName);

  await fs.writeFile(
    filePath,
    [
      "invoice_number,customer_name,due_date,amount_outstanding",
      `INV-${Date.now()},Northwind Service,2026-04-15,4200`,
    ].join("\n"),
    "utf8",
  );

  await page.goto("/dashboard");
  await page.getByRole("button", { name: "Upload files" }).click();
  const modal = page.getByRole("dialog", { name: "Upload files" });

  await expect(modal).toBeVisible();
  await expect(
    modal.getByRole("button", { name: "Upload", exact: true }),
  ).toBeDisabled();

  await modal.locator("#upload-files-input").setInputFiles(filePath);

  await expect(modal.getByText(fileName)).toBeVisible();
  await expect(modal.getByText("What happens after you click upload")).toBeVisible();
  await expect(modal.getByText("Saved your file")).toBeVisible();
  await expect(modal.getByText("Checked the file")).toBeVisible();
  await expect(modal.getByText("Prepared the file for review")).toBeVisible();

  const uploadResponsePromise = page.waitForResponse(
    (response) =>
      response.url().includes("/api/ingest/upload") &&
      response.request().method() === "POST",
  );

  await modal.getByRole("button", { name: "Upload", exact: true }).click();

  await expect(modal.getByRole("button", { name: "Uploading..." })).toBeVisible();
  await expect(modal.getByText("Working on your file now")).toBeVisible();

  const uploadResponse = await uploadResponsePromise;
  const uploadPayload = (await uploadResponse.json()) as {
    documentId: string;
  };

  await expect(modal.getByText("Document ID")).toBeVisible();
  await expect(modal.getByText(uploadPayload.documentId)).toBeVisible();
  await expect(modal.getByRole("button", { name: "Open Pipeline" })).toBeVisible();
  await expect(
    modal.getByRole("button", { name: /Review file|Follow progress/i }),
  ).toBeVisible();

  await page.goto(`/explorer?documentId=${encodeURIComponent(uploadPayload.documentId)}`);

  await expect(
    page.getByRole("heading", { name: fileName }),
  ).toBeVisible();
  await expect(
    page.getByText(/Ready to review|Still getting it ready|Needs attention/i),
  ).toBeVisible();
});

test("pipeline upload flow explains duplicates and validation errors clearly", async ({
  page,
}, testInfo) => {
  const duplicateFileName = `upload-duplicate-${Date.now()}.csv`;
  const duplicateFilePath = testInfo.outputPath(duplicateFileName);
  const invalidFilePath = testInfo.outputPath(`upload-invalid-${Date.now()}.xlsx`);

  await fs.writeFile(
    duplicateFilePath,
    [
      "invoice_number,customer_name,due_date,amount_outstanding",
      `INV-${Date.now()},Acme Heating,2026-04-18,2100`,
    ].join("\n"),
    "utf8",
  );
  await fs.writeFile(invalidFilePath, "this is not really an xlsx file", "utf8");

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
  await expect(modal.getByRole("button", { name: "Upload another" })).toBeVisible();

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
  await expect(modal.getByText("Choose a different file")).toBeVisible();
});
