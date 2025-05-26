// API serverless para documentos no Vercel
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

// Modelo de documento
const documentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  category: { type: String, required: true },
  subcategory: { type: String },
  documentType: { type: String },
  issueDate: { type: Date },
  expiryDate: { type: Date },
  documentNumber: { type: String },
  issuingEntity: { type: String },
  status: { 
    type: String, 
    enum: ['valid', 'expiring_soon', 'expired', 'pending'], 
    default: 'valid' 
  },
  fileUrl: { type: String, required: true },
  fileType: { type: String, required: true },
  fileSize: { type: Number },
  tags: [{ type: String }],
  metadata: { type: Object, default: {} },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  collaborators: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

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

// Verificar se os modelos já existem para evitar erros
let Document, User;
try {
  Document = mongoose.model('Document');
} catch (error) {
  Document = mongoose.model('Document', documentSchema);
}

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

  try {
    // Verificar autenticação
    const decoded = verifyToken(req);
    if (!decoded) {
      return res.status(401).json({ message: 'Não autorizado' });
    }

    // Conectar ao banco de dados
    await connectToDatabase();

    // Buscar usuário pelo ID
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    // Verificar se o usuário está ativo
    if (!user.isActive) {
      return res.status(401).json({ message: 'Conta desativada. Entre em contato com o suporte.' });
    }

    // Listar documentos (GET)
    if (req.method === 'GET') {
      const { category, status, search } = req.query;
      
      // Construir filtro
      const filter = { owner: user._id };
      
      if (category) filter.category = category;
      if (status) filter.status = status;
      if (search) {
        filter.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { documentNumber: { $regex: search, $options: 'i' } }
        ];
      }
      
      // Buscar documentos
      const documents = await Document.find(filter).sort({ createdAt: -1 });
      
      return res.status(200).json(documents);
    }
    
    // Criar documento (POST)
    if (req.method === 'POST') {
      const documentData = req.body;
      
      // Validar dados
      if (!documentData.title || !documentData.category || !documentData.fileUrl || !documentData.fileType) {
        return res.status(400).json({ message: 'Dados incompletos' });
      }
      
      // Criar documento
      const document = new Document({
        ...documentData,
        owner: user._id,
        status: documentData.expiryDate ? 
          (new Date(documentData.expiryDate) < new Date() ? 'expired' : 
           new Date(documentData.expiryDate) < new Date(+new Date() + 30*24*60*60*1000) ? 'expiring_soon' : 'valid') 
          : 'valid'
      });
      
      await document.save();
      
      return res.status(201).json(document);
    }
    
    // Atualizar ou excluir documento específico
    if (req.url.includes('/documents/')) {
      const documentId = req.url.split('/documents/')[1].split('/')[0];
      
      // Buscar documento
      const document = await Document.findById(documentId);
      
      if (!document) {
        return res.status(404).json({ message: 'Documento não encontrado' });
      }
      
      // Verificar se o usuário é o proprietário
      if (document.owner.toString() !== user._id.toString() && user.role !== 'admin') {
        return res.status(403).json({ message: 'Acesso negado' });
      }
      
      // Atualizar documento (PUT)
      if (req.method === 'PUT') {
        const updateData = req.body;
        
        // Atualizar status baseado na data de expiração
        if (updateData.expiryDate) {
          updateData.status = new Date(updateData.expiryDate) < new Date() ? 'expired' : 
                             new Date(updateData.expiryDate) < new Date(+new Date() + 30*24*60*60*1000) ? 'expiring_soon' : 'valid';
        }
        
        // Atualizar documento
        const updatedDocument = await Document.findByIdAndUpdate(
          documentId,
          { ...updateData, updatedAt: new Date() },
          { new: true }
        );
        
        return res.status(200).json(updatedDocument);
      }
      
      // Excluir documento (DELETE)
      if (req.method === 'DELETE') {
        await Document.findByIdAndDelete(documentId);
        return res.status(200).json({ message: 'Documento excluído com sucesso' });
      }
    }
    
    // Método não suportado
    return res.status(405).json({ message: 'Método não permitido' });
  } catch (error) {
    console.error('Erro na API de documentos:', error);
    res.status(500).json({ message: 'Erro no servidor', error: error.message });
  }
};
