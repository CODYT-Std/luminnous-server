const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;
const { generateApiKey, saveApiKey, verifyApiKey } = require('./apiKeyService');

// Gera uma nova API Key e salva no banco
app.get('/generate-key', async (req, res) => {
    try {
        const apiKey = generateApiKey();
        await saveApiKey(apiKey);
        res.json({ apiKey });
    } catch (err) {
        res.status(500).json({ error: 'Erro ao gerar API Key.' });
    }
});

// Middleware para validar API Key usando banco
async function validateApiKey(req, res, next) {
    const key = req.headers['x-api-key'];
    if (!key || !(await verifyApiKey(key))) {
        return res.status(401).json({ error: 'API Key inválida ou ausente.' });
    }
    next();
}

// Endpoint protegido
app.get('/protected', validateApiKey, (req, res) => {
    res.json({ message: 'Acesso autorizado com API Key válida!' });
});

// Endpoint para verificar API Key via URL
app.get('/verify/:key', async (req, res) => {
    const key = req.params.key;
    if (!key) {
        return res.status(400).json({ valid: false, error: 'API Key não fornecida.' });
    }
    const valid = await verifyApiKey(key);
    res.json({ valid });
});

// Endpoint para validação simples via query string (Roblox/sites)
app.get('/validate', async (req, res) => {
    const key = req.query.key;
    if (!key) {
        return res.status(400).json({ valid: false, error: 'API Key não fornecida.' });
    }
    const valid = await verifyApiKey(key);
    res.json({ valid });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor rodando em 0.0.0.0:${PORT}`);
});

// Todas as rotas não encontradas retornam JSON
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint não encontrado.' });
});
