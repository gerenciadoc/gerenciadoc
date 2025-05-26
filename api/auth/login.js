// API serverless para login no Gerenciadoc
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Modelo de usuário
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

// Conexão com MongoDB
let cachedDb = null;
async function connectToDatabase() {
  if (cachedDb) {
    return cachedDb;
  }
  
  try {
    // Usar variáveis de ambiente ou fallback para credenciais de teste
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://gerenciadoc:M4hyCLplkQ3Uqg0D@cluster0.mongodb.net/gerenciadoc?retryWrites=true&w=majority';
    
    const connection = await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    cachedDb = connection;
    return connection;
  } catch (error) {
    console.error('Erro ao conectar ao MongoDB:', error);
    throw new Error('Não foi possível conectar ao banco de dados');
  }
}

// Configuração de CORS para permitir requisições
const allowCors = fn => async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  try {
    return await fn(req, res);
  } catch (error) {
    console.error('Erro na execução da função:', error);
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
};

// Função principal de login
const handler = async (req, res) => {
  // Verificar método HTTP
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    // Conectar ao banco de dados
    await connectToDatabase();
    
    // Obter modelo de usuário
    const User = mongoose.models.User || mongoose.model('User', userSchema);
    
    // Obter credenciais do corpo da requisição
    const { email, password } = req.body;
    
    // Validar entrada
    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }
    
    // Buscar usuário pelo email
    const user = await User.findOne({ email });
    
    // Verificar se o usuário existe
    if (!user) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }
    
    // Verificar se a senha está correta
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }
    
    // Verificar se o usuário está ativo
    if (!user.isActive) {
      return res.status(403).json({ error: 'Conta desativada' });
    }
    
    // Verificar se o período de teste expirou
    if (user.trialEndsAt && new Date() > user.trialEndsAt) {
      return res.status(403).json({ error: 'Período de teste expirado' });
    }
    
    // Gerar token JWT
    const JWT_SECRET = process.env.JWT_SECRET || 'gerenciadoc-secret-key-development';
    const token = jwt.sign(
      { 
        userId: user._id,
        email: user.email,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    // Retornar token e informações do usuário
    return res.status(200).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        company: user.company,
        trialEndsAt: user.trialEndsAt
      }
    });
  } catch (error) {
    console.error('Erro no login:', error);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
};

// Exportar handler com CORS
module.exports = allowCors(handler);
