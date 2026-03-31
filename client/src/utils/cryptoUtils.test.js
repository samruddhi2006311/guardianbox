import { describe, it, expect } from 'vitest'
import {
  generateKey,
  exportKey,
  importKey,
  encryptFile,
  decryptFile
} from './cryptoUtils'

// ================================
// TEST 1 — Encrypt then Decrypt
// returns original data
// ================================
describe('GuardianBox Crypto Tests', () => {

  it('encrypt then decrypt returns original data', async () => {
    // Create a fake file with test data
    const originalText = 'Hello GuardianBox!'
    const blob = new Blob([originalText], { type: 'text/plain' })
    const fakeFile = new File([blob], 'test.txt', { type: 'text/plain' })

    // Generate key
    const key = await generateKey()

    // Encrypt the file
    const { ciphertext, iv } = await encryptFile(fakeFile, key)

    // Decrypt it back
    const decryptedData = await decryptFile(ciphertext, iv, key)

    // Convert decrypted data back to text
    const decryptedText = new TextDecoder().decode(decryptedData)

    // Check if same as original
    expect(decryptedText).toBe(originalText)
  })

  // ================================
  // TEST 2 — Wrong key cannot decrypt
  // ================================
  it('wrong key fails to decrypt', async () => {
    // Create fake file
    const blob = new Blob(['Secret data'], { type: 'text/plain' })
    const fakeFile = new File([blob], 'test.txt', { type: 'text/plain' })

    // Encrypt with correct key
    const correctKey = await generateKey()
    const { ciphertext, iv } = await encryptFile(fakeFile, correctKey)

    // Try to decrypt with WRONG key
    const wrongKey = await generateKey()

    // This should throw an error
    await expect(
      decryptFile(ciphertext, iv, wrongKey)
    ).rejects.toThrow()
  })

  // ================================
  // TEST 3 — Keys are always unique
  // ================================
  it('generateKey produces unique keys each time', async () => {
    const key1 = await generateKey()
    const key2 = await generateKey()

    // Export both keys to compare
    const exportedKey1 = await exportKey(key1)
    const exportedKey2 = await exportKey(key2)

    // They should be different
    expect(exportedKey1).not.toBe(exportedKey2)
  })

})