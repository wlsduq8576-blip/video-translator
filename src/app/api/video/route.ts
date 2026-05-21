import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import os from 'os';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return new NextResponse('Missing video id', { status: 400 });
  }

  // Prevent directory traversal attacks by using path.basename
  const safeId = path.basename(id);
  const tempDir = path.join(os.tmpdir(), 'transcribe-app');
  const videoPath = path.join(tempDir, safeId);

  if (!fs.existsSync(videoPath)) {
    return new NextResponse('Video not found', { status: 404 });
  }

  const stat = fs.statSync(videoPath);
  const fileSize = stat.size;
  const range = req.headers.get('range');

  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

    if (start >= fileSize || end >= fileSize) {
      return new NextResponse('Requested range not satisfiable', {
        status: 416,
        headers: { 'Content-Range': `bytes */${fileSize}` },
      });
    }

    const chunksize = end - start + 1;
    const file = fs.createReadStream(videoPath, { start, end });
    
    const stream = new ReadableStream({
      start(controller) {
        file.on('data', (chunk) => controller.enqueue(chunk));
        file.on('end', () => controller.close());
        file.on('error', (err) => controller.error(err));
      },
      cancel() {
        file.destroy();
      }
    });

    return new NextResponse(stream as any, {
      status: 206,
      headers: {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize.toString(),
        'Content-Type': 'video/mp4',
      },
    });
  } else {
    const file = fs.createReadStream(videoPath);
    const stream = new ReadableStream({
      start(controller) {
        file.on('data', (chunk) => controller.enqueue(chunk));
        file.on('end', () => controller.close());
        file.on('error', (err) => controller.error(err));
      },
      cancel() {
        file.destroy();
      }
    });

    return new NextResponse(stream as any, {
      headers: {
        'Content-Length': fileSize.toString(),
        'Content-Type': 'video/mp4',
      },
    });
  }
}
export const dynamic = 'force-dynamic';
