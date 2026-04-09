import bcrypt from 'bcryptjs';
import { db } from './db.js';

export async function initDb() {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS contacts (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT,
        subject VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        preferred_contact VARCHAR(50) DEFAULT 'email',
        urgency VARCHAR(20) DEFAULT 'normal',
        ip_address INET,
        user_agent TEXT,
        is_resolved BOOLEAN DEFAULT false,
        resolved_by INTEGER REFERENCES admins(id),
        resolved_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        comment TEXT NOT NULL,
        trip_reference VARCHAR(255),
        ip_address INET,
        user_agent TEXT,
        is_approved BOOLEAN DEFAULT false,
        is_featured BOOLEAN DEFAULT false,
        approved_by INTEGER REFERENCES admins(id),
        approved_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS gallery (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        location VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        image_url TEXT NOT NULL,
        photographer VARCHAR(255) NOT NULL,
        date DATE DEFAULT CURRENT_DATE,
        likes INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS travel_packets (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        location VARCHAR(255) NOT NULL,
        duration VARCHAR(100) NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        original_price DECIMAL(10,2),
        rating DECIMAL(3,2) DEFAULT 0,
        reviews INTEGER DEFAULT 0,
        image_url TEXT NOT NULL,
        category VARCHAR(100) NOT NULL,
        badge VARCHAR(100),
        description TEXT,
        includes TEXT[],
        available_spots INTEGER DEFAULT 0,
        departure DATE,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        type VARCHAR(50) NOT NULL CHECK (type IN ('contact', 'review', 'order', 'system')),
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        reference_id INTEGER,
        reference_type VARCHAR(50),
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_read BOOLEAN DEFAULT false,
        read_by INTEGER REFERENCES admins(id),
        read_at TIMESTAMP,
        priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.query(`CREATE INDEX IF NOT EXISTS idx_gallery_category ON gallery(category)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_gallery_active ON gallery(is_active)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_travel_packets_category ON travel_packets(category)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_travel_packets_active ON travel_packets(is_active)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_contacts_resolved ON contacts(is_resolved)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_user_reviews_approved ON user_reviews(is_approved)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_admins_username ON admins(username)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_admins_active ON admins(is_active)`);

    const adminExists = await db.query(`SELECT COUNT(*) FROM admins`);

    if (parseInt(adminExists.rows[0].count, 10) === 0) {
      const defaultPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'admin12345';
      const hashedPassword = await bcrypt.hash(defaultPassword, 12);

      await db.query(
        `INSERT INTO admins (username, password_hash, email, role)
         VALUES ($1, $2, $3, $4)`,
        ['admin', hashedPassword, 'admin@koradius.com', 'admin']
      );

      console.log('Default admin created');
    }

    console.log('Database initialized');
  } catch (error) {
    console.error('Database init failed:', error.message);
    throw error;
  }
}