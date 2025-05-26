// API serverless para registro de usuários no Gerenciadoc (versão final otimizada)
// Esta versão implementa retry, logs detalhados e usa o formato de string de conexão validado

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

// Função para conectar ao MongoDB com retry
async function connectWithRetry(uri, options = {}, maxRetries = 3) {
  let lastError = null;
  let retries = 0;
  
  // Configurações padrão
  const defaultOptions = {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    family: 4
  };
  
  const finalOptions = { ...defaultOptions, ...options };
  
  while (retries < maxRetries) {
    try {
      console.log(`Tentativa ${retries + 1} de ${maxRetries} para conectar ao MongoDB`);
      
      if (mongoose.connection.readyState === 1) {
        console.log('Já conectado ao MongoDB');
        return mongoose.connection;
      }
      
      const conn = await mongoose.connect(uri, finalOptions);
      console.log('Conexão com MongoDB estabelecida com sucesso');
      return conn;
    } catch (error) {
      lastError = error;
      retries++;
      console.error(`Erro na tentativa ${retries}: ${error.message}`);
      
      if (retries < maxRetries) {
        // Esperar antes de tentar novamente (backoff exponencial)
        const delay = Math.pow(2, retries) * 1000;
        console.log(`Aguardando ${delay}ms antes da próxima tentativa...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw new Error(`Falha ao conectar ao MongoDB após ${maxRetries} tentativas: ${lastError.message}`);
}

// Handler para API Routes do Vercel
module.exports = async (req, res) => {
  console.log('=== INÍCIO DO PROCESSAMENTO DE REGISTRO ===');
  console.log(`Método: ${req.method}`);
  console.log(`URL: ${req.url}`);
  console.log(`Headers: ${JSON.stringify(req.headers)}`);
  
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
    console.log('Respondendo a requisição OPTIONS');
    return res.status(200).end();
  }
  
  // Para GET, retornar uma mensagem de status
  if (req.method === 'GET') {
    console.log('Respondendo a requisição GET com status');
    return res.status(200).json({ 
      status: 'Endpoint de registro final ativo',
      message: 'Use POST para registrar um novo usuário',
      timestamp: new Date().toISOString()
    });
  }
  
  // Verificar método HTTP
  if (req.method !== 'POST') {
    console.log(`Método não permitido: ${req.method}`);
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    console.log('Processando requisição POST de registro');
    
    // Verificar corpo da requisição
    if (!req.body) {
      console.log('Corpo da requisição vazio');
      return res.status(400).json({ error: 'Corpo da requisição vazio' });
    }
    
    console.log(`Corpo da requisição: ${JSON.stringify(req.body)}`);
    
    // Obter dados do corpo da requisição
    const { name, email, password, company } = req.body;
    
    // Validar entrada
    if (!name || !email || !password) {
      console.log('Dados incompletos');
      return res.status(400).json({ 
        error: 'Dados incompletos', 
        message: 'Nome, email e senha são obrigatórios',
        received: { name: !!name, email: !!email, password: !!password }
      });
    }
    
    console.log('Dados validados com sucesso');
    
    // String de conexão validada nos testes
    const MONGODB_URI = 'mongodb+srv://gerenciadoc_user:5hlgNunZCHhgovLD@cluster0.vowrllh.mongodb.net/?retryWrites=true&w=majority';
    console.log(`Usando string de conexão: ${MONGODB_URI.substring(0, 30)}...`);
    
    // Conectar ao MongoDB com retry
    console.log('Iniciando conexão com MongoDB...');
    await connectWithRetry(MONGODB_URI);
    console.log('Conexão com MongoDB estabelecida');
    
    // Obter modelo de usuário
    console.log('Obtendo modelo de usuário');
    const User = mongoose.models.User || mongoose.model('User', userSchema);
    
    // Verificar se o email já está em uso
    console.log(`Verificando se o email já está em uso: ${email}`);
    const existingUser = await User.findOne({ email });
    
    if (existingUser) {
      console.log('Email já está em uso');
      await mongoose.disconnect();
      console.log('Conexão com MongoDB fechada');
      return res.status(400).json({ error: 'Este email já está em uso' });
    }
    
    console.log('Email disponível para uso');
    
    // Gerar hash da senha
    console.log('Gerando hash da senha');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    console.log('Hash da senha gerado com sucesso');
    
    // Criar novo usuário
    console.log('Criando novo usuário');
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      company,
      role: 'user',
      trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias de trial
      isActive: true
    });
    
    // Salvar usuário no banco de dados
    console.log('Salvando usuário no banco de dados');
    try {
      await newUser.save();
      console.log('Usuário salvo com sucesso');
    } catch (saveError) {
      console.error(`Erro ao salvar usuário: ${saveError.message}`);
      await mongoose.disconnect();
      console.log('Conexão com MongoDB fechada');
      return res.status(500).json({ 
        error: 'Erro ao salvar usuário no banco de dados', 
        details: saveError.message,
        code: saveError.code
      });
    }
    
    // Desconectar do MongoDB
    console.log('Desconectando do MongoDB');
    await mongoose.disconnect();
    console.log('Conexão com MongoDB fechada');
    
    // Retornar sucesso
    console.log('Retornando resposta de sucesso');
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
    console.error(`Erro no registro: ${error.message}`);
    console.error(`Stack: ${error.stack}`);
    
    // Garantir que a conexão seja fechada em caso de erro
    if (mongoose.connection.readyState !== 0) {
      console.log('Fechando conexão com MongoDB após erro');
      await mongoose.disconnect();
      console.log('Conexão com MongoDB fechada');
    }
    
    return res.status(500).json({ 
      error: 'Erro interno no servidor', 
      message: error.message,
      stack: process.env.NODE_ENV === 'production' ? undefined : error.stack
    });
  } finally {
    console.log('=== FIM DO PROCESSAMENTO DE REGISTRO ===');
  }
};
