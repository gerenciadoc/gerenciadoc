// API serverless para registro de usuário no Vercel
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
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

  // Verificar se é uma requisição POST
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  try {
    // Conectar ao banco de dados
    await connectToDatabase();

    const { name, email, password, companyName } = req.body;

    // Validar dados de entrada
    if (!name || !email || !password || !companyName) {
      return res.status(400).json({ message: 'Todos os campos são obrigatórios' });
    }

    // Verificar se o email já está em uso
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email já está em uso' });
    }

    // Criptografar senha
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Criar novo usuário
    const user = new User({
      name,
      email,
      password: hashedPassword,
      companyName,
      trialExpires: new Date(+new Date() + 5*24*60*60*1000) // 5 dias de teste
    });

    // Salvar usuário no banco
    await user.save();

    // Gerar token JWT
    const token = jwt.sign(
      { id: user._id, role: user.role },
      'gerenciadoc_jwt_secret',
      { expiresIn: '24h' }
    );

    // Retornar dados do usuário e token
    res.status(201).json({
      token,
      _id: user._id,
      name: user.name,
      email: user.email,
      companyName: user.companyName,
      role: user.role,
      trialExpires: user.trialExpires,
      isActive: user.isActive
    });
  } catch (error) {
    console.error('Erro no registro:', error);
    res.status(500).json({ message: 'Erro no servidor', error: error.message });
  }
};
