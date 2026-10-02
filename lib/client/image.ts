// Prepares a capture in the browser so one photo satisfies every YouCam API we call:
// Hair Length / Hair Type need >= 320 px per side; Hairstyle and Hair Extension VTO need JPG with
// the long side <= 1024 px; Hair Type needs its three scan photos to be exactly the same size.
// So every capture is centre-cropped to 4:5 and scaled to 640 x 800.

export type PreparedPhoto = { blob: Blob; dataUrl: string; width: number; height: number };

export class CaptureError extends Error {}

export const PHOTO_W = 640;
export const PHOTO_H = 800;
const MIN_SIDE = 320;

export async function preparePhoto(file: Blob): Promise<PreparedPhoto> {
  if (!file.type.startsWith("image/")) throw new CaptureError("That file isn't an image. Please choose a photo.");
  if (file.size > 25 * 1024 * 1024) throw new CaptureError("That photo is very large. Please choose a smaller one.");

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new CaptureError("We couldn't read this photo format. Try a JPG or PNG, or take a new photo.");
  }

  const { width: w0, height: h0 } = bitmap;
  if (Math.min(w0, h0) < MIN_SIDE) {
    bitmap.close();
    throw new CaptureError("This photo is too small. It needs to be at least 320 pixels on each side.");
  }

  // Centre-crop to 4:5, keeping a little more of the top so hair isn't cut off.
  const targetRatio = PHOTO_W / PHOTO_H;
  let sw = w0;
  let sh = h0;
  if (w0 / h0 > targetRatio) sw = Math.round(h0 * targetRatio);
  else sh = Math.round(w0 / targetRatio);
  const sx = Math.round((w0 - sw) / 2);
  const sy = Math.round((h0 - sh) * 0.35);
  if (sh < MIN_SIDE) {
    bitmap.close();
    throw new CaptureError("This photo is too wide and short. Use a portrait photo showing your head and shoulders.");
  }

  const canvas = document.createElement("canvas");
  canvas.width = PHOTO_W;
  canvas.height = PHOTO_H;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#fff"; // flatten transparency before JPEG encoding
  ctx.fillRect(0, 0, PHOTO_W, PHOTO_H);
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, sx, sy, sw, sh, 0, 0, PHOTO_W, PHOTO_H);
  bitmap.close();

  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.9));
  if (!blob) throw new CaptureError("We couldn't prepare this photo. Please try another.");
  return { blob, dataUrl: canvas.toDataURL("image/jpeg", 0.9), width: PHOTO_W, height: PHOTO_H };
}
