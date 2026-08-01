// utils/base64.ts
/**
 * Decode base64 to Uint8Array without atob() — atob() is a browser API,
 * unavailable in Hermes. Works in Expo Go (polyfilled), crashes production
 * builds otherwise.
 */
export function base64ToUint8Array(b64: string): Uint8Array {
  const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const lookup = new Uint8Array(256);
  for (let i = 0; i < CHARS.length; i++) lookup[CHARS.charCodeAt(i)] = i;
  const input = b64.replace(/-/g, '+').replace(/_/g, '/');
  const len = input.length;
  const outputLen = len * 3 / 4 - (input[len - 2] === '=' ? 2 : input[len - 1] === '=' ? 1 : 0);
  const output = new Uint8Array(outputLen);
  let pos = 0;
  for (let i = 0; i < len; i += 4) {
    const a = lookup[input.charCodeAt(i)];
    const b = lookup[input.charCodeAt(i + 1)];
    const c = lookup[input.charCodeAt(i + 2)];
    const d = lookup[input.charCodeAt(i + 3)];
    output[pos++] = (a << 2) | (b >> 4);
    if (pos < outputLen) output[pos++] = ((b & 0xf) << 4) | (c >> 2);
    if (pos < outputLen) output[pos++] = ((c & 0x3) << 6) | d;
  }
  return output;
}