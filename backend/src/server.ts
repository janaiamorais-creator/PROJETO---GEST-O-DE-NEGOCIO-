import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { randomUUID } from 'crypto';

const app = express();
app.use(cors());
app.use(express.json());

async function getDb() {
  return open({
    filename: path.resolve(__dirname, '../dev.db'),
    driver: sqlite3.Database,
  });
}

app.get('/api/health', (_req, res) => {
  res.json({ status: 'OK', message: 'API rodando com sucesso!' });
});

app.get('/api/products', async (_req, res) => {
  try {
    const db = await getDb();
    const products = await db.all('SELECT * FROM products ORDER BY createdAt DESC');
    res.json(products);
  } catch {
    res.status(500).json({ error: 'Erro ao buscar produtos' });
  }
});

app.post('/api/products', async (req, res) => {
  const { sku, name, description, costPrice, sellingPrice, currentStock, minStock, unit } = req.body;
  if (!sku || !name || costPrice === undefined || sellingPrice === undefined || currentStock === undefined) {
    return res.status(400).json({ error: 'Campos obrigatórios: sku, name, costPrice, sellingPrice, currentStock' });
  }
  try {
    const db = await getDb();
    const id = randomUUID();
    await db.run(
      `INSERT INTO products (id, sku, name, description, costPrice, sellingPrice, currentStock, minStock, unit)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      id, sku, name, description || '', costPrice, sellingPrice, currentStock, minStock || 0, unit || 'UN',
    );
    res.status(201).json({ id, sku, name, message: 'Produto cadastrado com sucesso!' });
  } catch (error) {
    if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'SKU já cadastrado em outro produto' });
    }
    res.status(500).json({ error: 'Erro ao cadastrar produto' });
  }
});

app.patch('/api/products/:id/stock', async (req, res) => {
  const { currentStock } = req.body;
  if (currentStock === undefined) return res.status(400).json({ error: 'Informe a nova quantidade do estoque' });
  try {
    const db = await getDb();
    await db.run('UPDATE products SET currentStock = ? WHERE id = ?', currentStock, req.params.id);
    res.json({ message: 'Estoque atualizado com sucesso!' });
  } catch {
    res.status(500).json({ error: 'Erro ao atualizar estoque' });
  }
});

app.post('/api/sales', async (req, res) => {
  const { productId, quantity } = req.body;
  const parsedQuantity = Number(quantity);
  if (!productId || !Number.isInteger(parsedQuantity) || parsedQuantity <= 0) {
    return res.status(400).json({ error: 'Informe um produto e uma quantidade inteira positiva' });
  }
  const db = await getDb();
  try {
    await db.run('BEGIN TRANSACTION');
    const product = await db.get<{ id: string; sellingPrice: number; currentStock: number }>('SELECT id, sellingPrice, currentStock FROM products WHERE id = ?', productId);
    if (!product) { await db.run('ROLLBACK'); return res.status(404).json({ error: 'Produto não encontrado' }); }
    if (product.currentStock < parsedQuantity) { await db.run('ROLLBACK'); return res.status(400).json({ error: `Estoque insuficiente. Disponível: ${product.currentStock}` }); }
    await db.run('UPDATE products SET currentStock = currentStock - ? WHERE id = ?', parsedQuantity, productId);
    const id = randomUUID();
    const totalAmount = product.sellingPrice * parsedQuantity;
    await db.run('INSERT INTO sales (id, productId, quantity, totalAmount, paymentMethod) VALUES (?, ?, ?, ?, ?)', id, productId, parsedQuantity, totalAmount, 'CASH');
    await db.run('COMMIT');
    res.status(201).json({ id, productId, quantity: parsedQuantity, totalAmount, message: 'Venda registrada com sucesso!' });
  } catch {
    await db.run('ROLLBACK').catch(() => undefined);
    res.status(500).json({ error: 'Erro ao registrar venda' });
  } finally { await db.close(); }
});

app.get('/api/users', async (_req, res) => {
  try {
    const db = await getDb();
    const users = await db.all('SELECT id, name, email, role, createdAt FROM users');
    res.json(users);
  } catch {
    res.status(500).json({ error: 'Erro ao buscar usuários' });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
