import React, { useState, useEffect } from 'react';
import { importKey, decryptFile } from '../utils/cryptoUtils';

const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Syne:wght@400;500;600;700;800&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  .gb-dl-root {
    min-height: 100vh;
    font-family: 'Syne', sans-serif;
    transition: background 0.5s ease, color 0.5s ease;
    position: relative;
    overflow-x: hidden;
  }

  /* ── Dark mode ── */
  .gb-dl-root.dark {
    --bg-base:    #090d14;
    --bg-card:    rgba(10,16,28,0.85);
    --accent:     #4a9fd4;
    --accent-dim: #2a6fa0;
    --accent-glow:rgba(74,159,212,0.14);
    --border:     rgba(74,159,212,0.20);
    --text-hi:    #ddeeff;
    --text-lo:    #5a87b0;
    --tag-bg:     rgba(74,159,212,0.08);
    --input-bg:   rgba(9,13,20,0.70);
    --btn-shadow: 0 8px 32px rgba(74,159,212,0.28);
    --card-shadow:0 32px 80px rgba(0,0,0,0.60);
    --success:    #4acc8a;
    --error:      #e05a5a;
    background: radial-gradient(ellipse 70% 50% at 15% 15%, #0d1e35 0%, transparent 55%),
                radial-gradient(ellipse 60% 70% at 85% 85%, #091828 0%, transparent 55%),
                linear-gradient(160deg, #060a10 0%, #090d14 50%, #080c12 100%);
    color: var(--text-hi);
  }

  /* ── Light mode ── */
  .gb-dl-root.light {
    --bg-base:    #f0f6fc;
    --bg-card:    rgba(255,255,255,0.90);
    --accent:     #1a6fa0;
    --accent-dim: #0e4a74;
    --accent-glow:rgba(26,111,160,0.10);
    --border:     rgba(26,111,160,0.18);
    --text-hi:    #0d1e30;
    --text-lo:    #3a6a90;
    --tag-bg:     rgba(26,111,160,0.07);
    --input-bg:   rgba(255,255,255,0.80);
    --btn-shadow: 0 8px 32px rgba(26,111,160,0.22);
    --card-shadow:0 32px 80px rgba(0,0,0,0.10);
    --success:    #1a8a50;
    --error:      #c03030;
    background: radial-gradient(ellipse 70% 50% at 15% 15%, #cce0f5 0%, transparent 55%),
                radial-gradient(ellipse 60% 70% at 85% 85%, #bdd8f0 0%, transparent 55%),
                linear-gradient(160deg, #f5f9fe 0%, #eef5fc 100%);
    color: var(--text-hi);
  }

  /* noise overlay */
  .gb-dl-root::before {
    content: '';
    position: fixed; inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
    pointer-events: none; z-index: 0; opacity: 0.5;
  }

  .gb-dl-wrap {
    position: relative; z-index: 1;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 20px;
  }

  /* ── Theme toggle ── */
  .gb-dl-toggle {
    position: fixed; top: 24px; right: 24px; z-index: 100;
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 40px;
    padding: 8px 18px;
    cursor: pointer;
    font-family: 'DM Mono', monospace;
    font-size: 0.72rem;
    letter-spacing: 0.08em;
    color: var(--text-lo);
    backdrop-filter: blur(16px);
    transition: all 0.25s;
  }
  .gb-dl-toggle:hover { color: var(--accent); border-color: var(--accent); }

  /* ── Card ── */
  .gb-dl-card {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 28px;
    padding: 52px 48px;
    max-width: 520px;
    width: 100%;
    backdrop-filter: blur(28px);
    box-shadow: var(--card-shadow);
    text-align: center;
    animation: slideUp 0.6s cubic-bezier(0.16,1,0.3,1) both;
  }

  @keyframes slideUp {
    from { opacity:0; transform: translateY(32px); }
    to   { opacity:1; transform: translateY(0); }
  }

  /* ── Logo block ── */
  .gb-dl-logo { margin-bottom: 44px; }

  .gb-dl-shield {
    width: 64px; height: 64px;
    margin: 0 auto 20px;
  }
  .gb-dl-shield svg { width: 100%; height: 100%; }

  .gb-dl-wordmark {
    font-size: 2rem;
    font-weight: 800;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--text-hi);
    line-height: 1;
    margin-bottom: 8px;
  }
  .gb-dl-wordmark span { color: var(--accent); }

  .gb-dl-descriptor {
    font-family: 'DM Mono', monospace;
    font-size: 0.68rem;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--text-lo);
  }

  /* ── Divider ── */
  .gb-dl-divider {
    height: 1px;
    background: linear-gradient(90deg, transparent, var(--border), transparent);
    margin: 28px 0;
  }

  /* ── State box ── */
  .gb-dl-state {
    border: 1px solid var(--border);
    border-radius: 20px;
    padding: 36px 28px;
    background: var(--accent-glow);
    animation: fadeIn 0.4s ease both;
  }
  @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }

  /* ── Loading ── */
  .gb-dl-spinner-wrap { margin-bottom: 24px; }

  .gb-dl-spinner {
    width: 48px; height: 48px;
    border: 2px solid var(--border);
    border-top: 2px solid var(--accent);
    border-radius: 50%;
    margin: 0 auto;
    animation: spin 0.9s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  .gb-dl-state-icon {
    font-size: 3rem;
    margin-bottom: 20px;
    display: block;
  }

  .gb-dl-state-title {
    font-size: 1.15rem;
    font-weight: 700;
    color: var(--text-hi);
    letter-spacing: 0.04em;
    margin-bottom: 10px;
  }

  .gb-dl-state-sub {
    font-family: 'DM Mono', monospace;
    font-size: 0.70rem;
    letter-spacing: 0.08em;
    color: var(--text-lo);
    line-height: 1.7;
  }

  /* ── File chip ── */
  .gb-dl-file-chip {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    background: var(--input-bg);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 12px 20px;
    margin: 20px 0;
    font-family: 'DM Mono', monospace;
    font-size: 0.78rem;
    color: var(--text-hi);
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* ── Download button ── */
  .gb-dl-btn {
    display: inline-block;
    background: linear-gradient(135deg, var(--accent-dim) 0%, var(--accent) 100%);
    color: #fff;
    border: none;
    border-radius: 14px;
    padding: 16px 40px;
    font-family: 'Syne', sans-serif;
    font-size: 0.88rem;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    cursor: pointer;
    box-shadow: var(--btn-shadow);
    transition: all 0.25s;
    position: relative;
    overflow: hidden;
    margin-bottom: 20px;
  }
  .gb-dl-btn::after {
    content: '';
    position: absolute; inset: 0;
    background: linear-gradient(135deg, rgba(255,255,255,0.10) 0%, transparent 50%);
  }
  .gb-dl-btn:hover { transform: translateY(-2px); box-shadow: 0 14px 40px rgba(74,159,212,0.38); }
  .gb-dl-btn:active { transform: translateY(0); }

  /* ── Success / Error state colors ── */
  .gb-dl-state.success { border-color: rgba(74,204,138,0.25); }
  .gb-dl-state.error { border-color: rgba(224,90,90,0.25); background: rgba(224,90,90,0.06); }

  .gb-dl-error-title { color: var(--error) !important; }

  /* ── Secure badge row ── */
  .gb-dl-badges {
    margin-top: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 20px;
    flex-wrap: wrap;
  }

  .gb-dl-badge {
    font-family: 'DM Mono', monospace;
    font-size: 0.63rem;
    letter-spacing: 0.10em;
    text-transform: uppercase;
    color: var(--text-lo);
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .gb-dl-badge::before {
    content: '';
    display: inline-block;
    width: 4px; height: 4px;
    border-radius: 50%;
    background: var(--accent);
    opacity: 0.6;
  }

  @media (max-width: 520px) {
    .gb-dl-card { padding: 36px 24px; }
  }
`;

const ShieldLogo = ({ accent }) => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M32 4L8 14v18c0 14 10.5 24.5 24 28 13.5-3.5 24-14 24-28V14L32 4z"
      fill="none"
      stroke={accent}
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <path
      d="M32 10L12 19v13c0 10.5 8 18.5 20 21.5C44 50.5 52 42.5 52 32V19L32 10z"
      fill={accent}
      fillOpacity="0.12"
    />
    <path
      d="M24 32l5 5 11-11"
      stroke={accent}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default function DownloadPage() {
  const [status, setStatus] = useState('loading');
  const [fileName, setFileName] = useState('');
  const [decryptedFile, setDecryptedFile] = useState(null);
  const [error, setError] = useState('');
  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  useEffect(() => { fetchAndDecrypt(); }, []);

  const fetchAndDecrypt = async () => {
    try {
      console.log('Full URL:', window.location.href);

      const keyString = window.location.hash.slice(1);
      console.log('Key String:', keyString);

      if (!keyString) {
        setError('Invalid link — decryption key is missing');
        setStatus('error'); return;
      }

      const pathParts = window.location.pathname.split('/');
      const fileId = pathParts[pathParts.length - 1];
      console.log('File ID:', fileId);

      // Fetch from OUR backend (not Backblaze directly)
      const response = await fetch(`https://guardianbox-backend-id9z.onrender.com/file/${fileId}`);
      console.log('Response status:', response.status);

      if (!response.ok) {
        setError('File not found or has expired');
        setStatus('error'); return;
      }

      const data = await response.json();
      console.log('Got data from backend ✅');

      // Import key from URL hash
      const key = await importKey(keyString);
      console.log('Key imported ✅');

      // Convert base64 back to ArrayBuffer
      const binaryString = atob(data.fileData);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const encryptedBlob = bytes.buffer;
      console.log('File data converted ✅');

      // Decrypt
      const decryptedData = await decryptFile(encryptedBlob, data.iv, key);
      console.log('Decryption successful ✅');

      const blob = new Blob([decryptedData], { type: data.fileType });
      setDecryptedFile(URL.createObjectURL(blob));
      setFileName(data.fileName);
      setStatus('ready');

    } catch (e) {
      console.error('Full error:', e);
      setError('Decryption failed — wrong key or corrupted file');
      setStatus('error');
    }
  };

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = decryptedFile;
    a.download = fileName;
    a.click();
  };

  const accent = darkMode ? '#4a9fd4' : '#1a6fa0';

  return (
    <div className={`gb-dl-root ${darkMode ? 'dark' : 'light'}`}>
      <button className="gb-dl-toggle" onClick={() => setDarkMode(!darkMode)}>
        {darkMode ? '○ LIGHT' : '● DARK'}
      </button>

      <div className="gb-dl-wrap">
        <div className="gb-dl-card">

          {/* Logo */}
          <div className="gb-dl-logo">
            <div className="gb-dl-shield">
              <ShieldLogo accent={accent} />
            </div>
            <div className="gb-dl-wordmark">
              Guardian<span>Box</span>
            </div>
            <div className="gb-dl-descriptor">Secure File Retrieval</div>
          </div>

          <div className="gb-dl-divider" />

          {/* Loading */}
          {status === 'loading' && (
            <div className="gb-dl-state">
              <div className="gb-dl-spinner-wrap">
                <div className="gb-dl-spinner" />
              </div>
              <div className="gb-dl-state-title">Decrypting your file</div>
              <div className="gb-dl-state-sub">
                Decryption is happening entirely in your browser.<br />
                The server never sees your file or its contents.
              </div>
            </div>
          )}

          {/* Ready */}
          {status === 'ready' && (
            <div className="gb-dl-state success">
              <span className="gb-dl-state-icon">✓</span>
              <div className="gb-dl-state-title">File decrypted successfully</div>
              <div className="gb-dl-file-chip">
                📄 {fileName}
              </div>
              <br />
              <button className="gb-dl-btn" onClick={handleDownload}>
                ↓ &nbsp; Download File
              </button>
              <div className="gb-dl-state-sub">
                Your file was reconstructed locally in your browser.<br />
                Nothing was transmitted to the server.
              </div>
            </div>
          )}

          {/* Error */}
          {status === 'error' && (
            <div className="gb-dl-state error">
              <span className="gb-dl-state-icon">✕</span>
              <div className={`gb-dl-state-title gb-dl-error-title`}>{error}</div>
              <div className="gb-dl-state-sub">
                The file may have expired, reached its download limit,<br />
                or the link may be incomplete. Request a new link from the sender.
              </div>
            </div>
          )}

          {/* Badges */}
          <div className="gb-dl-badges">
            <span className="gb-dl-badge">AES-256-GCM</span>
            <span className="gb-dl-badge">Browser-only decryption</span>
            <span className="gb-dl-badge">Zero knowledge</span>
          </div>

        </div>
      </div>
    </div>
  );
}
