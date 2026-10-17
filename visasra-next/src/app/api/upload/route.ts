import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Sanitize filename and create unique ID
    const ext = path.extname(file.name) || '.jpg';
    const cleanBase = path.basename(file.name, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const uniqueName = `sourcing_${Date.now()}_${cleanBase}${ext}`;

    // 1. Check for Cloudflare R2 credentials
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
            ContentType: file.type || 'image/jpeg',
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
        });
      } catch (r2Err) {
        console.error('Cloudflare R2 upload failed, falling back to local storage:', r2Err);
      }
    }

    // 2. Fallback: Save to public/uploads directory
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
      message: 'Stored locally. Provide CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_IMAGES_API_TOKEN or R2 credentials in .env to sync directly to Cloudflare.',
    });
  } catch (error) {
    console.error('Image upload failed:', error);
    return NextResponse.json({ success: false, error: 'Image upload failed' }, { status: 500 });
  }
}
