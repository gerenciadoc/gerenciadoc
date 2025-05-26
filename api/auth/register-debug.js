// API serverless para registro de usuários no Gerenciadoc (versão com logs detalhados)
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
  console.log('Register Debug - Iniciando conexão com MongoDB');
  
  if (cachedDb && mongoose.connection.readyState === 1) {
    console.log('Register Debug - Usando conexão em cache');
    return cachedDb;
  }
  
  try {
    // Usar variáveis de ambiente ou fallback para credenciais de teste
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://gerenciadoc:M4hyCLplkQ3Uqg0D@cluster0.vowrllh.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
    console.log(`Register Debug - Conectando ao MongoDB: ${MONGODB_URI.substring(0, 30)}...`);
    
    const connection = await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000
    });
    
    console.log('Register Debug - Conexão com MongoDB estabelecida com sucesso');
    cachedDb = connection;
    return connection;
  } catch (error) {
    console.error('Register Debug - Erro ao conectar ao MongoDB:', error);
    throw new Error(`Não foi possível conectar ao banco de dados: ${error.message}`);
  }
}

// Handler para API Routes do Vercel
const handler = async (req, res) => {
  console.log('Register Debug - Iniciando handler de registro');
  console.log(`Register Debug - Método HTTP: ${req.method}`);
  
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );
  
  if (req.method === 'OPTIONS') {
    console.log('Register Debug - Respondendo a requisição OPTIONS');
    return res.status(200).end();
  }
  
  // Para GET, retornar uma mensagem de status
  if (req.method === 'GET') {
    console.log('Register Debug - Respondendo a requisição GET com status');
    return res.status(200).json({ 
      status: 'Endpoint de registro ativo',
      message: 'Use POST para registrar um novo usuário'
    });
  }
  
  // Verificar método HTTP
  if (req.method !== 'POST') {
    console.log(`Register Debug - Método não permitido: ${req.method}`);
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    console.log('Register Debug - Processando requisição POST de registro');
    
    // Verificar corpo da requisição
    if (!req.body) {
      console.log('Register Debug - Corpo da requisição vazio');
      return res.status(400).json({ error: 'Corpo da requisição vazio' });
    }
    
    console.log('Register Debug - Corpo da requisição:', JSON.stringify(req.body));
    
    // Obter dados do corpo da requisição
    const { name, email, password, company } = req.body;
    
    // Validar entrada
    if (!name) {
      console.log('Register Debug - Nome não fornecido');
      return res.status(400).json({ error: 'Nome é obrigatório' });
    }
    
    if (!email) {
      console.log('Register Debug - Email não fornecido');
      return res.status(400).json({ error: 'Email é obrigatório' });
    }
    
    if (!password) {
      console.log('Register Debug - Senha não fornecida');
      return res.status(400).json({ error: 'Senha é obrigatória' });
    }
    
    console.log(`Register Debug - Dados validados: nome=${name}, email=${email}, company=${company || 'não fornecido'}`);
    
    // Conectar ao banco de dados
    console.log('Register Debug - Conectando ao MongoDB');
    await connectToDatabase();
    console.log('Register Debug - Conexão com MongoDB estabelecida');
    
    // Obter modelo de usuário
    console.log('Register Debug - Obtendo modelo de usuário');
    const User = mongoose.models.User || mongoose.model('User', userSchema);
    
    // Verificar se o email já está em uso
    console.log(`Register Debug - Verificando se o email já está em uso: ${email}`);
    const existingUser = await User.findOne({ email });
    
    if (existingUser) {
      console.log('Register Debug - Email já está em uso');
      return res.status(400).json({ error: 'Este email já está em uso' });
    }
    
    console.log('Register Debug - Email disponível para uso');
    
    // Gerar hash da senha
    console.log('Register Debug - Gerando hash da senha');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    console.log('Register Debug - Hash da senha gerado com sucesso');
    
    // Criar novo usuário
    console.log('Register Debug - Criando novo usuário');
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
    console.log('Register Debug - Salvando usuário no banco de dados');
    try {
      await newUser.save();
      console.log('Register Debug - Usuário salvo com sucesso');
    } catch (saveError) {
      console.error('Register Debug - Erro ao salvar usuário:', saveError);
      return res.status(500).json({ 
        error: 'Erro ao salvar usuário no banco de dados', 
        details: saveError.message,
        code: saveError.code
      });
    }
    
    // Gerar token JWT
    console.log('Register Debug - Gerando token JWT');
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
    console.log('Register Debug - Token JWT gerado com sucesso');
    
    // Retornar token e informações do usuário
    console.log('Register Debug - Retornando resposta de sucesso');
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
    console.error('Register Debug - Erro no registro:', error);
    return res.status(500).json({ 
      error: 'Erro interno no servidor', 
      message: error.message,
      stack: error.stack
    });
  }
};

// Exportar handler para Vercel
module.exports = handler;
