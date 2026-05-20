// Script para gerar URL assinada para imagem do post 360011
import { config } from 'dotenv';
config();

const forgeUrl = process.env.BUILT_IN_FORGE_API_URL?.replace(/\/+$/, '');
const forgeKey = process.env.BUILT_IN_FORGE_API_KEY;

const key = 'generated/1779312649531_0559277e.png';

const url = new URL('v1/storage/presign/get', forgeUrl + '/');
url.searchParams.set('path', key);

const resp = await fetch(url, {
  headers: { Authorization: `Bearer ${forgeKey}` }
});

if (!resp.ok) {
  console.error('Erro:', resp.status, await resp.text());
  process.exit(1);
}

const data = await resp.json();
console.log('SIGNED_URL:', data.url);
