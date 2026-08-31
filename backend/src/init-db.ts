import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';

async function init() {
  const db = await open({
    filename: path.resolve(__dirname, '../dev.db'),
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      passwordHash TEXT NOT NULL,
      role TEXT DEFAULT 'EMPLOYEE',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      sku TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      costPrice REAL NOT NULL,
      sellingPrice REAL NOT NULL,
      currentStock INTEGER NOT NULL,
      minStock INTEGER NOT NULL,
      unit TEXT DEFAULT 'UN',
      isActive INTEGER DEFAULT 1,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sales (
      id TEXT PRIMARY KEY,
      productId TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      totalAmount REAL NOT NULL,
      paymentMethod TEXT NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const salesColumns = await db.all<{ name: string }[]>('PRAGMA table_info(sales)');
  const columnNames = salesColumns.map((column) => column.name);
  if (!columnNames.includes('productId')) await db.exec('ALTER TABLE sales ADD COLUMN productId TEXT');
  if (!columnNames.includes('quantity')) await db.exec('ALTER TABLE sales ADD COLUMN quantity INTEGER');

  console.log('✅ Banco de dados SQLite criado com sucesso!');
}

init().catch(console.error);