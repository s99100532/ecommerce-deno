const key = await crypto.subtle.generateKey(
  { name: "HMAC", hash: "SHA-512" },
  true,
  ["sign", "verify"]
);

const jwk = await crypto.subtle.exportKey("jwk", key);

console.log(JSON.stringify(jwk));
