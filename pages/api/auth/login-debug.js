// API serverless para login com logs detalhados
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

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

// Handler para API Routes do Next.js/Vercel
export default async function handler(req, res) {
  console.log('Login Debug - Iniciando função');
  
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );
  
  if (req.method === 'OPTIONS') {
    console.log('Login Debug - Requisição OPTIONS');
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    console.log(`Login Debug - Método inválido: ${req.method}`);
    return res.status(405).json({ error: 'Método não permitido' });
  }
  
  try {
    console.log('Login Debug - Iniciando processo de login');
    
    const { email, password } = req.body;
    console.log(`Login Debug - Dados recebidos: email=${email}, password=${password ? 'fornecido' : 'não fornecido'}`);
    
    if (!email || !password) {
      console.log('Login Debug - Email ou senha não fornecidos');
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }
    
    // Conectar ao MongoDB
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://gerenciadoc:M4hyCLplkQ3Uqg0D@cluster0.mongodb.net/gerenciadoc?retryWrites=true&w=majority';
    console.log(`Login Debug - Conectando ao MongoDB: ${MONGODB_URI.substring(0, 20)}...`);
    
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('Login Debug - Conectado ao MongoDB');
    
    // Registrar modelo de usuário
    const User = mongoose.models.User || mongoose.model('User', userSchema);
    
    // Buscar usuário
    console.log(`Login Debug - Buscando usuário com email: ${email}`);
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log('Login Debug - Usuário não encontrado');
      await mongoose.disconnect();
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }
    
    console.log(`Login Debug - Usuário encontrado: ${user.name}, role=${user.role}, isActive=${user.isActive}`);
    console.log(`Login Debug - Hash da senha armazenada: ${user.password.substring(0, 10)}...`);
    
    // Verificar senha
    console.log('Login Debug - Comparando senhas');
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      console.log('Login Debug - Senha incorreta');
      await mongoose.disconnect();
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }
    
    console.log('Login Debug - Senha correta');
    
    // Verificar se usuário está ativo
    if (!user.isActive) {
      console.log('Login Debug - Usuário inativo');
      await mongoose.disconnect();
      return res.status(401).json({ error: 'Conta inativa' });
    }
    
    // Gerar token JWT
    const JWT_SECRET = process.env.JWT_SECRET || 'gerenciadoc-secret-key-development';
    console.log(`Login Debug - Gerando token JWT com secret: ${JWT_SECRET.substring(0, 10)}...`);
    
    const payload = {
      user: {
        id: user._id,
        email: user.email,
        role: user.role
      }
    };
    
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
    console.log('Login Debug - Token JWT gerado');
    
    // Fechar conexão
    await mongoose.disconnect();
    console.log('Login Debug - Desconectado do MongoDB');
    
    // Retornar resposta
    console.log('Login Debug - Login bem-sucedido, retornando token');
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
    console.error('Login Debug - Erro:', error);
    return res.status(500).json({ error: 'Erro no servidor', details: error.message });
  } finally {
    // Garantir que a conexão seja fechada em caso de erro
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      console.log('Login Debug - Desconectado do MongoDB (finally)');
    }
  }
}
