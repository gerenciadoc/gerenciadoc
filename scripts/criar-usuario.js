/**
 * Script para criar usuários diretamente no MongoDB
 * 
 * Este script permite criar usuários diretamente no banco de dados MongoDB,
 * contornando completamente os problemas de integração com o Vercel.
 * 
 * Instruções de uso:
 * 1. Salve este arquivo localmente
 * 2. Execute: npm install mongoose bcryptjs
 * 3. Execute: node criar-usuario.js
 * 4. Siga as instruções no console
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const readline = require('readline');

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

// Interface para leitura de input do usuário
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Função para perguntar ao usuário
function pergunta(texto) {
  return new Promise((resolve) => {
    rl.question(texto, (resposta) => {
      resolve(resposta);
    });
  });
}

// Função principal
async function criarUsuario() {
  console.log('=== CRIAÇÃO DE USUÁRIO NO MONGODB ===');
  
  try {
    // Credenciais do MongoDB
    const MONGODB_URI = 'mongodb+srv://gerenciadoc:M4hyCLplkQ3Uqg0D@cluster0.vowrllh.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
    console.log('Conectando ao MongoDB...');
    
    // Conectar ao MongoDB
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000
    });
    
    console.log('Conexão com MongoDB estabelecida com sucesso!');
    
    // Registrar modelo de usuário
    const User = mongoose.models.User || mongoose.model('User', userSchema);
    
    // Obter dados do usuário
    console.log('\nPor favor, forneça os dados do novo usuário:');
    const nome = await pergunta('Nome: ');
    const email = await pergunta('Email: ');
    const senha = await pergunta('Senha: ');
    const empresa = await pergunta('Empresa (opcional): ');
    const papel = await pergunta('Papel (user/admin) [padrão: user]: ') || 'user';
    
    // Verificar se o email já está em uso
    const usuarioExistente = await User.findOne({ email });
    
    if (usuarioExistente) {
      console.log('\nATENÇÃO: Este email já está em uso!');
      const atualizar = await pergunta('Deseja atualizar este usuário? (s/n): ');
      
      if (atualizar.toLowerCase() === 's') {
        // Gerar hash da senha
        const salt = await bcrypt.genSalt(10);
        const senhaHash = await bcrypt.hash(senha, salt);
        
        // Atualizar usuário
        await User.updateOne(
          { email },
          { 
            name: nome,
            password: senhaHash,
            company: empresa,
            role: papel,
            trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias
            isActive: true
          }
        );
        
        console.log('\nUsuário atualizado com sucesso!');
      } else {
        console.log('\nOperação cancelada.');
      }
    } else {
      // Gerar hash da senha
      const salt = await bcrypt.genSalt(10);
      const senhaHash = await bcrypt.hash(senha, salt);
      
      // Criar novo usuário
      const novoUsuario = new User({
        name: nome,
        email: email,
        password: senhaHash,
        company: empresa,
        role: papel,
        trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias
        isActive: true
      });
      
      // Salvar usuário no banco de dados
      await novoUsuario.save();
      
      console.log('\nUsuário criado com sucesso!');
    }
    
    // Listar todos os usuários
    console.log('\nUsuários cadastrados no sistema:');
    const usuarios = await User.find({});
    usuarios.forEach((usuario, index) => {
      console.log(`${index + 1}. ${usuario.email} (${usuario.role}) - ${usuario.name}`);
    });
    
    console.log('\n=== INFORMAÇÕES DE LOGIN ===');
    console.log(`Email: ${email}`);
    console.log(`Senha: ${senha}`);
    console.log('Use estas credenciais para fazer login no sistema.');
    console.log('URL de login alternativo: https://gerenciadoc-git-main-eliseus-projects-b673746e.vercel.app/login-direct.html');
    
  } catch (error) {
    console.error('ERRO:', error);
  } finally {
    // Fechar conexão e interface de leitura
    await mongoose.disconnect();
    rl.close();
    console.log('\nConexão com MongoDB fechada.');
    console.log('=== OPERAÇÃO CONCLUÍDA ===');
  }
}

// Executar função principal
criarUsuario();
