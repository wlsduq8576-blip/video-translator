'use client';

import React, { useRef, useState, useEffect } from 'react';
import { ScriptSegment } from '@/lib/gemini-helper';
import styles from './PlayerAndScript.module.css';

interface PlayerAndScriptProps {
  mediaType: 'youtube' | 'instagram' | 'local';
  videoUrl: string; // YouTube ID or Streaming proxy path
  localFileUrl: string | null; // Browser URL object for local files
  segments: ScriptSegment[];
}

export default function PlayerAndScript({
  mediaType,
  videoUrl,
  localFileUrl,
  segments,
}: PlayerAndScriptProps) {
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const [ytPlayer, setYtPlayer] = useState<any>(null);
  const [isReady, setIsReady] = useState(false);
  const [viewMode, setViewMode] = useState<'dual' | 'korean' | 'original'>('dual');

  const videoRef = useRef<HTMLVideoElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Track active index based on current time
  useEffect(() => {
    const idx = segments.findIndex(
      (seg) => currentTime >= seg.start && currentTime <= seg.end
    );
    if (idx !== -1 && idx !== activeIndex) {
      setActiveIndex(idx);
      // Auto-scroll to active element
      const activeEl = document.getElementById(`segment-${idx}`);
      if (activeEl && listRef.current) {
        activeEl.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        });
      }
    }
  }, [currentTime, segments, activeIndex]);

  // YouTube Iframe Player integration
  useEffect(() => {
    if (mediaType !== 'youtube') return;

    // Inject YouTube Iframe SDK if not present
    if (!(window as any).YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }

    let player: any;
    let timer: NodeJS.Timeout;

    const setupPlayer = () => {
      player = new (window as any).YT.Player('yt-iframe-player', {
        videoId: videoUrl,
        playerVars: {
          playsinline: 1,
          modestbranding: 1,
          rel: 0,
        },
        events: {
          onReady: () => {
            setIsReady(true);
          },
          onStateChange: (event: any) => {
            // State: 1 = Playing
            if (event.data === 1) {
              timer = setInterval(() => {
                if (player && typeof player.getCurrentTime === 'function') {
                  setCurrentTime(player.getCurrentTime());
                }
              }, 250);
            } else {
              clearInterval(timer);
            }
          },
        },
      });
      setYtPlayer(player);
    };

    if ((window as any).YT && (window as any).YT.Player) {
      setupPlayer();
    } else {
      // Global callback
      (window as any).onYouTubeIframeAPIReady = setupPlayer;
    }

    return () => {
      clearInterval(timer);
      if (player && typeof player.destroy === 'function') {
        player.destroy();
      }
    };
  }, [mediaType, videoUrl]);

  // Seek handler when clicking a timestamp
  const handleTimestampClick = (seconds: number) => {
    if (mediaType === 'youtube' && ytPlayer) {
      ytPlayer.seekTo(seconds, true);
      ytPlayer.playVideo();
    } else if (videoRef.current) {
      videoRef.current.currentTime = seconds;
      videoRef.current.play().catch(() => {});
    }
  };

  // Convert seconds to readable time format (e.g. 01:23)
  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    const pad = (n: number) => String(n).padStart(2, '0');
    
    if (hrs > 0) {
      return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
    }
    return `${pad(mins)}:${pad(secs)}`;
  };

  // Format time specifically for SRT
  const formatSrtTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);

    const pad = (n: number, size = 2) => String(n).padStart(size, '0');
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)},${pad(ms, 3)}`;
  };

  // Copy transcripts to clipboard
  const handleCopyText = () => {
    let textContent = '';
    segments.forEach((seg) => {
      const timeStr = `[${formatTime(seg.start)}]`;
      if (viewMode === 'dual') {
        textContent += `${timeStr} (${seg.originalText})\n${seg.translatedText}\n\n`;
      } else if (viewMode === 'korean') {
        textContent += `${timeStr} ${seg.translatedText}\n`;
      } else {
        textContent += `${timeStr} ${seg.originalText}\n`;
      }
    });

    navigator.clipboard.writeText(textContent);
    alert('대본이 클립보드에 복사되었습니다!');
  };

  // Download transcript as SRT
  const handleDownloadSRT = () => {
    let srtContent = '';
    segments.forEach((seg, i) => {
      srtContent += `${i + 1}\n`;
      srtContent += `${formatSrtTime(seg.start)} --> ${formatSrtTime(seg.end)}\n`;
      srtContent += `${seg.translatedText}\n\n`;
    });

    const blob = new Blob([srtContent], { type: 'text/srt;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'korean_script.srt');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={styles.container}>
      <div className={styles.playerSection}>
        <div className={styles.playerWrapper}>
          {mediaType === 'youtube' ? (
            <div id="yt-iframe-player" className={styles.ytPlayer} />
          ) : mediaType === 'instagram' ? (
            <video
              ref={videoRef}
              src={videoUrl}
              controls
              className={styles.videoPlayer}
              onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
            />
          ) : (
            <video
              ref={videoRef}
              src={localFileUrl || undefined}
              controls
              className={styles.videoPlayer}
              onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
            />
          )}
        </div>
        
        <div className={styles.controlBox}>
          <div className={styles.mediaTag}>
            <span className={`${styles.badge} ${styles[mediaType]}`}>
              {mediaType.toUpperCase()}
            </span>
            <span className={styles.durationInfo}>
              재생 시간: {formatTime(currentTime)}
            </span>
          </div>
          <div className={styles.actionButtons}>
            <button onClick={handleCopyText} className={styles.actionBtn}>
              📋 클립보드 복사
            </button>
            <button onClick={handleDownloadSRT} className={styles.actionBtn}>
              💾 SRT 자막 다운로드
            </button>
          </div>
        </div>
      </div>

      <div className={styles.scriptSection}>
        <div className={styles.scriptHeader}>
          <h3>📜 번역 스크립트</h3>
          <div className={styles.viewToggle}>
            <button
              onClick={() => setViewMode('dual')}
              className={viewMode === 'dual' ? styles.activeToggle : ''}
            >
              한/영 통합
            </button>
            <button
              onClick={() => setViewMode('korean')}
              className={viewMode === 'korean' ? styles.activeToggle : ''}
            >
              한국어 번역
            </button>
            <button
              onClick={() => setViewMode('original')}
              className={viewMode === 'original' ? styles.activeToggle : ''}
            >
              원문
            </button>
          </div>
        </div>

        <div className={styles.scriptList} ref={listRef}>
          {segments.map((seg, i) => (
            <div
              key={i}
              id={`segment-${i}`}
              className={`${styles.scriptItem} ${
                i === activeIndex ? styles.activeItem : ''
              }`}
              onClick={() => handleTimestampClick(seg.start)}
            >
              <button className={styles.timestampBtn}>
                ⏱️ {formatTime(seg.start)}
              </button>
              <div className={styles.textContent}>
                {(viewMode === 'dual' || viewMode === 'original') && (
                  <p className={styles.originalText}>{seg.originalText}</p>
                )}
                {(viewMode === 'dual' || viewMode === 'korean') && (
                  <p className={styles.translatedText}>{seg.translatedText}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
