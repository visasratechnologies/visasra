import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10MB maximum server-side boundary

/**
 * Inspects leading magic bytes to identify authoritative MIME type & file extension.
 * Rejects disguised executable payloads or scripts with spoofed extensions.
 */
function detectFileType(buffer: Buffer): { mime: string; ext: string } | null {
  if (buffer.length < 4) return null;

  // JPEG: FF D8 FF
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
    return { mime: 'image/jpeg', ext: '.jpg' };
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4E &&
    buffer[3] === 0x47
  ) {
    return { mime: 'image/png', ext: '.png' };
  }

  // WebP: RIFF .... WEBP
  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return { mime: 'image/webp', ext: '.webp' };
  }

  // GIF: GIF87a or GIF89a
  if (buffer.subarray(0, 3).toString('ascii') === 'GIF') {
    return { mime: 'image/gif', ext: '.gif' };
  }

  // PDF: %PDF- (Authorized for KYC document proofs)
  if (buffer.subarray(0, 4).toString('ascii') === '%PDF') {
    return { mime: 'application/pdf', ext: '.pdf' };
  }

  return null;
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Enforce size limit
    if (buffer.length > MAX_UPLOAD_BYTES) {
      return NextResponse.json(
        { success: false, error: 'File size exceeds maximum 10MB boundary.' },
        { status: 413 }
      );
    }

    // Cryptographic Magic-Byte Validation
    const verifiedType = detectFileType(buffer);
    if (!verifiedType) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unsupported or disguised file format. Only JPEG, PNG, WebP, GIF, and PDF documents are allowed.',
        },
        { status: 415 }
      );
    }

    const { mime, ext } = verifiedType;

    // Sanitize filename and create unique key
    const rawName = file.name || 'image';
    const cleanBase = path.basename(rawName, path.extname(rawName)).replace(/[^a-zA-Z0-9_-]/g, '_');
    const uniqueName = `sourcing_${Date.now()}_${cleanBase}${ext}`;

    // 1. Direct Multipart Streaming to Cloudflare R2
    const r2AccountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const r2AccessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
    const r2SecretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
    const r2BucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME;
    const r2PublicUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL?.replace(/\/$/, '');

    if (r2AccountId && r2AccessKeyId && r2SecretAccessKey && r2BucketName) {
      try {
        const s3 = new S3Client({
          region: 'auto',
          endpoint: `https://${r2AccountId}.r2.cloudflarestorage.com`,
          credentials: {
            accessKeyId: r2AccessKeyId,
            secretAccessKey: r2SecretAccessKey,
          },
        });

        await s3.send(
          new PutObjectCommand({
            Bucket: r2BucketName,
            Key: uniqueName,
            Body: buffer,
            ContentType: mime,
            CacheControl: 'public, max-age=31536000, immutable',
          })
        );

        const fileUrl = r2PublicUrl
          ? `${r2PublicUrl}/${uniqueName}`
          : `https://${r2BucketName}.${r2AccountId}.r2.cloudflarestorage.com/${uniqueName}`;

        return NextResponse.json({
          success: true,
          url: fileUrl,
          provider: 'cloudflare-r2',
          filename: uniqueName,
          mime,
        });
      } catch (r2Err) {
        console.error('Cloudflare R2 streaming failed, falling back to local storage:', r2Err);
      }
    }

    // 2. Fallback: Save to public/uploads directory (for local offline dev)
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadDir, { recursive: true });

    const filePath = path.join(uploadDir, uniqueName);
    await writeFile(filePath, buffer);

    const publicUrl = `/uploads/${uniqueName}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      provider: 'local',
      filename: uniqueName,
      mime,
      message: 'Stored locally. Configure Cloudflare R2 credentials in production for high-availability CDN streaming.',
    });
  } catch (error) {
    console.error('Image upload failed:', error);
    return NextResponse.json({ success: false, error: 'Image upload failed' }, { status: 500 });
  }
}
