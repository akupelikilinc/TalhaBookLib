import db from './database'
import bcrypt from 'bcryptjs'

export async function initDatabase() {
  try {
    // Books table
    await db.query(`
      CREATE TABLE IF NOT EXISTS books (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        author TEXT,
        category TEXT,
        level TEXT,
        pages INTEGER DEFAULT 0,
        finished_date TIMESTAMP,
        rating REAL DEFAULT 3.0 CHECK (rating >= 1 AND rating <= 5),
        mood TEXT,
        notes TEXT,
        cover_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `)

    await db.query('CREATE INDEX IF NOT EXISTS idx_books_category ON books(category);')
    await db.query('CREATE INDEX IF NOT EXISTS idx_books_level ON books(level);')
    await db.query('CREATE INDEX IF NOT EXISTS idx_books_finished_date ON books(finished_date);')
    await db.query('CREATE INDEX IF NOT EXISTS idx_books_rating ON books(rating);')

    // Settings table
    await db.query(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT,
        description TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `)

    // Users table
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT DEFAULT 'admin',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `)

    // Default settings
    const defaultSettings = [
      { key: 'site_title', value: 'Kitap Sitesine Dönüştürülmüş Talha KÜPELİKILINÇ', description: 'Site başlığı' },
      { key: 'site_subtitle', value: 'Her sayfa yeni bir macera!', description: 'Site alt başlığı' },
      { key: 'site_description', value: 'Bu site Talha KÜPELİKILINÇ\'in okuduğu kitapları, hislerini ve aldığı küçük notları saklamak için hazırlandı. Aile arasında paylaşılan bu dijital kütüphane sayesinde hangi kitabın ne zaman okunduğu, hangi karakterlerin sevildiği ve hangi fikirlerin ortaya çıktığı unutulmuyor.', description: 'Site açıklaması' },
      { key: 'profile_image', value: 'akupelikilinc.jpg', description: 'Profil resmi dosya adı' },
      { key: 'auto_refresh_interval', value: '30000', description: 'Otomatik yenileme süresi (ms)' }
    ]

    for (const setting of defaultSettings) {
      await db.query(
        'INSERT INTO settings (key, value, description) VALUES ($1, $2, $3) ON CONFLICT (key) DO NOTHING',
        [setting.key, setting.value, setting.description]
      )
    }

    // Default admin user
    const defaultPassword = await bcrypt.hash('admin123', 10)
    await db.query(
      'INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3) ON CONFLICT (username) DO NOTHING',
      ['admin', defaultPassword, 'admin']
    )

    console.log('✅ Database tables initialized')
  } catch (error: any) {
    console.error('❌ Database initialization error:', error.message)
    throw error
  }
}
