import mysql from "mysql2/promise";
import "dotenv/config";

const conn = await mysql.createConnection(process.env.DATABASE_URL);
const [rows] = await conn.execute(
  "SELECT id, accessToken FROM instagram_accounts WHERE platform='linkedin' AND id=30002"
);
const acc = rows[0];
if (!acc || !acc.accessToken) {
  console.log("Sem token LinkedIn no banco");
  await conn.end();
  process.exit(1);
}

console.log("Token encontrado, buscando URN pessoal via /v2/me...");
const res = await fetch("https://api.linkedin.com/v2/me", {
  headers: { Authorization: `Bearer ${acc.accessToken}` },
});
const me = await res.json();
console.log("Status:", res.status, "Resposta:", JSON.stringify(me));

if (res.ok && me?.id) {
  const urn = `urn:li:person:${me.id}`;
  await conn.execute("UPDATE instagram_accounts SET linkedinUrn=? WHERE id=?", [urn, acc.id]);
  console.log("URN salvo:", urn);
} else {
  // Tenta também via /v2/userinfo (OpenID Connect)
  console.log("Tentando /v2/userinfo...");
  const res2 = await fetch("https://api.linkedin.com/v2/userinfo", {
    headers: { Authorization: `Bearer ${acc.accessToken}` },
  });
  const ui = await res2.json();
  console.log("userinfo status:", res2.status, JSON.stringify(ui));
  if (res2.ok && ui?.sub) {
    const urn = `urn:li:person:${ui.sub}`;
    await conn.execute("UPDATE instagram_accounts SET linkedinUrn=? WHERE id=?", [urn, acc.id]);
    console.log("URN salvo via userinfo:", urn);
  }
}

await conn.end();
