"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sqlite3_1 = __importDefault(require("sqlite3"));
const sqlite_1 = require("sqlite");
const path_1 = __importDefault(require("path"));
async function init() {
    const db = await (0, sqlite_1.open)({
        filename: path_1.default.resolve(__dirname, '../dev.db'),
        driver: sqlite3_1.default.Database
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

  const salesColumns = await db.all('PRAGMA table_info(sales)');
  const columnNames = salesColumns.map((column) => column.name);
  if (!columnNames.includes('productId')) await db.exec('ALTER TABLE sales ADD COLUMN productId TEXT');
  if (!columnNames.includes('quantity')) await db.exec('ALTER TABLE sales ADD COLUMN quantity INTEGER');
    console.log('✅ Banco de dados SQLite criado com sucesso!');
}
init().catch(console.error);
//# sourceMappingURL=init-db.js.map