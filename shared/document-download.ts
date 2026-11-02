/**
 * Document download helpers (CDN URL + JPEG/PNG→PDF).
 * Runtime copy lives in api/index.ts (Vercel single-file). Keep both in sync.
 */

import { deflateSync, inflateSync } from "zlib";

export function resolveCdnFileUrl(filePath: string): string | null {
  const raw = String(filePath || "").trim();
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw)) return raw;
  const cleaned = raw.startsWith("/") ? raw : `/${raw}`;
  return `https://disruptinglabs.com/data/api${cleaned}`;
}

export function isHtmlBuffer(buf: Buffer): boolean {
  if (!buf.length) return true;
  const head = buf
    .subarray(0, Math.min(64, buf.length))
    .toString("utf8")
    .trimStart();
  return (
    head.startsWith("<!DOCTYPE") ||
    head.startsWith("<!doctype") ||
    head.startsWith("<html") ||
    head.startsWith("<HTML")
  );
}

function detectImageKind(buf: Buffer): "jpeg" | "png" | null {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return "jpeg";
  }
  if (
    buf.length >= 8 &&
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47
  ) {
    return "png";
  }
  return null;
}

function readJpegSize(buf: Buffer): { width: number; height: number } | null {
  let i = 2;
  while (i + 9 < buf.length) {
    if (buf[i] !== 0xff) break;
    const marker = buf[i + 1];
    const len = (buf[i + 2] << 8) | buf[i + 3];
    if (marker === 0xc0 || marker === 0xc2) {
      const height = (buf[i + 5] << 8) | buf[i + 6];
      const width = (buf[i + 7] << 8) | buf[i + 8];
      if (width > 0 && height > 0) return { width, height };
    }
    i += 2 + len;
  }
  return null;
}

/** Minimal 1×1 JPEG (SOF0) for unit tests. */
export function buildTinyJpeg(): Buffer {
  // JFIF + SOF0 1x1 + EOI — small but valid enough for size parse + DCT embed
  return Buffer.from([
    0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
    0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xff, 0xc0, 0x00, 0x0b,
    0x08, 0x00, 0x01, 0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xff, 0xd9,
  ]);
}

function pngCrc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
  }
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type: string, data: Buffer): Buffer {
  const typeBuf = Buffer.from(type, "ascii");
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(pngCrc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

/** Minimal 1×1 RGB PNG (red pixel) for unit tests. */
export function buildTinyPng(): Buffer {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(1, 0);
  ihdr.writeUInt32BE(1, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type RGB
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  // filter 0 + R G B
  const idat = deflateSync(Buffer.from([0, 255, 0, 0]));
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", idat),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

function paethPredictor(a: number, b: number, c: number): number {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
}

/**
 * Decode PNG → raw RGB (8-bit). Supports color types 2 (RGB) and 6 (RGBA),
 * non-interlaced only. Returns null on unsupported/invalid input.
 */
export function pngToRgb(
  png: Buffer,
): { width: number; height: number; rgb: Buffer } | null {
  if (
    png.length < 8 ||
    png[0] !== 0x89 ||
    png[1] !== 0x50 ||
    png[2] !== 0x4e ||
    png[3] !== 0x47
  ) {
    return null;
  }

  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = -1;
  let interlace = 0;
  const idatParts: Buffer[] = [];
  let offset = 8;

  while (offset + 12 <= png.length) {
    const len = png.readUInt32BE(offset);
    const type = png.subarray(offset + 4, offset + 8).toString("ascii");
    const dataStart = offset + 8;
    const dataEnd = dataStart + len;
    if (dataEnd + 4 > png.length) return null;
    const data = png.subarray(dataStart, dataEnd);

    if (type === "IHDR") {
      if (len < 13) return null;
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
      interlace = data[12];
    } else if (type === "IDAT") {
      idatParts.push(Buffer.from(data));
    } else if (type === "IEND") {
      break;
    }

    offset = dataEnd + 4;
  }

  if (
    !width ||
    !height ||
    bitDepth !== 8 ||
    interlace !== 0 ||
    (colorType !== 2 && colorType !== 6) ||
    idatParts.length === 0
  ) {
    return null;
  }

  const bpp = colorType === 6 ? 4 : 3;
  let inflated: Buffer;
  try {
    inflated = inflateSync(Buffer.concat(idatParts));
  } catch {
    return null;
  }

  const stride = width * bpp;
  const expected = height * (1 + stride);
  if (inflated.length < expected) return null;

  const raw = Buffer.alloc(height * stride);
  let src = 0;
  for (let y = 0; y < height; y++) {
    const filter = inflated[src++];
    const rowStart = y * stride;
    const prevStart = (y - 1) * stride;
    for (let i = 0; i < stride; i++) {
      const x = inflated[src++];
      const a = i >= bpp ? raw[rowStart + i - bpp] : 0;
      const b = y > 0 ? raw[prevStart + i] : 0;
      const c = y > 0 && i >= bpp ? raw[prevStart + i - bpp] : 0;
      let val: number;
      switch (filter) {
        case 0:
          val = x;
          break;
        case 1:
          val = (x + a) & 0xff;
          break;
        case 2:
          val = (x + b) & 0xff;
          break;
        case 3:
          val = (x + ((a + b) >> 1)) & 0xff;
          break;
        case 4:
          val = (x + paethPredictor(a, b, c)) & 0xff;
          break;
        default:
          return null;
      }
      raw[rowStart + i] = val;
    }
  }

  if (colorType === 2) {
    return { width, height, rgb: raw };
  }

  // Strip alpha → RGB
  const rgb = Buffer.alloc(width * height * 3);
  for (let i = 0, j = 0; i < raw.length; i += 4, j += 3) {
    rgb[j] = raw[i];
    rgb[j + 1] = raw[i + 1];
    rgb[j + 2] = raw[i + 2];
  }
  return { width, height, rgb };
}

function rgbToSinglePagePdf(
  width: number,
  height: number,
  rgb: Buffer,
): Buffer {
  const compressed = deflateSync(rgb);
  const pageW = 612;
  const pageH = 792;
  const scale = Math.min(pageW / width, pageH / height);
  const drawW = width * scale;
  const drawH = height * scale;
  const ox = (pageW - drawW) / 2;
  const oy = (pageH - drawH) / 2;

  const objects: Buffer[] = [];
  const add = (body: string | Buffer) => {
    objects.push(typeof body === "string" ? Buffer.from(body, "utf8") : body);
  };

  add("<< /Type /Catalog /Pages 2 0 R >>");
  add("<< /Type /Pages /Kids [3 0 R] /Count 1 >>");
  add(
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageW} ${pageH}] /Contents 4 0 R /Resources << /XObject << /Im0 5 0 R >> >> >>`,
  );
  const content = `q ${drawW.toFixed(2)} 0 0 ${drawH.toFixed(2)} ${ox.toFixed(2)} ${oy.toFixed(2)} cm /Im0 Do Q\n`;
  add(`<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}endstream`);
  add(
    Buffer.concat([
      Buffer.from(
        `<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /FlateDecode /Length ${compressed.length} >>\nstream\n`,
        "utf8",
      ),
      compressed,
      Buffer.from("\nendstream", "utf8"),
    ]),
  );

  const parts: Buffer[] = [Buffer.from("%PDF-1.4\n", "utf8")];
  const offsets: number[] = [0];
  for (let i = 0; i < objects.length; i++) {
    offsets.push(Buffer.concat(parts).length);
    parts.push(
      Buffer.from(`${i + 1} 0 obj\n`, "utf8"),
      objects[i],
      Buffer.from("\nendobj\n", "utf8"),
    );
  }
  const body = Buffer.concat(parts);
  const xrefStart = body.length;
  let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= objects.length; i++) {
    xref += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  const trailer = `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;
  return Buffer.concat([
    body,
    Buffer.from(xref, "utf8"),
    Buffer.from(trailer, "utf8"),
  ]);
}

export function pngToSinglePagePdf(png: Buffer): Buffer | null {
  const decoded = pngToRgb(png);
  if (!decoded) return null;
  return rgbToSinglePagePdf(decoded.width, decoded.height, decoded.rgb);
}

export function jpegToSinglePagePdf(jpeg: Buffer): Buffer {
  const size = readJpegSize(jpeg) || { width: 612, height: 792 };
  const { width, height } = size;
  const pageW = 612;
  const pageH = 792;
  const scale = Math.min(pageW / width, pageH / height);
  const drawW = width * scale;
  const drawH = height * scale;
  const ox = (pageW - drawW) / 2;
  const oy = (pageH - drawH) / 2;

  const objects: Buffer[] = [];
  const add = (body: string | Buffer) => {
    objects.push(typeof body === "string" ? Buffer.from(body, "utf8") : body);
  };

  add("<< /Type /Catalog /Pages 2 0 R >>");
  add("<< /Type /Pages /Kids [3 0 R] /Count 1 >>");
  add(
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageW} ${pageH}] /Contents 4 0 R /Resources << /XObject << /Im0 5 0 R >> >> >>`,
  );
  const content = `q ${drawW.toFixed(2)} 0 0 ${drawH.toFixed(2)} ${ox.toFixed(2)} ${oy.toFixed(2)} cm /Im0 Do Q\n`;
  add(`<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}endstream`);
  add(
    Buffer.concat([
      Buffer.from(
        `<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`,
        "utf8",
      ),
      jpeg,
      Buffer.from("\nendstream", "utf8"),
    ]),
  );

  const parts: Buffer[] = [Buffer.from("%PDF-1.4\n", "utf8")];
  const offsets: number[] = [0];
  for (let i = 0; i < objects.length; i++) {
    offsets.push(Buffer.concat(parts).length);
    parts.push(
      Buffer.from(`${i + 1} 0 obj\n`, "utf8"),
      objects[i],
      Buffer.from("\nendobj\n", "utf8"),
    );
  }
  const body = Buffer.concat(parts);
  const xrefStart = body.length;
  let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= objects.length; i++) {
    xref += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  const trailer = `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;
  return Buffer.concat([
    body,
    Buffer.from(xref, "utf8"),
    Buffer.from(trailer, "utf8"),
  ]);
}

export function prepareDocumentDownloadBytes(
  raw: Buffer,
  opts: { documentType?: string | null; contentType?: string | null },
): { data: Buffer; extension: string; contentType: string } | null {
  if (!raw.length || isHtmlBuffer(raw)) return null;
  if (raw.length >= 5 && raw.subarray(0, 5).toString("utf8") === "%PDF-") {
    return {
      data: raw,
      extension: "pdf",
      contentType: "application/pdf",
    };
  }
  const kind = detectImageKind(raw);
  if (kind === "jpeg") {
    const pdf = jpegToSinglePagePdf(raw);
    return {
      data: pdf,
      extension: "pdf",
      contentType: "application/pdf",
    };
  }
  if (kind === "png") {
    const pdf = pngToSinglePagePdf(raw);
    if (pdf) {
      return {
        data: pdf,
        extension: "pdf",
        contentType: "application/pdf",
      };
    }
    // Unsupported PNG variant — keep original bytes
    return {
      data: raw,
      extension: "png",
      contentType: "image/png",
    };
  }
  // Content-type hints JPEG but magic bytes failed — still try JPEG→PDF
  const ct = String(opts.contentType || "").toLowerCase();
  if (ct.includes("jpeg") || ct.includes("jpg")) {
    try {
      const pdf = jpegToSinglePagePdf(raw);
      return {
        data: pdf,
        extension: "pdf",
        contentType: "application/pdf",
      };
    } catch {
      /* fall through */
    }
  }
  const ext =
    opts.documentType === "image"
      ? "jpg"
      : ct.includes("pdf")
        ? "pdf"
        : "bin";
  return {
    data: raw,
    extension: ext,
    contentType: opts.contentType || "application/octet-stream",
  };
}
