const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const Document = require('../models/Document');
const CollaboratorLink = require('../models/CollaboratorLink');
const { extractDocumentData } = require('../utils/documentExtractor');

// Configuração do armazenamento para upload de arquivos
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueFilename = `${uuidv4()}-${file.originalname}`;
        cb(null, uniqueFilename);
    }
});

// Filtro para tipos de arquivos permitidos
const fileFilter = (req, file, cb) => {
    const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'image/jpeg',
        'image/png'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Formato de arquivo não suportado. Formatos aceitos: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG'), false);
    }
};

const upload = multer({ 
    storage,
    fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 } // Limite de 10MB
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
                expirationDate: link.expirationDate,
                manualApproval: link.manualApproval
            }
        });
    } catch (error) {
        console.error('Erro ao verificar token:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Rota para upload de documento por colaborador (acesso público)
router.post('/upload/:token', upload.single('file'), async (req, res) => {
    try {
        // Verificar se o token é válido
        const link = await CollaboratorLink.findOne({
            token: req.params.token,
            status: 'active'
        }).populate('userId', '_id');
        
        if (!link) {
            return res.status(404).json({ success: false, message: 'Link inválido ou expirado' });
        }
        
        // Verificar se o link não expirou
        const today = new Date();
        if (link.expirationDate < today) {
            link.status = 'expired';
            await link.save();
            return res.status(400).json({ success: false, message: 'Link expirado' });
        }
        
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Nenhum arquivo enviado' });
        }
        
        // Extrair dados do documento automaticamente
        let extractedData = {};
        try {
            extractedData = await extractDocumentData(req.file.path);
            console.log('Dados extraídos com sucesso:', extractedData);
        } catch (error) {
            console.error('Erro na extração de dados:', error);
            // Continua mesmo se a extração falhar
        }
        
        // Mesclar dados extraídos com dados fornecidos manualmente
        const metadata = {
            ...extractedData.metadata,
            ...(req.body.metadata ? JSON.parse(req.body.metadata) : {})
        };
        
        // Criar novo documento
        const document = new Document({
            name: req.body.name || extractedData.name || req.file.originalname,
            description: req.body.description || extractedData.description || '',
            categoryId: req.body.categoryId || extractedData.categoryId,
            type: req.body.type || extractedData.type || link.documentTypeId,
            issueDate: req.body.issueDate || extractedData.issueDate,
            expirationDate: req.body.expirationDate || extractedData.expirationDate,
            fileUrl: `/uploads/${req.file.filename}`,
            fileSize: req.file.size,
            fileFormat: path.extname(req.file.originalname).substring(1),
            metadata: metadata,
            tags: req.body.tags ? JSON.parse(req.body.tags) : extractedData.tags || [],
            userId: link.userId._id,
            collaboratorId: null, // Será implementado quando tivermos usuários colaboradores
            requiresApproval: link.manualApproval,
            approved: !link.manualApproval
        });
        
        await document.save();
        
        // Atualizar o link com o documento enviado
        link.documentsUploaded.push(document._id);
        if (link.documentsUploaded.length === 1) {
            link.status = 'used';
        }
        await link.save();
        
        res.status(201).json({
            success: true,
            message: link.manualApproval ? 
                'Documento enviado com sucesso e aguardando aprovação' : 
                'Documento enviado e aprovado automaticamente',
            document: {
                name: document.name,
                status: document.status,
                requiresApproval: document.requiresApproval,
                approved: document.approved
            },
            extractionResults: {
                success: Object.keys(extractedData).length > 0,
                fieldsExtracted: Object.keys(extractedData).length,
                confidence: Object.keys(extractedData).length > 3 ? 'alta' : 'média'
            }
        });
    } catch (error) {
        console.error('Erro no upload de documento por colaborador:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Rota para formulário de colaborador (renderização da página)
router.get('/form/:token', async (req, res) => {
    try {
        // Esta rota será implementada no frontend
        res.status(200).send(`
            <html>
                <head>
                    <title>Upload de Documento - Gerenciadoc</title>
                </head>
                <body>
                    <h1>Formulário de Upload de Documento</h1>
                    <p>Token: ${req.params.token}</p>
                    <p>Esta página será implementada no frontend.</p>
                </body>
            </html>
        `);
    } catch (error) {
        console.error('Erro ao renderizar formulário:', error);
        res.status(500).send('Erro ao carregar formulário');
    }
});

module.exports = router;
