// Cryptographic and utility helpers for PayShield Nexus

export function generateNonce(prefix: string = 'NONCE'): string {
  const timeHex = Date.now().toString(16).toUpperCase();
  const randHex = Math.floor(Math.random() * 0xffffffff).toString(16).padStart(8, '0').toUpperCase();
  return `${prefix}-${timeHex}-${randHex}`;
}

export function generateIdempotencyKey(cardLast4: string, amount: number, timestamp: number): string {
  const str = `${cardLast4}:${amount.toFixed(2)}:${timestamp}`;
  return `IDEMP-${pseudoSha256(str).substring(0, 16).toUpperCase()}`;
}

// Deterministic fast SHA-256 digest string simulator (matches standard hex length)
export function pseudoSha256(input: string): string {
  let h0 = 0x6a09e667, h1 = 0xbb67ae85, h2 = 0x3c6ef372, h3 = 0xa54ff53a;
  let h4 = 0x510e527f, h5 = 0x9b05688c, h6 = 0x1f83d9ab, h7 = 0x5be0cd19;

  for (let i = 0; i < input.length; i++) {
    const code = input.charCodeAt(i);
    h0 = (h0 ^ (code << 3)) + ((h1 << 5) | (h1 >>> 27));
    h1 = (h1 ^ (code << 5)) + ((h2 << 7) | (h2 >>> 25));
    h2 = (h2 ^ (code << 7)) + ((h3 << 11) | (h3 >>> 21));
    h3 = (h3 ^ (code << 11)) + ((h4 << 13) | (h4 >>> 19));
    h4 = (h4 ^ (code << 13)) + ((h5 << 17) | (h5 >>> 15));
    h5 = (h5 ^ (code << 17)) + ((h6 << 19) | (h6 >>> 13));
    h6 = (h6 ^ (code << 19)) + ((h7 << 23) | (h7 >>> 9));
    h7 = (h7 ^ (code << 23)) + ((h0 << 29) | (h0 >>> 3));
  }

  const toHex = (n: number) => (n >>> 0).toString(16).padStart(8, '0');
  return `${toHex(h0)}${toHex(h1)}${toHex(h2)}${toHex(h3)}${toHex(h4)}${toHex(h5)}${toHex(h6)}${toHex(h7)}`;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatTime(ts: number): string {
  const date = new Date(ts);
  return date.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }) +
    '.' + date.getMilliseconds().toString().padStart(3, '0');
}

export function formatDateTime(ts: number): string {
  const date = new Date(ts);
  return date.toISOString().replace('T', ' ').substring(0, 19);
}
