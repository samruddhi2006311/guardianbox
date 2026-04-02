import React, { useState, useEffect } from 'react';
import { generateKey, exportKey, encryptFile } from '../utils/cryptoUtils';

const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Syne:wght@400;500;600;700;800&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  .gb-upload-root {
    min-height: 100vh;
    font-family: 'Syne', sans-serif;
    transition: background 0.5s ease, color 0.5s ease;
    position: relative;
    overflow-x: hidden;
  }

  /* ── Dark mode (default) ── */
  .gb-upload-root.dark {
    --bg-base:    #0e1209;
    --bg-mid:     #141a0d;
    --bg-card:    rgba(20, 26, 13, 0.82);
    --accent:     #7aad4e;
    --accent-dim: #4a7a2a;
    --accent-glow:rgba(122,173,78,0.18);
    --border:     rgba(122,173,78,0.22);
    --text-hi:    #e8f0d8;
    --text-lo:    #7a9060;
    --tag-bg:     rgba(122,173,78,0.10);
    --input-bg:   rgba(14,18,9,0.70);
    --btn-shadow: 0 8px 32px rgba(122,173,78,0.28);
    --card-shadow:0 32px 80px rgba(0,0,0,0.55);
    background: radial-gradient(ellipse 80% 60% at 20% 10%, #1e2e10 0%, transparent 60%),
                radial-gradient(ellipse 60% 80% at 80% 90%, #172210 0%, transparent 60%),
                linear-gradient(160deg, #0b0f07 0%, #0e1209 40%, #111608 100%);
    color: var(--text-hi);
  }

  /* ── Light mode ── */
  .gb-upload-root.light {
    --bg-base:    #f4f7ee;
    --bg-mid:     #eaf0de;
    --bg-card:    rgba(255,255,255,0.88);
    --accent:     #4a7a2a;
    --accent-dim: #3a6020;
    --accent-glow:rgba(74,122,42,0.12);
    --border:     rgba(74,122,42,0.20);
    --text-hi:    #1a2610;
    --text-lo:    #5a7040;
    --tag-bg:     rgba(74,122,42,0.08);
    --input-bg:   rgba(255,255,255,0.70);
    --btn-shadow: 0 8px 32px rgba(74,122,42,0.22);
    --card-shadow:0 32px 80px rgba(0,0,0,0.10);
    background: radial-gradient(ellipse 80% 60% at 20% 10%, #dcebc8 0%, transparent 60%),
                radial-gradient(ellipse 60% 80% at 80% 90%, #cfe0b8 0%, transparent 60%),
                linear-gradient(160deg, #f8faf2 0%, #f2f6ea 100%);
    color: var(--text-hi);
  }

  /* noise overlay */
  .gb-upload-root::before {
    content: '';
    position: fixed; inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
    pointer-events: none; z-index: 0; opacity: 0.5;
  }

  .gb-upload-wrap {
    position: relative; z-index: 1;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 20px;
  }

  /* ── Theme toggle ── */
  .gb-toggle {
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
  .gb-toggle:hover { color: var(--accent); border-color: var(--accent); }

  /* ── Card ── */
  .gb-card {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 28px;
    padding: 52px 48px;
    max-width: 560px;
    width: 100%;
    backdrop-filter: blur(28px);
    box-shadow: var(--card-shadow);
    animation: slideUp 0.6s cubic-bezier(0.16,1,0.3,1) both;
  }

  @keyframes slideUp {
    from { opacity:0; transform: translateY(32px); }
    to   { opacity:1; transform: translateY(0); }
  }

  /* ── Logo block ── */
  .gb-logo-block { text-align: center; margin-bottom: 44px; }

  .gb-shield {
    width: 64px; height: 64px;
    margin: 0 auto 20px;
    position: relative;
  }
  .gb-shield svg { width: 100%; height: 100%; }

  .gb-wordmark {
    font-size: 2rem;
    font-weight: 800;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--text-hi);
    line-height: 1;
    margin-bottom: 8px;
  }
  .gb-wordmark span { color: var(--accent); }

  .gb-descriptor {
    font-family: 'DM Mono', monospace;
    font-size: 0.68rem;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--text-lo);
  }

  /* ── Divider ── */
  .gb-divider {
    height: 1px;
    background: linear-gradient(90deg, transparent, var(--border), transparent);
    margin: 28px 0;
  }

  /* ── Drop zone ── */
  .gb-dropzone {
    border: 1.5px dashed var(--border);
    border-radius: 18px;
    padding: 36px 24px;
    text-align: center;
    cursor: pointer;
    background: var(--accent-glow);
    transition: all 0.25s;
    margin-bottom: 28px;
    position: relative;
    overflow: hidden;
  }
  .gb-dropzone:hover {
    border-color: var(--accent);
    background: rgba(122,173,78,0.10);
  }
  .gb-dropzone input { display: none; }

  .gb-drop-icon {
    font-size: 2rem;
    margin-bottom: 12px;
    opacity: 0.8;
  }

  .gb-drop-title {
    font-size: 0.95rem;
    font-weight: 600;
    color: var(--text-hi);
    margin-bottom: 6px;
    letter-spacing: 0.02em;
  }

  .gb-drop-sub {
    font-family: 'DM Mono', monospace;
    font-size: 0.68rem;
    color: var(--text-lo);
    letter-spacing: 0.06em;
  }

  .gb-file-selected {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: var(--tag-bg);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 8px 14px;
    margin-top: 14px;
    font-family: 'DM Mono', monospace;
    font-size: 0.75rem;
    color: var(--accent);
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* ── Settings row ── */
  .gb-settings { display: flex; gap: 16px; margin-bottom: 28px; }

  .gb-setting {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .gb-setting-label {
    font-family: 'DM Mono', monospace;
    font-size: 0.65rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--text-lo);
  }

  .gb-select {
    background: var(--input-bg);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 11px 14px;
    font-family: 'Syne', sans-serif;
    font-size: 0.88rem;
    font-weight: 500;
    color: var(--text-hi);
    cursor: pointer;
    transition: border-color 0.2s;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' fill='none'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%237a9060' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 14px center;
    padding-right: 36px;
  }
  .gb-select:focus { outline: none; border-color: var(--accent); }

  /* ── Upload button ── */
  .gb-btn {
    width: 100%;
    background: linear-gradient(135deg, var(--accent-dim) 0%, var(--accent) 100%);
    color: #fff;
    border: none;
    border-radius: 14px;
    padding: 17px 24px;
    font-family: 'Syne', sans-serif;
    font-size: 0.9rem;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    cursor: pointer;
    box-shadow: var(--btn-shadow);
    transition: all 0.25s;
    margin-bottom: 0;
    position: relative;
    overflow: hidden;
  }
  .gb-btn::after {
    content: '';
    position: absolute; inset: 0;
    background: linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 50%);
  }
  .gb-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 14px 40px rgba(122,173,78,0.38); }
  .gb-btn:active:not(:disabled) { transform: translateY(0); }
  .gb-btn:disabled { opacity: 0.6; cursor: not-allowed; }

  /* ── Link result ── */
  .gb-result {
    margin-top: 28px;
    border: 1px solid var(--border);
    border-radius: 18px;
    padding: 28px;
    background: var(--accent-glow);
    animation: fadeIn 0.4s ease both;
  }
  @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }

  .gb-result-label {
    font-family: 'DM Mono', monospace;
    font-size: 0.65rem;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: var(--accent);
    margin-bottom: 14px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .gb-result-label::before {
    content: '';
    display: inline-block;
    width: 6px; height: 6px;
    border-radius: 50%;
    background: var(--accent);
  }

  .gb-link-box {
    background: var(--input-bg);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 14px 16px;
    margin-bottom: 16px;
    font-family: 'DM Mono', monospace;
    font-size: 0.72rem;
    color: var(--text-hi);
    word-break: break-all;
    line-height: 1.7;
  }

  .gb-copy-btn {
    width: 100%;
    background: var(--tag-bg);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 12px;
    font-family: 'Syne', sans-serif;
    font-size: 0.82rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    color: var(--accent);
    cursor: pointer;
    transition: all 0.2s;
    margin-bottom: 14px;
  }
  .gb-copy-btn:hover { background: var(--accent-glow); border-color: var(--accent); }

  .gb-warn {
    font-family: 'DM Mono', monospace;
    font-size: 0.65rem;
    letter-spacing: 0.06em;
    color: #c8903a;
    text-align: center;
  }

  /* ── Footer tag ── */
  .gb-footer-tag {
    margin-top: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 20px;
  }

  .gb-tag {
    font-family: 'DM Mono', monospace;
    font-size: 0.63rem;
    letter-spacing: 0.10em;
    text-transform: uppercase;
    color: var(--text-lo);
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .gb-tag::before {
    content: '';
    display: inline-block;
    width: 4px; height: 4px;
    border-radius: 50%;
    background: var(--accent);
    opacity: 0.6;
  }

  @media (max-width: 520px) {
    .gb-card { padding: 36px 24px; }
    .gb-settings { flex-direction: column; }
  }
`;

// Shield SVG Logo
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

export default function UploadPage() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [shareableLink, setShareableLink] = useState('');
  const [expiryHours, setExpiryHours] = useState(24);
  const [downloadLimit, setDownloadLimit] = useState(3);
  const [darkMode, setDarkMode] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  const handleUpload = async () => {
    if (!file) { alert('Please select a file first.'); return; }
    try {
      setUploading(true);
      const key = await generateKey();
      const { ciphertext, iv, fileName, fileType } = await encryptFile(file, key);
      const keyString = await exportKey(key);
      const encryptedBlob = new Blob([ciphertext]);
      const formData = new FormData();
      formData.append('file', encryptedBlob, 'encrypted.bin');
      formData.append('iv', iv);
      formData.append('fileName', fileName);
      formData.append('fileType', fileType);
      formData.append('expiryHours', expiryHours);
      formData.append('downloadLimit', downloadLimit);

      const response = await fetch('https://guardianbox-backend-id9z.onrender.com/upload', { method: 'POST', body: formData });
      const data = await response.json();
      setShareableLink(`${window.location.origin}/file/${data.fileId}#${keyString}`);
    } catch (e) {
      console.error(e);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(shareableLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const accent = darkMode ? '#7aad4e' : '#4a7a2a';

  return (
    <div className={`gb-upload-root ${darkMode ? 'dark' : 'light'}`}>
      <button className="gb-toggle" onClick={() => setDarkMode(!darkMode)}>
        {darkMode ? '○ LIGHT' : '● DARK'}
      </button>

      <div className="gb-upload-wrap">
        <div className="gb-card">

          {/* Logo */}
          <div className="gb-logo-block">
            <div className="gb-shield">
              <ShieldLogo accent={accent} />
            </div>
            <div className="gb-wordmark">
              Guardian<span>Box</span>
            </div>
            <div className="gb-descriptor">Zero-Knowledge · End-to-End Encrypted</div>
          </div>

          <div className="gb-divider" />

          {/* Drop Zone */}
          <label className="gb-dropzone">
            <input type="file" onChange={e => setFile(e.target.files[0])} />
            <div className="gb-drop-icon">⬆</div>
            <div className="gb-drop-title">
              {file ? 'File selected' : 'Select a file to encrypt'}
            </div>
            <div className="gb-drop-sub">
              {file ? '' : 'Click anywhere in this box'}
            </div>
            {file && (
              <div className="gb-file-selected">
                📄 {file.name}
              </div>
            )}
          </label>

          {/* Settings */}
          <div className="gb-settings">
            <div className="gb-setting">
              <div className="gb-setting-label">Expires after</div>
              <select
                className="gb-select"
                value={expiryHours}
                onChange={e => setExpiryHours(e.target.value)}
              >
                <option value="1">1 hour</option>
                <option value="6">6 hours</option>
                <option value="24">24 hours</option>
                <option value="72">3 days</option>
                <option value="168">7 days</option>
              </select>
            </div>
            <div className="gb-setting">
              <div className="gb-setting-label">Max downloads</div>
              <select
                className="gb-select"
                value={downloadLimit}
                onChange={e => setDownloadLimit(e.target.value)}
              >
                <option value="1">1 time</option>
                <option value="3">3 times</option>
                <option value="5">5 times</option>
                <option value="10">10 times</option>
              </select>
            </div>
          </div>

          {/* Upload Button */}
          <button className="gb-btn" onClick={handleUpload} disabled={uploading}>
            {uploading ? '◌  Encrypting & uploading...' : '⟶  Encrypt & Upload'}
          </button>

          {/* Result */}
          {shareableLink && (
            <div className="gb-result">
              <div className="gb-result-label">Secure link ready</div>
              <div className="gb-link-box">{shareableLink}</div>
              <button className="gb-copy-btn" onClick={copyLink}>
                {copied ? '✓  Copied to clipboard' : '⧉  Copy secure link'}
              </button>
              <div className="gb-warn">
                ⚠ This link contains the decryption key — keep it private
              </div>
            </div>
          )}

          {/* Footer tags */}
          <div className="gb-footer-tag">
            <span className="gb-tag">AES-256-GCM</span>
            <span className="gb-tag">Client-side only</span>
            <span className="gb-tag">Zero knowledge</span>
          </div>

        </div>
      </div>
    </div>
  );
}
