// API serverless para obter perfil do usuário no Vercel
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

// Modelo de usuário
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  companyName: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  trialExpires: { type: Date, default: () => new Date(+new Date() + 5*24*60*60*1000) },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

// Verificar se o modelo já existe para evitar erros
let User;
try {
  User = mongoose.model('User');
} catch (error) {
  User = mongoose.model('User', userSchema);
}

// Conectar ao MongoDB
const connectToDatabase = async () => {
  if (mongoose.connection.readyState >= 1) return;
  
  return mongoose.connect('mongodb+srv://gerenciadoc:M4hyCLplkQ3Uqg0D@cluster0.mongodb.net/gerenciadoc?retryWrites=true&w=majority', {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
};

// Middleware para verificar autenticação
const verifyToken = (req) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, 'gerenciadoc_jwt_secret');
    return decoded;
  } catch (error) {
    return null;
  }
};

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
    res.status(200).end();
    return;
  }

  // Verificar se é uma requisição GET
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  try {
    // Verificar autenticação
    const decoded = verifyToken(req);
    if (!decoded) {
      return res.status(401).json({ message: 'Não autorizado' });
    }

    // Conectar ao banco de dados
    await connectToDatabase();

    // Buscar usuário pelo ID
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    // Verificar se o usuário está ativo
    if (!user.isActive) {
      return res.status(401).json({ message: 'Conta desativada. Entre em contato com o suporte.' });
    }

    // Retornar dados do usuário
    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      companyName: user.companyName,
      role: user.role,
      trialExpires: user.trialExpires,
      isActive: user.isActive,
      createdAt: user.createdAt
    });
  } catch (error) {
    console.error('Erro ao obter perfil:', error);
    res.status(500).json({ message: 'Erro no servidor', error: error.message });
  }
};
