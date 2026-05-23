import mysql from "mysql2/promise";
import "dotenv/config";

const conn = await mysql.createConnection(process.env.DATABASE_URL);
const [rows] = await conn.execute(
  "SELECT id, accessToken FROM instagram_accounts WHERE platform='linkedin' AND id=30002"
);
const acc = rows[0];
await conn.end();

if (!acc?.accessToken) { console.log("Sem token"); process.exit(1); }

// Tenta decodificar como JWT (LinkedIn tokens podem ser JWTs)
const parts = acc.accessToken.split(".");
if (parts.length === 3) {
  try {
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString());
    console.log("JWT payload:", JSON.stringify(payload, null, 2));
    if (payload.sub) console.log("URN seria: urn:li:person:" + payload.sub);
  } catch(e) {
    console.log("Não é JWT válido");
  }
} else {
  console.log("Token não é JWT (partes:", parts.length, ")");
  console.log("Token prefix:", acc.accessToken.slice(0, 30));
}
