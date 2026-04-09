import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';
import { db } from './config/db.js';
import { initDb } from './config/initdb.js';

const PORT = process.env.PORT || 8080;

async function startServer() {


  try {
    await db.query('SELECT NOW()');
    console.log('DB connected');
    await initDb();

    app.listen(PORT, () => {
      console.log(`Server  on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('FAILED TO START SERVER');
    console.error(error);
    process.exit(1);
  }
}

startServer();