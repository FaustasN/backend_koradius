import { db } from './db.js';

export async function initDb() {
  try {
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
      CREATE TABLE IF NOT EXISTS payments (
        id SERIAL PRIMARY KEY,
        order_id VARCHAR(40) UNIQUE NOT NULL,
        travel_packet_id INTEGER REFERENCES travel_packets(id) ON DELETE SET NULL,

        amount INTEGER NOT NULL,
        currency VARCHAR(3) NOT NULL DEFAULT 'EUR',
        description TEXT,

        status VARCHAR(20) NOT NULL DEFAULT 'pending'
          CHECK (status IN ('pending', 'paid', 'failed', 'cancelled', 'refunded')),

        paysera_status INTEGER,
        is_test BOOLEAN DEFAULT false,
        payment_method VARCHAR(50),

        pay_amount INTEGER,
        pay_currency VARCHAR(3),

        customer_email_encrypted TEXT,
        customer_name_encrypted TEXT,
        customer_phone_encrypted TEXT,
        product_info_encrypted TEXT,

        callback_raw JSONB,

        paid_at TIMESTAMP,
        failed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.query(`CREATE INDEX IF NOT EXISTS idx_gallery_category ON gallery(category)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_gallery_active ON gallery(is_active)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_travel_packets_category ON travel_packets(category)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_travel_packets_active ON travel_packets(is_active)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_contacts_resolved ON contacts(is_resolved)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at)`);

    console.log('Database initialized');
  } catch (error) {
    console.error('Database init failed:', error.message);
    throw error;
  }
}