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

  const tempFilesToDelete: string[] = [];

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

    if (url) {
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
        tempFilesToDelete.push(videoFile); // Ensure the raw video file gets deleted
        
        await new Promise<void>((resolve, reject) => {
          const args = [
            url,
            '-f', 'mp4/best',
            '-o', videoFile,
            '--no-playlist',
            '--no-check-certificate',
            '--referer', 'https://www.instagram.com/',
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

        let selectedVideoFile = '';

        if (!fs.existsSync(videoFile)) {
          // Fallback: Check if there's any file matching ig_*.mp4 in the folder
          const files = fs.readdirSync(tempDir)
            .map(f => path.join(tempDir, f))
            .filter(f => path.basename(f).startsWith('ig_') && f.endsWith('.mp4'));
          
          if (files.length > 0) {
            files.sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
            selectedVideoFile = files[0];
            tempFilesToDelete.push(selectedVideoFile); // Ensure fallback is cleaned up too
          } else {
            throw new Error('인스타그램 영상 다운로드에 실패했습니다. (서버 IP가 차단되었거나 유효하지 않은 링크입니다.)');
          }
        } else {
          selectedVideoFile = videoFile;
        }

        // Validate file size to detect block page or 0-byte failures (under 50KB is invalid)
        if (fs.existsSync(selectedVideoFile)) {
          const fileStat = fs.statSync(selectedVideoFile);
          if (fileStat.size < 50 * 1024) {
            throw new Error('인스타그램에서 다운로드를 차단했습니다. (가상 서버 IP가 차단되었거나 비공개 계정 영상입니다.) 다른 릴스 영상으로 시도해 주세요.');
          }
        } else {
          throw new Error('인스타그램 영상 파일이 생성되지 않았습니다.');
        }

        audioPath = await extractAudio(selectedVideoFile, tempDir);
        tempFilesToDelete.push(audioPath);
        const videoFileName = path.basename(selectedVideoFile);
        videoUrl = `/api/video?id=${encodeURIComponent(videoFileName)}`;
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

      try {
        audioPath = await extractAudio(tempInputPath, tempDir);
        if (audioPath !== tempInputPath) {
          tempFilesToDelete.push(audioPath);
        }
      } catch (e) {
        console.warn('ffmpeg extraction failed, falling back to direct upload:', e);
        audioPath = tempInputPath;
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

    return NextResponse.json({
      success: true,
      mediaType,
      videoUrl,
      segments: scriptSegments,
    });

  } catch (error: any) {
    console.error('API /api/transcribe Error:', error);
    return NextResponse.json({ error: error.message || 'An error occurred during transcription.' }, { status: 500 });
  } finally {
    // Unconditionally clean up temporary files to guarantee zero footprint
    console.log('Unconditionally cleaning up temporary files to maintain zero footprint...');
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
  }
}
export const maxDuration = 60; // Next.js API Timeout extension to 60s for Vercel if needed
