import 'dotenv/config';
import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) { console.error('DATABASE_URL not set'); process.exit(1); }

const conn = await mysql.createConnection(DATABASE_URL);

const tables = [
  `CREATE TABLE IF NOT EXISTS \`instagram_accounts\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`handle\` varchar(128) NOT NULL,
    \`displayName\` varchar(256) NOT NULL,
    \`accountType\` enum('personal','business') NOT NULL,
    \`tone\` enum('personal','corporate') NOT NULL,
    \`avatarUrl\` text,
    \`bio\` text,
    \`createdAt\` timestamp NOT NULL DEFAULT (now()),
    CONSTRAINT \`instagram_accounts_id\` PRIMARY KEY(\`id\`),
    CONSTRAINT \`instagram_accounts_handle_unique\` UNIQUE(\`handle\`)
  )`,
  `CREATE TABLE IF NOT EXISTS \`posts\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`userId\` int NOT NULL,
    \`accountId\` int NOT NULL,
    \`caption\` text,
    \`status\` enum('draft','pending','approved','scheduled','published','rejected') NOT NULL DEFAULT 'draft',
    \`theme\` varchar(128),
    \`scheduledAt\` timestamp NULL,
    \`publishedAt\` timestamp NULL,
    \`instagramPostId\` varchar(256),
    \`instagramPermalink\` text,
    \`likes\` int DEFAULT 0,
    \`comments\` int DEFAULT 0,
    \`createdAt\` timestamp NOT NULL DEFAULT (now()),
    \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT \`posts_id\` PRIMARY KEY(\`id\`)
  )`,
  `CREATE TABLE IF NOT EXISTS \`post_media\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`postId\` int NOT NULL,
    \`mediaUrl\` text NOT NULL,
    \`mediaType\` enum('image','video') NOT NULL DEFAULT 'image',
    \`sortOrder\` int NOT NULL DEFAULT 0,
    \`createdAt\` timestamp NOT NULL DEFAULT (now()),
    CONSTRAINT \`post_media_id\` PRIMARY KEY(\`id\`)
  )`,
  `CREATE TABLE IF NOT EXISTS \`assets\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`userId\` int NOT NULL,
    \`name\` varchar(256) NOT NULL,
    \`url\` text NOT NULL,
    \`fileKey\` varchar(512) NOT NULL,
    \`mimeType\` varchar(128),
    \`createdAt\` timestamp NOT NULL DEFAULT (now()),
    CONSTRAINT \`assets_id\` PRIMARY KEY(\`id\`)
  )`,
  `CREATE TABLE IF NOT EXISTS \`content_themes\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`name\` varchar(128) NOT NULL,
    \`slug\` varchar(128) NOT NULL,
    \`description\` text,
    \`icon\` varchar(64),
    \`color\` varchar(32),
    \`createdAt\` timestamp NOT NULL DEFAULT (now()),
    CONSTRAINT \`content_themes_id\` PRIMARY KEY(\`id\`),
    CONSTRAINT \`content_themes_slug_unique\` UNIQUE(\`slug\`)
  )`
];

for (const sql of tables) {
  await conn.execute(sql);
  console.log('OK:', sql.substring(0, 60) + '...');
}

// Seed instagram accounts
await conn.execute(`INSERT IGNORE INTO instagram_accounts (handle, displayName, accountType, tone, bio) VALUES ('aguiaroriginal', 'Aguiar', 'personal', 'personal', 'Legendário - Servo do Senhor!!! MIR Macaé @triarcsolutions | Founder')`);
await conn.execute(`INSERT IGNORE INTO instagram_accounts (handle, displayName, accountType, tone, bio) VALUES ('triarcsolutions', 'Triarc Solutions', 'business', 'corporate', 'Desenvolvimento de software e apps. Criadores do Titan App - Iron Grip. Endless Ascend.')`);
console.log('OK: Seeded instagram accounts');

// Seed content themes
const themes = [
  ['Build in Public', 'build-in-public', 'Compartilhar a jornada de desenvolvimento do Titan App de forma transparente', 'Hammer', '#06b6d4'],
  ['Funcionalidade em Foco', 'funcionalidade-em-foco', 'Destacar funcionalidades específicas do Titan App com detalhes técnicos', 'Zap', '#8b5cf6'],
  ['Bastidores', 'bastidores', 'Mostrar os bastidores do desenvolvimento e da equipe Triarc Solutions', 'Camera', '#f59e0b'],
  ['Dicas de Segurança', 'dicas-de-seguranca', 'Dicas de segurança na escalada integradas com funcionalidades do app', 'Shield', '#ef4444'],
  ['Desafio Collab', 'desafio-collab', 'Posts colaborativos entre @aguiaroriginal e @triarcsolutions', 'Users', '#ec4899'],
];

for (const [name, slug, desc, icon, color] of themes) {
  await conn.execute(`INSERT IGNORE INTO content_themes (name, slug, description, icon, color) VALUES (?, ?, ?, ?, ?)`, [name, slug, desc, icon, color]);
}
console.log('OK: Seeded content themes');

await conn.end();
console.log('Migration complete!');
