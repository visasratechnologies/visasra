import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

describe('Upload Integrity & Magic-Byte Validation Test Suite', () => {
  function detectMimeFromBytes(buffer) {
    if (!buffer || buffer.length < 4) return null;

    // JPEG: FF D8 FF
    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
      return 'image/jpeg';
    }

    // PNG: 89 50 4E 47 0D 0A 1A 0A
    if (
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47
    ) {
      return 'image/png';
    }

    // WebP: RIFF ... WEBP
    if (
      buffer.length >= 12 &&
      buffer[0] === 0x52 &&
      buffer[1] === 0x49 &&
      buffer[2] === 0x46 &&
      buffer[3] === 0x46 &&
      buffer[8] === 0x57 &&
      buffer[9] === 0x45 &&
      buffer[10] === 0x42 &&
      buffer[11] === 0x50
    ) {
      return 'image/webp';
    }

    // PDF: %PDF (25 50 44 46)
    if (
      buffer[0] === 0x25 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x44 &&
      buffer[3] === 0x46
    ) {
      return 'application/pdf';
    }

    return null;
  }

  function validateUploadPayload(buffer, claimedMime, maxSizeBytes = 10 * 1024 * 1024) {
    if (!buffer || buffer.length === 0) {
      return { valid: false, error: 'Empty file' };
    }

    if (buffer.length > maxSizeBytes) {
      return { valid: false, error: 'File size exceeds maximum 10MB limit' };
    }

    const detectedMime = detectMimeFromBytes(buffer);
    if (!detectedMime) {
      return { valid: false, error: 'Unsupported or unverified file type' };
    }

    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedMimes.includes(detectedMime)) {
      return { valid: false, error: `Disallowed MIME type: ${detectedMime}` };
    }

    return { valid: true, detectedMime };
  }

  test('Valid JPEG header (FF D8 FF) is detected as image/jpeg', () => {
    const jpegBuf = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46]);
    const res = validateUploadPayload(jpegBuf, 'image/jpeg');
    assert.strictEqual(res.valid, true);
    assert.strictEqual(res.detectedMime, 'image/jpeg');
  });

  test('Valid PNG header (89 50 4E 47) is detected as image/png', () => {
    const pngBuf = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const res = validateUploadPayload(pngBuf, 'image/png');
    assert.strictEqual(res.valid, true);
    assert.strictEqual(res.detectedMime, 'image/png');
  });

  test('Valid WebP header (RIFF...WEBP) is detected as image/webp', () => {
    const webpBuf = Buffer.from([
      0x52, 0x49, 0x46, 0x46, // RIFF
      0x00, 0x00, 0x00, 0x00, // Size
      0x57, 0x45, 0x42, 0x50, // WEBP
      0x56, 0x50, 0x38, 0x20, // VP8
    ]);
    const res = validateUploadPayload(webpBuf, 'image/webp');
    assert.strictEqual(res.valid, true);
    assert.strictEqual(res.detectedMime, 'image/webp');
  });

  test('Valid PDF header (%PDF) is detected as application/pdf', () => {
    const pdfBuf = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]);
    const res = validateUploadPayload(pdfBuf, 'application/pdf');
    assert.strictEqual(res.valid, true);
    assert.strictEqual(res.detectedMime, 'application/pdf');
  });

  test('Disguised HTML file with .jpg extension is rejected by magic bytes', () => {
    const fakeJpg = Buffer.from('<html><script>alert("XSS")</script></html>');
    const res = validateUploadPayload(fakeJpg, 'image/jpeg');
    assert.strictEqual(res.valid, false);
    assert.match(res.error, /Unsupported or unverified/i);
  });

  test('Disguised Windows executable (MZ header) is rejected', () => {
    const fakeExe = Buffer.from([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00]); // MZ DOS header
    const res = validateUploadPayload(fakeExe, 'image/png');
    assert.strictEqual(res.valid, false);
    assert.match(res.error, /Unsupported or unverified/i);
  });

  test('File exceeding 10MB ceiling boundary is rejected', () => {
    // 11MB fake buffer
    const largeBuf = Buffer.alloc(11 * 1024 * 1024);
    largeBuf[0] = 0xff;
    largeBuf[1] = 0xd8;
    largeBuf[2] = 0xff;
    const res = validateUploadPayload(largeBuf, 'image/jpeg');
    assert.strictEqual(res.valid, false);
    assert.match(res.error, /exceeds maximum 10MB/i);
  });
});
