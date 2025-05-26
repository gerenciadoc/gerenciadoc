// Script para criar usuário de teste no MongoDB
const mongoose = require('mongoose');
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

// Função principal
async function createTestUser() {
  try {
    // Conectar ao MongoDB
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://gerenciadoc:M4hyCLplkQ3Uqg0D@cluster0.mongodb.net/gerenciadoc?retryWrites=true&w=majority';
    
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('Conectado ao MongoDB');
    
    // Registrar modelo de usuário
    const User = mongoose.models.User || mongoose.model('User', userSchema);
    
    // Verificar se o usuário de teste já existe
    const existingUser = await User.findOne({ email: 'teste@gerenciadoc.com' });
    
    if (existingUser) {
      console.log('Usuário de teste já existe, atualizando senha...');
      
      // Gerar hash da senha
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('senha123', salt);
      
      // Atualizar usuário
      await User.updateOne(
        { email: 'teste@gerenciadoc.com' },
        { 
          password: hashedPassword,
          isActive: true,
          trialEndsAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000) // 5 dias
        }
      );
      
      console.log('Senha do usuário de teste atualizada com sucesso');
    } else {
      console.log('Criando novo usuário de teste...');
      
      // Gerar hash da senha
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('senha123', salt);
      
      // Criar usuário de teste
      const testUser = new User({
        name: 'Usuário de Teste',
        email: 'teste@gerenciadoc.com',
        password: hashedPassword,
        role: 'admin',
        company: 'Gerenciadoc',
        trialEndsAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 dias
        isActive: true
      });
      
      await testUser.save();
      console.log('Usuário de teste criado com sucesso');
    }
    
    // Exibir todos os usuários
    const users = await User.find({});
    console.log('Usuários no banco:', users.map(u => ({ email: u.email, role: u.role, isActive: u.isActive })));
    
  } catch (error) {
    console.error('Erro ao criar usuário de teste:', error);
  } finally {
    // Fechar conexão
    await mongoose.disconnect();
    console.log('Desconectado do MongoDB');
  }
}

// Executar função
createTestUser();

// Para uso como API serverless
module.exports = async (req, res) => {
  try {
    await createTestUser();
    return res.status(200).json({ message: 'Usuário de teste criado/atualizado com sucesso' });
  } catch (error) {
    console.error('Erro:', error);
    return res.status(500).json({ error: 'Erro ao criar usuário de teste' });
  }
};
