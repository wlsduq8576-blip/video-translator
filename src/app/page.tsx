'use client';

import React, { useState, useEffect } from 'react';
import PlayerAndScript from '@/components/PlayerAndScript';
import { ScriptSegment } from '@/lib/gemini-helper';
import styles from './page.module.css';

export default function Home() {
  const [apiKey, setApiKey] = useState('');
  const [showKeyInput, setShowKeyInput] = useState(true);
  const [activeTab, setActiveTab] = useState<'link' | 'upload'>('link');
  const [url, setUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isVercelEnv, setIsVercelEnv] = useState(false);
  
  // Loading & process states
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  
  // Results
  const [result, setResult] = useState<{
    mediaType: 'youtube' | 'instagram' | 'local';
    videoUrl: string;
    localFileUrl: string | null;
    segments: ScriptSegment[];
  } | null>(null);

  // Load API Key from localStorage on client side
  useEffect(() => {
    const savedKey = localStorage.getItem('gemini_api_key');
    if (savedKey) {
      setApiKey(savedKey);
      setShowKeyInput(false);
    }

    // Check if hosted on Vercel
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      if (hostname.endsWith('.vercel.app') || hostname.includes('vercel')) {
        setIsVercelEnv(true);
        setActiveTab('upload');
      }
    }
  }, []);

  const handleSaveKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKey.trim()) {
      localStorage.setItem('gemini_api_key', apiKey.trim());
      setShowKeyInput(false);
    }
  };

  const handleClearKey = () => {
    localStorage.removeItem('gemini_api_key');
    setApiKey('');
    setShowKeyInput(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey) {
      alert('Gemini API Key가 필요합니다.');
      return;
    }

    if (activeTab === 'link' && !url) {
      alert('영상 링크를 입력해주세요.');
      return;
    }

    if (activeTab === 'upload' && !file) {
      alert('업로드할 영상 또는 음성 파일을 선택해주세요.');
      return;
    }

    setLoading(true);
    setResult(null);

    // Dynamic state messages based on input type
    if (activeTab === 'link') {
      setStatusMessage('서버에서 오디오/비디오 스트림 다운로드 중 (yt-dlp)... 📥');
    } else {
      setStatusMessage('업로드 파일 처리 및 오디오 추출 중 (FFmpeg)... 🎬');
    }

    try {
      const formData = new FormData();
      formData.append('apiKey', apiKey);

      if (activeTab === 'link') {
        formData.append('url', url);
      } else if (file) {
        formData.append('file', file);
      }

      // We'll update the status after 8s to indicate we are transcribing
      const transcriptionTimeout = setTimeout(() => {
        setStatusMessage('Gemini AI가 음성을 인식하고 한국어로 번역하는 중... 🧠⚡ (이 작업은 최대 1분이 소요될 수 있습니다.)');
      }, 7000);

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      clearTimeout(transcriptionTimeout);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '대본 추출에 실패했습니다.');
      }

      const data = await response.json();

      let localFileUrl: string | null = null;
      if (data.mediaType === 'local' && file) {
        // Generate browser local URL for playback of uploaded file
        localFileUrl = URL.createObjectURL(file);
      }

      setResult({
        mediaType: data.mediaType,
        videoUrl: data.videoUrl,
        localFileUrl,
        segments: data.segments,
      });

    } catch (err: any) {
      alert(err.message || '서버 오류가 발생했습니다.');
    } finally {
      setLoading(false);
      setStatusMessage('');
    }
  };

  const handleReset = () => {
    setResult(null);
    setFile(null);
    setUrl('');
  };

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <div className={styles.logoArea}>
          <span className={styles.logoIcon}>🔮</span>
          <div>
            <h1 className={styles.title}>Antigravity Video Script Translator</h1>
            <p className={styles.subtitle}>인공지능 기반 다국어 대본 추출 & 한국어 번역기</p>
          </div>
        </div>
        
        <div className={styles.apiConfig}>
          {showKeyInput ? (
            <form onSubmit={handleSaveKey} className={styles.keyForm}>
              <input
                type="password"
                placeholder="Gemini API Key 입력"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className={styles.keyInput}
              />
              <button type="submit" className={styles.keyBtn}>저장</button>
            </form>
          ) : (
            <div className={styles.keyStatus}>
              <span className={styles.statusDot}></span>
              <span className={styles.keyText}>API Key 활성화됨</span>
              <button onClick={handleClearKey} className={styles.keyChangeBtn}>변경</button>
            </div>
          )}
        </div>
      </header>

      {!result && !loading && (
        <section className={styles.inputCard}>
          <div className={styles.tabMenu}>
            <button
              className={`${styles.tabBtn} ${activeTab === 'link' ? styles.activeTab : ''}`}
              onClick={() => {
                if (isVercelEnv) {
                  alert('Vercel 환경에서는 유튜브/인스타그램 링크 다운로드가 지원되지 않습니다. 로컬 파일을 업로드해 주세요!');
                  return;
                }
                setActiveTab('link');
              }}
              style={isVercelEnv ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
            >
              🔗 외부 영상 링크 (유튜브/인스타)
              {isVercelEnv && <span className={styles.disabledBadge}>[미지원]</span>}
            </button>
            <button
              className={`${styles.tabBtn} ${activeTab === 'upload' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('upload')}
            >
              📁 로컬 파일 업로드 (비디오/오디오)
            </button>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            {activeTab === 'link' ? (
              <div className={styles.linkGroup}>
                <label htmlFor="video-url">유튜브 또는 인스타그램 링크 입력</label>
                <input
                  id="video-url"
                  type="url"
                  placeholder="https://www.youtube.com/watch?v=... 또는 https://www.instagram.com/reel/..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className={styles.urlInput}
                />
                <span className={styles.helperText}>
                  * 인스타그램 릴스 및 일반 포스트 영상, 유튜브 영상 모두 지원합니다.
                </span>
              </div>
            ) : (
              <div className={styles.uploadGroup}>
                <label>로컬 미디어 파일 선택</label>
                <div
                  className={`${styles.dropzone} ${file ? styles.dropzoneActive : ''}`}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById('file-upload')?.click()}
                >
                  <input
                    id="file-upload"
                    type="file"
                    accept="video/*,audio/*"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                  />
                  <div className={styles.dropzoneContent}>
                    <span className={styles.uploadIcon}>{file ? '✅' : '📤'}</span>
                    <p className={styles.uploadText}>
                      {file ? `${file.name} (${(file.size / 1024 / 1024).toFixed(1)} MB)` : '파일을 드래그하여 놓거나 여기를 클릭하여 선택하세요'}
                    </p>
                    <span className={styles.uploadSubtext}>
                      MP4, MKV, MP3, M4A, WAV 등 모든 멀티미디어 파일 지원
                    </span>
                  </div>
                </div>
              </div>
            )}

            <button type="submit" className={styles.submitBtn} disabled={loading}>
              🚀 대본 추출 및 번역 시작
            </button>
          </form>
        </section>
      )}

      {loading && (
        <section className={styles.loadingContainer}>
          <div className={styles.spinnerWrapper}>
            <div className={styles.nebulaSpinner}></div>
            <div className={styles.pulsingCore}></div>
          </div>
          <h3 className={styles.loadingTitle}>미디어를 처리하는 중...</h3>
          <p className={styles.loadingStatus}>{statusMessage}</p>
        </section>
      )}

      {result && (
        <div className={styles.resultContainer}>
          <div className={styles.resultHeader}>
            <button onClick={handleReset} className={styles.backBtn}>
              ⬅️ 다른 영상 번역하기
            </button>
          </div>
          <PlayerAndScript
            mediaType={result.mediaType}
            videoUrl={result.videoUrl}
            localFileUrl={result.localFileUrl}
            segments={result.segments}
          />
        </div>
      )}
    </main>
  );
}
