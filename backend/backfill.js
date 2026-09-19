const db = require('./src/db');

async function run() {
  const docs = await db.query(
    'SELECT id, name, file_path, original_filename, file_type, file_size, LENGTH(file_data) as bytes FROM documents WHERE file_data IS NOT NULL'
  );
  
  for (const doc of docs) {
    let ext = '';
    if (doc.original_filename && doc.original_filename.includes('.')) {
      ext = doc.original_filename.split('.').pop().toLowerCase();
    } else if (doc.file_path && doc.file_path.includes('.')) {
      ext = doc.file_path.split('.').pop().toLowerCase();
    }

    let mime = doc.file_type;
    if (!mime) {
      if (ext === 'pdf') mime = 'application/pdf';
      else if (['jpg', 'jpeg'].includes(ext)) mime = 'image/jpeg';
      else if (ext === 'png') mime = 'image/png';
      else if (ext === 'webp') mime = 'image/webp';
      else mime = 'application/octet-stream';
    }

    const size = doc.file_size || doc.bytes;
    const origName = doc.original_filename || (doc.name + (ext ? '.' + ext : ''));

    await db.execute(
      'UPDATE documents SET file_type = $1, file_size = $2, original_filename = $3 WHERE id = $4',
      [mime, size, origName, doc.id]
    );
  }

  console.log('✅ Backfill complete successfully.');
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
