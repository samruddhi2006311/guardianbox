// ============================================
// GuardianBox Crypto Utility
// All encryption/decryption happens HERE
// Server never sees the key or original file
// ============================================

// FUNCTION 1 — Generate a random encryption key
export async function generateKey() {
  const key = await window.crypto.subtle.generateKey(
    {
      name: "AES-GCM",
      length: 256, // strongest AES encryption
    },
    true, // key can be exported
    ["encrypt", "decrypt"]
  );
  return key;
}

// FUNCTION 2 — Export key to string (for URL hash)
export async function exportKey(key) {
  const exported = await window.crypto.subtle.exportKey("raw", key);
  return btoa(String.fromCharCode(...new Uint8Array(exported)));
}

// FUNCTION 3 — Import key from string (from URL hash)
export async function importKey(keyString) {
  const keyData = Uint8Array.from(atob(keyString), c => c.charCodeAt(0));
  return await window.crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "AES-GCM" },
    true,
    ["encrypt", "decrypt"]
  );
}

// FUNCTION 4 — Encrypt a file
export async function encryptFile(file, key) {
  // Generate random IV (makes each encryption unique)
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  // Read file as raw bytes
  const fileData = await file.arrayBuffer();

  // Encrypt the file
  const encryptedData = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv },
    key,
    fileData
  );

  // Convert IV to base64 string for storage
  const ivString = btoa(String.fromCharCode(...iv));

  return {
    ciphertext: encryptedData, // encrypted file data
    iv: ivString,              // random value used
    fileName: file.name,       // original file name
    fileType: file.type        // original file type
  };
}

// FUNCTION 5 — Decrypt a file
export async function decryptFile(ciphertext, ivString, key) {
  // Convert IV back from base64
  const iv = Uint8Array.from(atob(ivString), c => c.charCodeAt(0));

  // Decrypt the file
  const decryptedData = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv: iv },
    key,
    ciphertext
  );

  return decryptedData; // original file bytes
}