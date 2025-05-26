require('dotenv').config();
const mongoose = require('mongoose');

console.log('Tentando conectar ao MongoDB Atlas...');

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB conectado com sucesso!');
    console.log('A conexão com o banco de dados está funcionando corretamente.');
    
    // Desconectar após o teste bem-sucedido
    setTimeout(() => {
      mongoose.disconnect();
      console.log('Conexão encerrada.');
    }, 2000);
  })
  .catch(err => {
    console.error('Erro na conexão com MongoDB:', err.message);
    process.exit(1);
  });
