import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { z } from "zod";

type CollectionRecord = {
  id: string;
};

export interface LocalJsonCollection<RecordType extends CollectionRecord> {
  deleteById(id: string): Promise<void>;
  getById(id: string): Promise<RecordType | null>;
  list(): Promise<RecordType[]>;
  put(record: RecordType): Promise<RecordType>;
}

type CreateLocalJsonCollectionInput<RecordType extends CollectionRecord> = {
  filePath: string;
  recordSchema: z.ZodType<RecordType>;
};

export function createLocalJsonCollection<RecordType extends CollectionRecord>({
  filePath,
  recordSchema,
}: CreateLocalJsonCollectionInput<RecordType>): LocalJsonCollection<RecordType> {
  const absoluteFilePath = path.resolve(filePath);
  const collectionSchema = z.array(recordSchema);

  return {
    async getById(id) {
      const records = await readCollection();

      return records.find((record) => record.id === id) ?? null;
    },
    async list() {
      return readCollection();
    },
    async deleteById(id) {
      const records = await readCollection();
      const nextRecords = records.filter((record) => record.id !== id);

      await writeCollection(nextRecords);
    },
    async put(record) {
      const parsedRecord = recordSchema.parse(record);
      const records = await readCollection();
      const nextRecords = records.filter(
        (existingRecord) => existingRecord.id !== parsedRecord.id,
      );

      nextRecords.push(parsedRecord);
      await writeCollection(nextRecords);

      return parsedRecord;
    },
  };

  async function readCollection(): Promise<RecordType[]> {
    try {
      const rawCollection = await readFile(absoluteFilePath, "utf8");

      return collectionSchema.parse(JSON.parse(rawCollection));
    } catch (error) {
      if (isMissingFileError(error)) {
        return [];
      }

      throw error;
    }
  }

  async function writeCollection(records: RecordType[]): Promise<void> {
    await mkdir(path.dirname(absoluteFilePath), { recursive: true });
    await writeFile(absoluteFilePath, JSON.stringify(records, null, 2));
  }
}

function isMissingFileError(error: unknown): error is NodeJS.ErrnoException {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "ENOENT"
  );
}
