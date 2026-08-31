"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const sqlite3_1 = __importDefault(require("sqlite3"));
const sqlite_1 = require("sqlite");
const path_1 = __importDefault(require("path"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
async function getDb() {
    return (0, sqlite_1.open)({
        filename: path_1.default.resolve(__dirname, '../dev.db'),
        driver: sqlite3_1.default.Database,
    });
}
app.get('/api/health', (_req, res) => {
    res.json({ status: 'OK', message: 'API rodando com sucesso!' });
});
app.get('/api/users', async (_req, res) => {
    try {
        const db = await getDb();
        const users = await db.all('SELECT id, name, email, role, createdAt FROM users');
        res.json(users);
    }
    catch {
        res.status(500).json({ error: 'Erro ao buscar usuários' });
    }
});
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
//# sourceMappingURL=server.js.map