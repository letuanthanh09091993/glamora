/** Max longest edge for portfolio stills (keeps uploads fast, DB rows small). */
const PORTFOLIO_MAX_EDGE = 1920;
const JPEG_QUALITY = 0.86;
const MAX_SOURCE_BYTES = 24 * 1024 * 1024;

export async function processPortfolioImageFile(file: File): Promise<Blob> {
  if (!file.type.startsWith("image/")) {
    throw new Error("invalidType");
  }
  if (file.size > MAX_SOURCE_BYTES) {
    throw new Error("tooLarge");
  }

  const bitmap = await createImageBitmap(file);
  try {
    const iw = bitmap.width;
    const ih = bitmap.height;
    const scale = Math.min(1, PORTFOLIO_MAX_EDGE / Math.max(iw, ih));
    const w = Math.max(1, Math.round(iw * scale));
    const h = Math.max(1, Math.round(ih * scale));

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("noContext");

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(bitmap, 0, 0, w, h);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("encodeFailed"))),
        "image/jpeg",
        JPEG_QUALITY,
      );
    });
    return blob;
  } finally {
    bitmap.close();
  }
}
