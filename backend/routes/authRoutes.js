const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { protect, admin } = require('../middleware/authMiddleware');

// Função para gerar token JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d', // Token expira em 30 dias
  });
};

// @desc    Registrar um novo usuário
// @route   POST /api/auth/register
// @access  Public
router.post('/register', async (req, res) => {
  const { name, email, password, companyName, cnpj, phone } = req.body;

  try {
    // Validação básica
    if (!name || !email || !password || !companyName || !cnpj) {
      return res.status(400).json({ 
        message: 'Por favor, preencha todos os campos obrigatórios' 
      });
    }

    // Verificar se o usuário já existe
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ 
        message: 'Usuário já cadastrado com este email' 
      });
    }

    // Verificar se o CNPJ já existe
    const cnpjExists = await User.findOne({ cnpj });
    if (cnpjExists) {
      return res.status(400).json({ 
        message: 'CNPJ já cadastrado' 
      });
    }

    // Calcular data de expiração do trial (5 dias a partir de agora)
    const trialExpirationDate = new Date();
    trialExpirationDate.setDate(trialExpirationDate.getDate() + 5);

    // Criar novo usuário
    const user = await User.create({
      name,
      email,
      password, // Senha será criptografada pelo middleware pre-save no model
      companyName,
      cnpj,
      phone,
      trialExpires: trialExpirationDate,
      isActive: true, // Ativa a conta imediatamente para o trial
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        companyName: user.companyName,
        trialExpires: user.trialExpires,
        isActive: user.isActive,
        token: generateToken(user._id), // Envia token para login automático
      });
    } else {
      res.status(400).json({ message: 'Dados de usuário inválidos' });
    }
  } catch (error) {
    console.error('Erro no registro:', error);
    res.status(500).json({ 
      message: 'Erro no servidor ao registrar usuário', 
      error: error.message 
    });
  }
});

// @desc    Autenticar usuário e gerar token
// @route   POST /api/auth/login
// @access  Public
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Validação básica
    if (!email || !password) {
      return res.status(400).json({ 
        message: 'Por favor, informe email e senha' 
      });
    }

    // Encontrar usuário pelo email
    const user = await User.findOne({ email });

    // Verificar se usuário existe e se a senha está correta
    if (user && (await user.comparePassword(password))) {
      // Verificar se a conta está ativa
      if (!user.isActive) {
        return res.status(401).json({ 
          message: 'Conta inativa. Entre em contato com o suporte.' 
        });
      }
      
      // Verificar se o período de trial expirou (para usuários em trial)
      const now = new Date();
      if (user.trialExpires && now > user.trialExpires && !user.isPaid) {
        return res.status(402).json({ 
          message: 'Seu período de teste expirou. Por favor, adquira um plano para continuar.' 
        });
      }

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        companyName: user.companyName,
        role: user.role,
        trialExpires: user.trialExpires,
        isActive: user.isActive,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Email ou senha inválidos' });
    }
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ 
      message: 'Erro no servidor ao fazer login', 
      error: error.message 
    });
  }
});

// @desc    Obter perfil do usuário
// @route   GET /api/auth/profile
// @access  Private
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    
    if (user) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        companyName: user.companyName,
        cnpj: user.cnpj,
        phone: user.phone,
        role: user.role,
        trialExpires: user.trialExpires,
        isActive: user.isActive,
        createdAt: user.createdAt
      });
    } else {
      res.status(404).json({ message: 'Usuário não encontrado' });
    }
  } catch (error) {
    console.error('Erro ao obter perfil:', error);
    res.status(500).json({ 
      message: 'Erro no servidor ao obter perfil', 
      error: error.message 
    });
  }
});

module.exports = router;
