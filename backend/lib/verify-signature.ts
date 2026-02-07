export function verifySignature(body: string, signatureHeader: string): boolean {
  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  if (!secret) return false;

  const encoder = new TextEncoder();
  const key = encoder.encode(secret);

  const hmac = new Bun.CryptoHasher("sha256", key);
  hmac.update(body);
  const expected = "sha256=" + hmac.digest("hex");

  if (expected.length !== signatureHeader.length) return false;

  const a = encoder.encode(expected);
  const b = encoder.encode(signatureHeader);

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= (a[i] ?? 0) ^ (b[i] ?? 0);
  }
  return result === 0;
}
