const CREDENTIAL_KEY = 'harendra-portfolio-editor-credential-v1'
const ITERATIONS = 310_000

interface Credential {
  version: 1
  salt: string
  verifier: string
  iterations: number
}

function encode(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
}

function decode(value: string): Uint8Array {
  return Uint8Array.from(atob(value), character => character.charCodeAt(0))
}

async function derive(passphrase: string, salt: Uint8Array, iterations: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(passphrase), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: salt as BufferSource, iterations }, key, 256)
  return new Uint8Array(bits)
}

export function hasLocalPassphrase(): boolean {
  return localStorage.getItem(CREDENTIAL_KEY) !== null
}

export async function setLocalPassphrase(passphrase: string): Promise<void> {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const verifier = await derive(passphrase, salt, ITERATIONS)
  const credential: Credential = { version: 1, salt: encode(salt), verifier: encode(verifier), iterations: ITERATIONS }
  localStorage.setItem(CREDENTIAL_KEY, JSON.stringify(credential))
}

export async function verifyLocalPassphrase(passphrase: string): Promise<boolean> {
  const saved = localStorage.getItem(CREDENTIAL_KEY)
  if (!saved) return false
  try {
    const credential = JSON.parse(saved) as Credential
    if (credential.version !== 1 || credential.iterations !== ITERATIONS) return false
    const expected = decode(credential.verifier)
    const actual = await derive(passphrase, decode(credential.salt), credential.iterations)
    if (actual.length !== expected.length) return false
    let difference = 0
    for (let i = 0; i < actual.length; i++) difference |= actual[i] ^ expected[i]
    return difference === 0
  } catch {
    return false
  }
}
