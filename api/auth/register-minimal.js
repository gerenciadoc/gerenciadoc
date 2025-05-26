// API serverless para registro de usuários no Gerenciadoc (versão minimalista)
// Esta versão é extremamente simplificada para garantir compatibilidade com o Vercel

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Modelo de usuário simplificado
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'user' },
  company: String,
  createdAt: { type: Date, default: Date.now },
  trialEndsAt: { type: Date },
  isActive: { type: Boolean, default: true }
});

// Handler para API Routes do Vercel
module.exports = async (req, res) => {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );
  
  // Responder a requisições OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Para GET, retornar uma mensagem de status
  if (req.method === 'GET') {
    return res.status(200).json({ 
      status: 'Endpoint de registro minimalista ativo',
      message: 'Use POST para registrar um novo usuário'
    });
  }
  
  // Verificar método HTTP
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    // Verificar corpo da requisição
    if (!req.body) {
      return res.status(400).json({ error: 'Corpo da requisição vazio' });
    }
    
    // Obter dados do corpo da requisição
    const { name, email, password, company } = req.body;
    
    // Validar entrada
    if (!name || !email || !password) {
      return res.status(400).json({ 
        error: 'Dados incompletos', 
        message: 'Nome, email e senha são obrigatórios',
        received: { name: !!name, email: !!email, password: !!password }
      });
    }
    
    // Conectar ao MongoDB
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://gerenciadoc:M4hyCLplkQ3Uqg0D@cluster0.vowrllh.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
    
    await mongoose.connect(MONGODB_URI);
    
    // Obter modelo de usuário
    const User = mongoose.models.User || mongoose.model('User', userSchema);
    
    // Verificar se o email já está em uso
    const existingUser = await User.findOne({ email });
    
    if (existingUser) {
      await mongoose.disconnect();
      return res.status(400).json({ error: 'Este email já está em uso' });
    }
    
    // Gerar hash da senha
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Criar novo usuário
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      company,
      role: 'user',
      trialEndsAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 dias de trial
      isActive: true
    });
    
    // Salvar usuário no banco de dados
    await newUser.save();
    
    // Desconectar do MongoDB
    await mongoose.disconnect();
    
    // Retornar sucesso
    return res.status(201).json({
      success: true,
      message: 'Usuário registrado com sucesso',
      user: {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      }
    });
  } catch (error) {
    // Garantir que a conexão seja fechada em caso de erro
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    
    return res.status(500).json({ 
      error: 'Erro interno no servidor', 
      message: error.message
    });
  }
};
