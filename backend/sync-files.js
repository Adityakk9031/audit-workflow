const fs = require('fs');
const path = require('path');
const db = require('./src/db');

async function sync() {
  const uploadsDir = path.join(__dirname, 'uploads');
  const docs = await db.query('SELECT id, file_path, name FROM documents WHERE file_path IS NOT NULL');
  console.log(`Found ${docs.length} documents with file_path in DB`);

  let synced = 0;
  for (const doc of docs) {
    const filePath = path.join(uploadsDir, doc.file_path);
    if (fs.existsSync(filePath)) {
      const buffer = fs.readFileSync(filePath);
      await db.execute('UPDATE documents SET file_data = $1 WHERE id = $2', [buffer, doc.id]);
      synced++;
      console.log(`✅ Synced to Neon DB: ${doc.name} (${doc.file_path}, ${buffer.length} bytes)`);
    } else {
      console.log(`⚠️  File not found on local disk: ${doc.file_path}`);
    }
  }
  console.log(`🎉 Successfully synced ${synced} files to Neon PostgreSQL cloud storage!`);
  process.exit(0);
}

sync().catch(err => {
  console.error('Sync failed:', err);
  process.exit(1);
});
