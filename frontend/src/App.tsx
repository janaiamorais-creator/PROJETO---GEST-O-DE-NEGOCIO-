import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import './App.css'

const API_BASE = 'http://localhost:3000/api'
const PRODUCTS_URL = `${API_BASE}/products`

type Product = {
  id: string
  sku: string
  name: string
  description?: string
  costPrice: number
  sellingPrice: number
  currentStock: number
  minStock: number
  unit: string
}

type ProductForm = Omit<Product, 'id'>
const initialForm: ProductForm = { sku: '', name: '', description: '', costPrice: 0, sellingPrice: 0, currentStock: 0, minStock: 0, unit: 'UN' }

function App() {
  const [products, setProducts] = useState<Product[] | null>(null)
  const [form, setForm] = useState<ProductForm>(initialForm)
  const [saleProductId, setSaleProductId] = useState('')
  const [saleQuantity, setSaleQuantity] = useState(1)
  const [query, setQuery] = useState('')
  const [saving, setSaving] = useState(false)
  const [selling, setSelling] = useState(false)
  const [message, setMessage] = useState('')
  const [messageKind, setMessageKind] = useState<'success' | 'error'>('success')

  const notify = (text: string, kind: 'success' | 'error') => { setMessage(text); setMessageKind(kind) }
  const loadProducts = async () => {
    try {
      const response = await fetch(PRODUCTS_URL)
      if (!response.ok) throw new Error('Não foi possível carregar o estoque.')
      setProducts(await response.json())
    } catch (error) { notify(error instanceof Error ? error.message : 'Erro de conexão com a API.', 'error') }
  }
  useEffect(() => { void loadProducts() }, [])

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('pt-BR')
    return (products ?? []).filter((product) => !normalizedQuery || product.name.toLocaleLowerCase('pt-BR').includes(normalizedQuery) || product.sku.toLocaleLowerCase('pt-BR').includes(normalizedQuery))
  }, [products, query])
  const updateForm = (field: keyof ProductForm, value: string) => setForm((current) => ({ ...current, [field]: ['costPrice', 'sellingPrice', 'currentStock', 'minStock'].includes(field) ? Number(value) : value }))

  const createProduct = async (event: FormEvent) => {
    event.preventDefault(); setSaving(true); setMessage('')
    try {
      const response = await fetch(PRODUCTS_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Não foi possível cadastrar o produto.')
      setForm(initialForm); notify('Produto cadastrado com sucesso.', 'success'); await loadProducts()
    } catch (error) { notify(error instanceof Error ? error.message : 'Erro ao cadastrar produto.', 'error') }
    finally { setSaving(false) }
  }
  const registerSale = async (event: FormEvent) => {
    event.preventDefault(); setSelling(true); setMessage('')
    try {
      const response = await fetch(`${API_BASE}/sales`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ productId: saleProductId, quantity: saleQuantity }) })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Não foi possível registrar a venda.')
      setSaleQuantity(1); notify('Venda registrada e estoque atualizado.', 'success'); await loadProducts()
    } catch (error) { notify(error instanceof Error ? error.message : 'Erro de conexão com a API.', 'error') }
    finally { setSelling(false) }
  }
  const updateStock = async (product: Product, value: string) => {
    const currentStock = Number(value)
    if (!Number.isInteger(currentStock) || currentStock < 0) return
    try {
      const response = await fetch(`${PRODUCTS_URL}/${product.id}/stock`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ currentStock }) })
      if (!response.ok) throw new Error('Não foi possível atualizar o estoque.')
      setProducts((current) => (current ?? []).map((item) => item.id === product.id ? { ...item, currentStock } : item))
    } catch (error) { notify(error instanceof Error ? error.message : 'Erro ao atualizar estoque.', 'error') }
  }

  const lowStock = products?.filter((product) => product.currentStock <= product.minStock).length ?? 0
  const stockValue = products?.reduce((total, product) => total + product.currentStock * product.costPrice, 0) ?? 0
  return <main className="shell">
    <header className="topbar"><div><span className="kicker">OPERAÇÕES · ESTOQUE</span><h1>Controle de produtos</h1></div><span className="live"><i /> API conectada</span></header>
    <section className="summary"><div><span>Total de Produtos</span><strong>{(products?.length ?? 0).toString().padStart(2, '0')}</strong></div><div><span>Valor Total em Estoque</span><strong>R$ {stockValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong></div><div><span>Itens com Estoque Baixo</span><strong className="warning">{lowStock.toString().padStart(2, '0')}</strong></div></section>
    {message && <p className={`message-banner ${messageKind}`} role="status">{message}</p>}
    <div className="content">
      <section className="panel form-panel"><div className="panel-heading"><div><span className="eyebrow">NOVO REGISTRO</span><h2>Cadastrar produto</h2></div><span className="plus">+</span></div><form onSubmit={createProduct}><label>SKU<input required value={form.sku} onChange={(event) => updateForm('sku', event.target.value)} placeholder="Ex.: PROD001" /></label><label>Nome do produto<input required value={form.name} onChange={(event) => updateForm('name', event.target.value)} placeholder="Nome comercial" /></label><label>Descrição<input value={form.description} onChange={(event) => updateForm('description', event.target.value)} placeholder="Detalhes opcionais" /></label><div className="form-grid"><label>Custo (R$)<input required min="0" step="0.01" type="number" value={form.costPrice} onChange={(event) => updateForm('costPrice', event.target.value)} /></label><label>Venda (R$)<input required min="0" step="0.01" type="number" value={form.sellingPrice} onChange={(event) => updateForm('sellingPrice', event.target.value)} /></label></div><div className="form-grid"><label>Estoque inicial<input required min="0" step="1" type="number" value={form.currentStock} onChange={(event) => updateForm('currentStock', event.target.value)} /></label><label>Estoque mínimo<input min="0" step="1" type="number" value={form.minStock} onChange={(event) => updateForm('minStock', event.target.value)} /></label></div><button className="primary" disabled={saving}>{saving ? 'Salvando...' : 'Cadastrar produto'} <span>→</span></button></form></section>
      <section className="panel form-panel sale-panel"><div className="panel-heading"><div><span className="eyebrow">SAÍDA DE ESTOQUE</span><h2>Registrar venda</h2></div><span className="sale-mark">↗</span></div><form onSubmit={registerSale}><label>Produto<select required value={saleProductId} onChange={(event) => setSaleProductId(event.target.value)}><option value="">Selecione um produto</option>{(products ?? []).filter((product) => product.currentStock > 0).map((product) => <option key={product.id} value={product.id}>{product.name} · {product.currentStock} {product.unit} disponíveis</option>)}</select></label><label>Quantidade<input required min="1" step="1" type="number" value={saleQuantity} onChange={(event) => setSaleQuantity(Number(event.target.value))} /></label><button className="primary sale-button" disabled={selling || !saleProductId}>{selling ? 'Finalizando...' : 'Finalizar venda'} <span>→</span></button></form></section>
      <section className="panel inventory"><div className="panel-heading"><div><span className="eyebrow">VISÃO GERAL</span><h2>Estoque atual</h2></div><button className="refresh" title="Atualizar estoque" onClick={() => void loadProducts()}>↻</button></div><div className="search-wrap"><span>⌕</span><input aria-label="Buscar produto por nome ou SKU" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por nome ou SKU..." /></div>{products === null ? <p className="empty">Carregando produtos...</p> : filteredProducts.length === 0 ? <p className="empty">Nenhum produto encontrado.</p> : <div className="table-wrap"><table><thead><tr><th>Produto</th><th>SKU</th><th>Venda</th><th>Quantidade</th><th>Status</th></tr></thead><tbody>{filteredProducts.map((product) => { const low = product.currentStock <= product.minStock; return <tr key={product.id}><td><strong>{product.name}</strong><small>{product.description || 'Sem descrição'}</small></td><td className="muted">{product.sku}</td><td>R$ {product.sellingPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td><td><input className="stock-input" aria-label={`Estoque de ${product.name}`} type="number" min="0" defaultValue={product.currentStock} onBlur={(event) => void updateStock(product, event.target.value)} /></td><td><span className={`status ${low ? 'low' : 'ok'}`}>{low ? 'Reposição' : 'Normal'}</span></td></tr>})}</tbody></table></div>}</section>
    </div>
  </main>
}
export default App
