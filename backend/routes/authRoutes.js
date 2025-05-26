const express = require("express");
const router = express.Router();
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

// Função para gerar token JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d", // Token expira em 30 dias
  });
};

// Rota de Registro (POST /api/auth/register)
router.post("/register", async (req, res) => {
  const { name, email, password, companyName, cnpj, phone } = req.body;

  try {
    // Verifica se o usuário já existe
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "Usuário já cadastrado com este email." });
    }

    // Verifica se o CNPJ já existe
    const cnpjExists = await User.findOne({ cnpj });
    if (cnpjExists) {
      return res.status(400).json({ message: "CNPJ já cadastrado." });
    }

    // Calcula data de expiração do trial (5 dias a partir de agora)
    const trialExpirationDate = new Date();
    trialExpirationDate.setDate(trialExpirationDate.getDate() + 5);

    // Cria novo usuário
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
        token: generateToken(user._id), // Envia token para login automático
      });
    } else {
      res.status(400).json({ message: "Dados inválidos." });
    }
  } catch (error) {
    res.status(500).json({ message: "Erro no servidor ao registrar usuário.", error: error.message });
  }
});

// Rota de Login (POST /api/auth/login)
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // Encontra usuário pelo email
    const user = await User.findOne({ email });

    // Verifica se usuário existe e se a senha está correta
    if (user && (await user.comparePassword(password))) {
      // Verifica se a conta está ativa (poderia ser usado para confirmação de email ou status de pagamento)
      if (!user.isActive) {
         return res.status(401).json({ message: "Conta inativa." });
      }
      
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        companyName: user.companyName,
        role: user.role,
        trialExpires: user.trialExpires,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: "Email ou senha inválidos." });
    }
  } catch (error) {
     res.status(500).json({ message: "Erro no servidor ao fazer login.", error: error.message });
  }
});

module.exports = router;
