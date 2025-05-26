const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect, admin } = require('../middleware/authMiddleware');

// @desc    Obter todos os usuários (para backoffice)
// @route   GET /api/admin/users
// @access  Private/Admin
router.get('/users', protect, admin, async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    res.json(users);
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    res.status(500).json({ 
      message: 'Erro no servidor ao listar usuários', 
      error: error.message 
    });
  }
});

// @desc    Obter detalhes de um usuário específico
// @route   GET /api/admin/users/:id
// @access  Private/Admin
router.get('/users/:id', protect, admin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: 'Usuário não encontrado' });
    }
  } catch (error) {
    console.error('Erro ao obter usuário:', error);
    res.status(500).json({ 
      message: 'Erro no servidor ao obter usuário', 
      error: error.message 
    });
  }
});

// @desc    Atualizar status de um usuário (ativar/desativar)
// @route   PUT /api/admin/users/:id/status
// @access  Private/Admin
router.put('/users/:id/status', protect, admin, async (req, res) => {
  const { isActive } = req.body;
  
  try {
    const user = await User.findById(req.params.id);
    
    if (user) {
      user.isActive = isActive;
      
      const updatedUser = await user.save();
      
      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        isActive: updatedUser.isActive,
        message: `Usuário ${isActive ? 'ativado' : 'desativado'} com sucesso`
      });
    } else {
      res.status(404).json({ message: 'Usuário não encontrado' });
    }
  } catch (error) {
    console.error('Erro ao atualizar status do usuário:', error);
    res.status(500).json({ 
      message: 'Erro no servidor ao atualizar status do usuário', 
      error: error.message 
    });
  }
});

// @desc    Estender período de trial de um usuário
// @route   PUT /api/admin/users/:id/extend-trial
// @access  Private/Admin
router.put('/users/:id/extend-trial', protect, admin, async (req, res) => {
  const { days } = req.body;
  
  if (!days || days <= 0) {
    return res.status(400).json({ message: 'Por favor, informe um número válido de dias' });
  }
  
  try {
    const user = await User.findById(req.params.id);
    
    if (user) {
      // Calcular nova data de expiração
      const currentExpiration = user.trialExpires || new Date();
      const newExpiration = new Date(currentExpiration);
      newExpiration.setDate(newExpiration.getDate() + parseInt(days));
      
      user.trialExpires = newExpiration;
      
      const updatedUser = await user.save();
      
      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        trialExpires: updatedUser.trialExpires,
        message: `Período de trial estendido por ${days} dias com sucesso`
      });
    } else {
      res.status(404).json({ message: 'Usuário não encontrado' });
    }
  } catch (error) {
    console.error('Erro ao estender período de trial:', error);
    res.status(500).json({ 
      message: 'Erro no servidor ao estender período de trial', 
      error: error.message 
    });
  }
});

// @desc    Obter estatísticas de usuários para dashboard do backoffice
// @route   GET /api/admin/stats
// @access  Private/Admin
router.get('/stats', protect, admin, async (req, res) => {
  try {
    // Total de usuários
    const totalUsers = await User.countDocuments();
    
    // Usuários ativos
    const activeUsers = await User.countDocuments({ isActive: true });
    
    // Usuários em trial
    const now = new Date();
    const usersInTrial = await User.countDocuments({
      trialExpires: { $gt: now },
      isActive: true
    });
    
    // Novos usuários nos últimos 7 dias
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    const newUsers = await User.countDocuments({
      createdAt: { $gt: lastWeek }
    });
    
    res.json({
      totalUsers,
      activeUsers,
      usersInTrial,
      newUsers
    });
  } catch (error) {
    console.error('Erro ao obter estatísticas:', error);
    res.status(500).json({ 
      message: 'Erro no servidor ao obter estatísticas', 
      error: error.message 
    });
  }
});

module.exports = router;
