export type OcrResult = {
  confidenceScore: number;
  text: string;
};

export interface OcrEngine {
  recognizeImage(buffer: Buffer): Promise<OcrResult>;
}
