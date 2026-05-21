import path from 'path';
import fs from 'fs';
import { execFile, execSync } from 'child_process';
import ffmpegStaticPath from 'ffmpeg-static';

const BIN_DIR = path.join(process.cwd(), '.bin');
const isWindows = process.platform === 'win32';
const YT_DLP_FILENAME = isWindows ? 'yt-dlp.exe' : 'yt-dlp';
const YT_DLP_PATH = path.join(BIN_DIR, YT_DLP_FILENAME);
const YT_DLP_URL = isWindows
  ? 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe'
  : 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp';

function getFfmpegPath(): string | null {
  const localWinPath = path.join(process.cwd(), 'node_modules', 'ffmpeg-static', 'ffmpeg.exe');
  if (fs.existsSync(localWinPath)) {
    return localWinPath;
  }
  const localUnixPath = path.join(process.cwd(), 'node_modules', 'ffmpeg-static', 'ffmpeg');
  if (fs.existsSync(localUnixPath)) {
    return localUnixPath;
  }
  if (ffmpegStaticPath && fs.existsSync(ffmpegStaticPath)) {
    return ffmpegStaticPath;
  }
  // Check if ffmpeg is in system PATH
  try {
    execSync('ffmpeg -version', { stdio: 'ignore' });
    return 'ffmpeg';
  } catch {
    // ignore
  }
  return null;
}

export async function ensureYtDlp(): Promise<string> {
  // 1. Check if yt-dlp is available in the system PATH (e.g. Docker environment)
  try {
    execSync('yt-dlp --version', { stdio: 'ignore' });
    return 'yt-dlp';
  } catch {
    // ignore
  }

  if (!fs.existsSync(BIN_DIR)) {
    fs.mkdirSync(BIN_DIR, { recursive: true });
  }

  if (fs.existsSync(YT_DLP_PATH)) {
    try {
      // Check if it's executable
      fs.accessSync(YT_DLP_PATH, fs.constants.X_OK);
      return YT_DLP_PATH;
    } catch {
      if (!isWindows) {
        try {
          fs.chmodSync(YT_DLP_PATH, 0o755);
        } catch (e) {
          console.warn('Failed to chmod local yt-dlp:', e);
        }
      }
      return YT_DLP_PATH;
    }
  }

  console.log(`Downloading yt-dlp binary for ${process.platform} from GitHub...`);
  const response = await fetch(YT_DLP_URL);
  if (!response.ok) {
    throw new Error(`Failed to download yt-dlp: ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  fs.writeFileSync(YT_DLP_PATH, buffer);
  
  if (!isWindows) {
    try {
      fs.chmodSync(YT_DLP_PATH, 0o755);
    } catch (e) {
      console.warn('Failed to chmod newly downloaded yt-dlp:', e);
    }
  }
  console.log('yt-dlp downloaded successfully.');

  return YT_DLP_PATH;
}

export async function downloadAudio(url: string, outputDir: string): Promise<string> {
  const ytDlpPath = await ensureYtDlp();
  
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Pre-define a unique absolute output path to avoid stdout parsing issues with Korean directories
  const targetFileName = `yt_${Date.now()}.mp3`;
  const outputFilePath = path.join(outputDir, targetFileName);

  return new Promise((resolve, reject) => {
    // Basic arguments for extraction. 
    // We tell yt-dlp to output to our exact pre-defined mp3 filename.
    const args = [
      url,
      '-x', // Extract audio
      '--audio-format', 'mp3',
      '-o', outputFilePath,
      '--no-playlist', // Only download the video, not the playlist
    ];

    const resolvedFfmpegPath = getFfmpegPath();
    if (resolvedFfmpegPath && resolvedFfmpegPath !== 'ffmpeg') {
      args.push('--ffmpeg-location', path.dirname(resolvedFfmpegPath));
    }

    if (url.includes('instagram.com') || url.includes('ig.me')) {
      args.push(
        '--user-agent',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      );
    }

    console.log(`Running yt-dlp at: ${ytDlpPath} with args:`, args);

    execFile(ytDlpPath, args, (error, stdout, stderr) => {
      if (error) {
        console.error('yt-dlp execution error:', stderr || stdout);
        return reject(new Error(`yt-dlp failed: ${error.message}. Stderr: ${stderr}`));
      }
      
      console.log('yt-dlp stdout completed.');
      
      // Verification: Since we passed the exact absolute output path, the file should exist
      if (fs.existsSync(outputFilePath)) {
        return resolve(outputFilePath);
      }

      // Fallback: Check if it downloaded with some variations (e.g. sometimes yt-dlp appends .mp3 to template)
      const files = fs.readdirSync(outputDir)
        .map(f => path.join(outputDir, f))
        .filter(f => f.endsWith('.mp3'));
      
      if (files.length > 0) {
        files.sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
        return resolve(files[0]);
      }

      reject(new Error('Audio file was not found in destination directory after download.'));
    });
  });
}
