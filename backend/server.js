const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const mongoose = require('mongoose');

// Importar rotas
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors()); // Habilita CORS para todas as origens (ajustar em produção)
app.use(express.json()); // Habilita o parse de JSON no corpo das requisições

// Rotas
app.get("/api", (req, res) => {
  res.json({ message: "API do Gerenciadoc está funcionando!" });
});

app.use("/api/auth", authRoutes); // Usa as rotas de autenticação
app.use("/api/admin", adminRoutes); // Usa as rotas de administração

// TODO: Adicionar rotas de gestão de documentos
// TODO: Adicionar rotas de gestão de licitações
// TODO: Adicionar rotas do marketplace

// Conexão com Banco de Dados
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log('MongoDB Conectado com sucesso!'))
.catch(err => console.error('Erro na conexão com MongoDB:', err));

app.listen(PORT, () => {
  console.log(`Servidor backend rodando na porta ${PORT}`);
});
