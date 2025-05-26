const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const CollaboratorLink = require('../models/CollaboratorLink');
const Document = require('../models/Document');
const { authMiddleware } = require('../middleware/authMiddleware');

// Rota para criar um novo link para colaborador
router.post('/links', authMiddleware, async (req, res) => {
    try {
        const {
            email,
            name,
            documentTypeId,
            expirationDays,
            manualApproval,
            message
        } = req.body;

        // Calcular data de expiração
        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + (parseInt(expirationDays) || 7));

        // Gerar token único
        const token = uuidv4();

        // Criar link
        const collaboratorLink = new CollaboratorLink({
            token,
            email,
            name,
            documentTypeId,
            expirationDate,
            manualApproval: manualApproval === 'true',
            message,
            userId: req.user.id,
            status: 'active'
        });

        await collaboratorLink.save();

        res.status(201).json({
            success: true,
            link: `${req.protocol}://${req.get('host')}/colaborador/${token}`,
            collaboratorLink
        });
    } catch (error) {
        console.error('Erro ao criar link para colaborador:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Rota para listar links de colaboradores
router.get('/links', authMiddleware, async (req, res) => {
    try {
        const { status } = req.query;
        
        // Construir filtro
        const filter = { userId: req.user.id };
        if (status) filter.status = status;
        
        // Buscar links
        const links = await CollaboratorLink.find(filter)
            .sort({ createdAt: -1 })
            .populate('documentTypeId', 'name');
            
        res.status(200).json({
            success: true,
            count: links.length,
            links
        });
    } catch (error) {
        console.error('Erro ao listar links de colaboradores:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Rota para obter detalhes de um link específico
router.get('/links/:id', authMiddleware, async (req, res) => {
    try {
        const link = await CollaboratorLink.findOne({
            _id: req.params.id,
            userId: req.user.id
        })
        .populate('documentTypeId', 'name')
        .populate('documentsUploaded', 'name fileUrl status');
        
        if (!link) {
            return res.status(404).json({ success: false, message: 'Link não encontrado' });
        }
        
        res.status(200).json({
            success: true,
            link
        });
    } catch (error) {
        console.error('Erro ao buscar link de colaborador:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Rota para desativar um link
router.patch('/links/:id/deactivate', authMiddleware, async (req, res) => {
    try {
        const link = await CollaboratorLink.findOne({
            _id: req.params.id,
            userId: req.user.id
        });
        
        if (!link) {
            return res.status(404).json({ success: false, message: 'Link não encontrado' });
        }
        
        link.status = 'expired';
        await link.save();
        
        res.status(200).json({
            success: true,
            message: 'Link desativado com sucesso',
            link
        });
    } catch (error) {
        console.error('Erro ao desativar link de colaborador:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Rota para verificar validade de um token (acesso público)
router.get('/verify/:token', async (req, res) => {
    try {
        const link = await CollaboratorLink.findOne({
            token: req.params.token
        }).populate('documentTypeId', 'name');
        
        if (!link) {
            return res.status(404).json({ success: false, message: 'Link inválido ou expirado' });
        }
        
        // Verificar se o link está ativo
        const today = new Date();
        if (link.status !== 'active' || link.expirationDate < today) {
            link.status = 'expired';
            await link.save();
            return res.status(400).json({ success: false, message: 'Link expirado' });
        }
        
        res.status(200).json({
            success: true,
            link: {
                name: link.name,
                email: link.email,
                message: link.message,
                documentType: link.documentTypeId ? link.documentTypeId.name : 'Qualquer documento',
                expirationDate: link.expirationDate
            }
        });
    } catch (error) {
        console.error('Erro ao verificar token:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Rota para upload de documento por colaborador (acesso público)
router.post('/upload/:token', async (req, res) => {
    try {
        // Esta rota será implementada em conjunto com a integração do algoritmo de extração
        // Ela utilizará o mesmo middleware de upload da documentRoutes.js
        // E registrará o documento com o ID do colaborador
        
        res.status(501).json({
            success: false,
            message: 'Funcionalidade em implementação'
        });
    } catch (error) {
        console.error('Erro no upload de documento por colaborador:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
