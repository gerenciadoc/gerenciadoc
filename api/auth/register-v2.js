// API serverless para registro de usuários no Gerenciadoc (versão otimizada para Vercel)
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
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

// Cache de conexão MongoDB
let cachedDb = null;

// Função para conectar ao MongoDB com cache
async function connectToDatabase() {
  if (cachedDb && mongoose.connection.readyState === 1) {
    return cachedDb;
  }
  
  try {
    // Usar variáveis de ambiente ou fallback para credenciais de teste
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://gerenciadoc_user:admin@cluster0.vowrllh.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
    
    const connection = await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000
    });
    
    cachedDb = connection;
    return connection;
  } catch (error) {
    console.error('Erro ao conectar ao MongoDB:', error);
    throw new Error('Não foi possível conectar ao banco de dados');
  }
}

// Handler para API Routes do Vercel
const handler = async (req, res) => {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Verificar método HTTP
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    // Conectar ao banco de dados
    await connectToDatabase();
    
    // Obter modelo de usuário
    const User = mongoose.models.User || mongoose.model('User', userSchema);
    
    // Obter dados do corpo da requisição
    const { name, email, password, company } = req.body;
    
    // Validar entrada
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Nome, email e senha são obrigatórios' });
    }
    
    // Verificar se o email já está em uso
    const existingUser = await User.findOne({ email });
    
    if (existingUser) {
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
    
    // Gerar token JWT
    const JWT_SECRET = process.env.JWT_SECRET || 'gerenciadoc-secret-key-development';
    const token = jwt.sign(
      { 
        userId: newUser._id,
        email: newUser.email,
        role: newUser.role
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    // Retornar token e informações do usuário
    return res.status(201).json({
      token,
      _id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      company: newUser.company,
      trialEndsAt: newUser.trialEndsAt
    });
  } catch (error) {
    console.error('Erro no registro:', error);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  } finally {
    // Não fechar a conexão para reutilização em chamadas futuras
  }
};

// Exportar handler para Vercel
module.exports = handler;
