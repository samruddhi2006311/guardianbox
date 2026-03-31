# 🛡️ GuardianBox
> Zero-Knowledge End-to-End Encrypted File Sharing

GuardianBox is a file sharing service where the server is completely "blind." 
Encryption happens in the browser before upload. The server only ever 
receives encrypted gibberish — never the original file or decryption key.

---

## 🏗️ Architecture Overview
```
User Browser          Backend Server         Backblaze B2
─────────────         ──────────────         ────────────
Select file    →      
Encrypt file   →      
               →      Receive blob    →      Store .enc file
               ←      Return file ID  ←      
Build link     →      
(key in hash)
```

---

## 🔐 Crypto Module

Located at: `client/src/utils/cryptoUtils.js`

Uses the browser's native **Web Crypto API** with **AES-256-GCM** encryption.

### Functions:
| Function | Description |
|---|---|
| `generateKey()` | Generates a random AES-256-GCM key |
| `exportKey(key)` | Exports key to base64 string for URL hash |
| `importKey(str)` | Imports key from base64 string |
| `encryptFile(file, key)` | Encrypts file, returns ciphertext + IV |
| `decryptFile(cipher, iv, key)` | Decrypts ciphertext back to original file |

### Why AES-GCM?
- Provides both **encryption and authentication**
- Detects tampering with the ciphertext
- Industry standard for symmetric encryption
- Native browser support via Web Crypto API

---

## 🔑 The URL Hash Trick
```
https://guardianbox.com/file/abc123#MySecretKey
                                   ↑
                        This part NEVER sent to server
                        Browser keeps it local only
```

The `#` fragment is never transmitted to the server in HTTP requests.
This means the decryption key is physically impossible for the server to see.

---

## ⏱️ Ephemeral Storage

Files are automatically deleted by two mechanisms:

1. **Time-based**: Cron job runs every hour, deletes files where `expires_at < NOW()`
2. **View-based**: Download counter increments on each download, deletes when limit reached

Both the encrypted blob (Backblaze B2) and metadata (MySQL) are deleted together.

---

## 🔒 Security Audit — Attack Vector Analysis

### 1. What if the user loses the link?
**Impact:** Critical — file is permanently unrecoverable  
**Analysis:** The decryption key exists ONLY in the URL hash. It is never stored on the server, database, or anywhere else. If the link is lost, the file cannot be decrypted by anyone — including the server owner.  
**Mitigation:** Users are warned to save the link immediately after upload. This is by design — zero recovery is a security feature, not a bug.

---

### 2. What if the Backblaze B2 bucket is breached?
**Impact:** None  
**Analysis:** Attackers would obtain only `.enc` files — random encrypted bytes. Without the AES-256-GCM key (which is only in the URL hash, never on the server), the data is computationally impossible to decrypt.  
**Mitigation:** Zero knowledge by design. Even a full database + storage breach reveals nothing.

---

### 3. What if the server is subpoenaed or hacked?
**Impact:** None  
**Analysis:** The server stores only: file ID, IV, expiry time, download count, and S3 key. It never stores the password or decryption key. Authorities or attackers obtaining the server data get nothing useful.  
**Mitigation:** True zero-knowledge architecture — the server cannot comply even if it wanted to.

---

### 4. Man-in-the-Middle (MITM) Attack
**Impact:** Low (when deployed with HTTPS)  
**Analysis:** An attacker intercepting traffic would see only the encrypted blob. The key travels in the URL hash which is never sent over the network.  
**Mitigation:** HTTPS enforced on deployment. Hash fragment stays local to browser.

---

### 5. What if someone guesses the file ID?
**Impact:** Low  
**Analysis:** File IDs are UUIDs (Version 4) — 122 bits of randomness. Probability of guessing is 1 in 5.3×10³⁶. Even if guessed, the file is still AES-256-GCM encrypted.  
**Mitigation:** UUID v4 provides sufficient entropy. Encrypted data is useless without the key.

---

### 6. Brute Force Attack on the Key
**Impact:** None (practically)  
**Analysis:** AES-256 has 2²⁵⁶ possible keys. Even with all computing power on Earth, brute forcing would take longer than the age of the universe.  
**Mitigation:** AES-256-GCM is computationally secure against brute force.

---

### 7. What if the IV (Initialization Vector) is reused?
**Impact:** Potential pattern leakage  
**Analysis:** Each encryption generates a fresh random 12-byte IV using `crypto.getRandomValues()`. IV reuse with the same key would leak information about plaintext.  
**Mitigation:** Random IV generated per file — reuse is statistically impossible.

---

### 8. XSS (Cross-Site Scripting) Attack
**Impact:** High if exploited  
**Analysis:** If an attacker injects malicious JavaScript, they could read the URL hash (containing the key) from the browser.  
**Mitigation:** React's JSX automatically escapes output. No `dangerouslySetInnerHTML` used. Content Security Policy headers recommended for production.

---

## 🧪 Unit Tests
```bash
cd client
npm test
```

Tests verify:
- `encrypt(data, key)` → `decrypt(ciphertext, key)` returns original data
- Wrong key fails to decrypt (throws error)
- `generateKey()` produces cryptographically unique keys each time

---

## 🚀 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React.js |
| Cryptography | Web Crypto API (AES-256-GCM) |
| Backend | Node.js + Express.js |
| Database | MySQL |
| Storage | Backblaze B2 (S3-compatible) |
| Scheduling | node-cron |

---

## 🛠️ Running Locally

### Backend
```bash
cd server
node app.js
```

### Frontend
```bash
cd client
npm start
```

### Tests
```bash
cd client
npm test
```

---

## 📁 Project Structure
```
guardianbox/
├── client/                          ← React Frontend
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── pages/
│   │   │   ├── UploadPage.js        ← Upload UI
│   │   │   └── DownloadPage.js      ← Download UI
│   │   ├── utils/
│   │   │   ├── cryptoUtils.js       ← Crypto Module (Web Crypto API)
│   │   │   └── cryptoUtils.test.js  ← Unit Tests
│   │   ├── App.js                   ← Routing
│   │   └── index.js                 ← Entry point
│   ├── vitest.config.js
│   └── package.json
│
└── server/                          ← Node.js Backend
    ├── routes/
    │   └── files.js                 ← Upload/Download API
    ├── config/
    │   └── db.js                    ← MySQL Connection
    ├── cron/
    │   └── cleanup.js               ← Auto Delete Job
    ├── .env                         ← Secret Keys
    ├── app.js                       ← Server Entry Point
    └── package.json
