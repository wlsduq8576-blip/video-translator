import { NextRequest, NextResponse } from 'next/server';
// Force Next.js dev server recompilation - touch route.ts
import path from 'path';
import fs from 'fs';
import os from 'os';
import { downloadAudio, ensureYtDlp } from '@/lib/yt-dlp-helper';
import { extractAudio } from '@/lib/ffmpeg-helper';
import { transcribeAndTranslate } from '@/lib/gemini-helper';
import { execFile } from 'child_process';

function getYouTubeId(url: string): string | null {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
}

export async function POST(req: NextRequest) {
  // Use OS-level temp directory to completely avoid Korean path encoding issues
  const tempDir = path.join(os.tmpdir(), 'transcribe-app');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  try {
    const formData = await req.formData();
    const apiKey = formData.get('apiKey') as string;
    const url = formData.get('url') as string;
    const file = formData.get('file') as File | null;

    if (!apiKey) {
      return NextResponse.json({ error: 'Gemini API Key is required.' }, { status: 400 });
    }

    let audioPath = '';
    let videoUrl = ''; 
    let mediaType: 'youtube' | 'instagram' | 'local' = 'local';
    const tempFilesToDelete: string[] = [];

    if (url) {
      const isVercel = !!process.env.VERCEL;
      if (isVercel) {
        return NextResponse.json({ 
          error: 'Vercel 환경에서는 유튜브/인스타그램 링크 다운로드가 지원되지 않습니다. 컴퓨터에 있는 영상/음성 파일을 직접 업로드해 주세요.' 
        }, { status: 400 });
      }

      const ytId = getYouTubeId(url);
      if (ytId) {
        mediaType = 'youtube';
        videoUrl = ytId;
        console.log(`Processing YouTube link: ${url}`);
        audioPath = await downloadAudio(url, tempDir);
        tempFilesToDelete.push(audioPath);
      } else if (url.includes('instagram.com') || url.includes('ig.me')) {
        mediaType = 'instagram';
        console.log(`Processing Instagram link: ${url}`);
        
        const ytDlpPath = await ensureYtDlp();
        const outputVideoName = `ig_${Date.now()}.mp4`;
        const videoFile = path.join(tempDir, outputVideoName);
        
        await new Promise<void>((resolve, reject) => {
          const args = [
            url,
            '-f', 'mp4/best',
            '-o', videoFile,
            '--no-playlist',
            '--user-agent',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          ];
          
          execFile(ytDlpPath, args, (err, stdout, stderr) => {
            if (err) {
              return reject(new Error(`Failed to download Instagram video: ${err.message}. Stderr: ${stderr}`));
            }
            console.log('Instagram video downloaded successfully.');
            resolve();
          });
        });

        if (!fs.existsSync(videoFile)) {
          // Fallback: Check if there's any file matching ig_*.mp4 in the folder
          const files = fs.readdirSync(tempDir)
            .map(f => path.join(tempDir, f))
            .filter(f => path.basename(f).startsWith('ig_') && f.endsWith('.mp4'));
          
          if (files.length > 0) {
            files.sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
            audioPath = await extractAudio(files[0], tempDir);
            const videoFileName = path.basename(files[0]);
            videoUrl = `/api/video?id=${encodeURIComponent(videoFileName)}`;
          } else {
            throw new Error('Instagram video file was not found in temp directory.');
          }
        } else {
          audioPath = await extractAudio(videoFile, tempDir);
          const videoFileName = path.basename(videoFile);
          videoUrl = `/api/video?id=${encodeURIComponent(videoFileName)}`;
        }
        
        tempFilesToDelete.push(audioPath);
      } else {
        return NextResponse.json({ error: 'Unsupported video link. Please provide a YouTube or Instagram link.' }, { status: 400 });
      }
    } else if (file) {
      mediaType = 'local';
      console.log(`Processing uploaded file: ${file.name}`);
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const tempInputPath = path.join(tempDir, `upload_${Date.now()}_${file.name}`);
      
      fs.writeFileSync(tempInputPath, buffer);
      tempFilesToDelete.push(tempInputPath);

      // On Vercel, bypass ffmpeg extraction and send the file directly to Gemini
      const isVercel = !!process.env.VERCEL;
      if (isVercel) {
        console.log('Running on Vercel environment: Bypassing ffmpeg extraction.');
        audioPath = tempInputPath;
      } else {
        try {
          audioPath = await extractAudio(tempInputPath, tempDir);
          if (audioPath !== tempInputPath) {
            tempFilesToDelete.push(audioPath);
          }
        } catch (e) {
          console.warn('ffmpeg extraction failed, falling back to direct upload:', e);
          audioPath = tempInputPath;
        }
      }
    } else {
      return NextResponse.json({ error: 'No media URL or file provided.' }, { status: 400 });
    }

    // Determine MIME type
    let mimeType = 'audio/mp3';
    if (file) {
      mimeType = file.type;
      if (!mimeType || mimeType === 'application/octet-stream') {
        const ext = path.extname(file.name).toLowerCase();
        const mimeMap: Record<string, string> = {
          '.mp3': 'audio/mp3',
          '.wav': 'audio/wav',
          '.ogg': 'audio/ogg',
          '.m4a': 'audio/m4a',
          '.aac': 'audio/aac',
          '.flac': 'audio/flac',
          '.mp4': 'video/mp4',
          '.webm': 'video/webm',
          '.mov': 'video/mov',
          '.mkv': 'video/mkv',
          '.avi': 'video/avi',
          '.mpeg': 'video/mpeg',
          '.mpg': 'video/mpeg',
        };
        mimeType = mimeMap[ext] || 'audio/mp3';
      }
    }

    console.log(`Running Gemini transcription on: ${audioPath} with mimeType: ${mimeType}`);
    const scriptSegments = await transcribeAndTranslate(apiKey, audioPath, mimeType);

    for (const f of tempFilesToDelete) {
      if (fs.existsSync(f)) {
        try {
          fs.unlinkSync(f);
          console.log(`Cleaned up temporary file: ${f}`);
        } catch (e) {
          console.error(`Failed to delete temporary file ${f}:`, e);
        }
      }
    }

    return NextResponse.json({
      success: true,
      mediaType,
      videoUrl,
      segments: scriptSegments,
    });

  } catch (error: any) {
    console.error('API /api/transcribe Error:', error);
    return NextResponse.json({ error: error.message || 'An error occurred during transcription.' }, { status: 500 });
  }
}
export const maxDuration = 60; // Next.js API Timeout extension to 60s for Vercel if needed
