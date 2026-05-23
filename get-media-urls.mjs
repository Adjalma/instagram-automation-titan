import { createPool } from 'mysql2/promise';
import { config } from 'dotenv';
config({ path: '/home/ubuntu/instagram-automation-titan/.env' });

const pool = createPool(process.env.DATABASE_URL);
const [rows] = await pool.execute(`
  SELECT p.id, p.caption, pm.mediaUrl
  FROM posts p
  JOIN post_media pm ON pm.postId = p.id
  WHERE p.status = 'approved' AND p.mcpPending = 0
  ORDER BY p.createdAt ASC LIMIT 5
`);

const FORGE_URL = process.env.BUILT_IN_FORGE_API_URL?.replace(/\/+$/, '');
const FORGE_KEY = process.env.BUILT_IN_FORGE_API_KEY;

for (const row of rows) {
  const key = row.mediaUrl.replace('/manus-storage/', '');
  const getUrl = new URL('v1/storage/presign/get', FORGE_URL + '/');
  getUrl.searchParams.set('path', key);
  const resp = await fetch(getUrl, { headers: { Authorization: `Bearer ${FORGE_KEY}` } });
  const data = await resp.json();
  console.log(JSON.stringify({ id: row.id, caption: row.caption.slice(0, 60), signedUrl: data.url }));
}
await pool.end();
