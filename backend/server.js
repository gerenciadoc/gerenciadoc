const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const documentRoutes = require('./routes/documentRoutes');
const collaboratorRoutes = require('./routes/collaboratorRoutes');
const collaboratorUploadRoutes = require('./routes/collaboratorUploadRoutes');
const { authMiddleware } = require('./middleware/authMiddleware');

// Carregar variáveis de ambiente
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', authMiddleware, express.static(path.join(__dirname, 'uploads')));

// Rotas
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/collaborator', collaboratorRoutes);
app.use('/colaborador', collaboratorUploadRoutes);

// Rota para verificar status da API
app.get('/api/status', (req, res) => {
    res.json({ status: 'online', timestamp: new Date() });
});

// Conectar ao MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('MongoDB conectado com sucesso!');
    })
    .catch(err => {
        console.error('Erro na conexão com MongoDB:', err.message);
    });

// Iniciar servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
