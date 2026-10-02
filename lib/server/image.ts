import "server-only";

// Reads format and pixel size from the file header so bad captures are rejected
// before spending YouCam units. No image library needed.

export type ImageInfo = { type: "image/jpeg" | "image/png"; width: number; height: number };

export function readImageInfo(buf: Uint8Array): ImageInfo | null {
  // PNG: signature + IHDR
  if (buf.length > 24 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
    const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
    return { type: "image/png", width: dv.getUint32(16), height: dv.getUint32(20) };
  }
  // JPEG: walk markers until a SOFn frame header
  if (buf.length > 4 && buf[0] === 0xff && buf[1] === 0xd8) {
    let i = 2;
    while (i + 9 < buf.length) {
      if (buf[i] !== 0xff) {
        i++;
        continue;
      }
      const marker = buf[i + 1];
      const len = (buf[i + 2] << 8) | buf[i + 3];
      const isSOF = marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
      if (isSOF) {
        return {
          type: "image/jpeg",
          height: (buf[i + 5] << 8) | buf[i + 6],
          width: (buf[i + 7] << 8) | buf[i + 8],
        };
      }
      if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
        i += 2;
        continue;
      }
      i += 2 + len;
    }
  }
  return null;
}
