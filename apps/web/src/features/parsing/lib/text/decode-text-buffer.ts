export function decodeTextBuffer(buffer: Buffer): string {
  if (buffer.byteLength === 0) {
    throw new Error("Text buffer is empty.");
  }

  if (hasUtf8Bom(buffer)) {
    return buffer.subarray(3).toString("utf8");
  }

  if (hasUtf16LeBom(buffer)) {
    return buffer.subarray(2).toString("utf16le");
  }

  if (hasUtf16BeBom(buffer)) {
    return decodeUtf16BeBuffer(buffer.subarray(2));
  }

  return buffer.toString("utf8");
}

function decodeUtf16BeBuffer(buffer: Buffer): string {
  const swappedBuffer = Buffer.alloc(buffer.length);

  for (let index = 0; index < buffer.length; index += 2) {
    swappedBuffer[index] = buffer[index + 1] ?? 0;
    swappedBuffer[index + 1] = buffer[index] ?? 0;
  }

  return swappedBuffer.toString("utf16le");
}

function hasUtf8Bom(buffer: Buffer): boolean {
  return (
    buffer.length >= 3 &&
    buffer[0] === 0xef &&
    buffer[1] === 0xbb &&
    buffer[2] === 0xbf
  );
}

function hasUtf16LeBom(buffer: Buffer): boolean {
  return buffer.length >= 2 && buffer[0] === 0xff && buffer[1] === 0xfe;
}

function hasUtf16BeBom(buffer: Buffer): boolean {
  return buffer.length >= 2 && buffer[0] === 0xfe && buffer[1] === 0xff;
}
