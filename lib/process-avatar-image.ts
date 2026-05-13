/** Square avatar output size (CSS pixels). */
const AVATAR_SIZE = 512;
const JPEG_QUALITY = 0.88;

function sharpenInPlace(imageData: ImageData): void {
  const { width, height, data } = imageData;
  const src = new Uint8ClampedArray(data);
  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const i = (y * width + x) * 4;
      for (let c = 0; c < 3; c += 1) {
        const center = src[i + c];
        const left = src[i - 4 + c];
        const right = src[i + 4 + c];
        const up = src[i - width * 4 + c];
        const down = src[i + width * 4 + c];
        const v = 5 * center - left - right - up - down;
        data[i + c] = Math.max(0, Math.min(255, v));
      }
    }
  }
}

/**
 * Load an image file, crop to centered square cover, resize to AVATAR_SIZE,
 * apply mild sharpening, export as JPEG data URL for storage.
 */
export async function processAvatarImageFile(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("invalidType");
  }
  const maxBytes = 12 * 1024 * 1024;
  if (file.size > maxBytes) {
    throw new Error("tooLarge");
  }

  const bitmap = await createImageBitmap(file);
  try {
    const canvas = document.createElement("canvas");
    canvas.width = AVATAR_SIZE;
    canvas.height = AVATAR_SIZE;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("noContext");

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    const iw = bitmap.width;
    const ih = bitmap.height;
    const scale = Math.max(AVATAR_SIZE / iw, AVATAR_SIZE / ih);
    const dw = iw * scale;
    const dh = ih * scale;
    const dx = (AVATAR_SIZE - dw) / 2;
    const dy = (AVATAR_SIZE - dh) / 2;
    ctx.drawImage(bitmap, dx, dy, dw, dh);

    const imageData = ctx.getImageData(0, 0, AVATAR_SIZE, AVATAR_SIZE);
    sharpenInPlace(imageData);
    ctx.putImageData(imageData, 0, 0);

    return canvas.toDataURL("image/jpeg", JPEG_QUALITY);
  } finally {
    bitmap.close();
  }
}
