const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const Document = require('../models/Document');
const Category = require('../models/Category');
const DocumentType = require('../models/DocumentType');
const { authMiddleware } = require('../middleware/authMiddleware');
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

// Rota para upload de documento
router.post('/upload', authMiddleware, upload.single('file'), async (req, res) => {
    try {
        const { 
            name, 
            description, 
            categoryId, 
            type,
            issueDate,
            expirationDate,
            tags,
            metadata,
            bidId,
            projectId,
            requiresApproval
        } = req.body;

        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Nenhum arquivo enviado' });
        }

        // Extrair dados do documento automaticamente
        let extractedData = {};
        try {
            extractedData = await extractDocumentData(req.file.path);
        } catch (error) {
            console.error('Erro na extração de dados:', error);
            // Continua mesmo se a extração falhar
        }

        // Mesclar dados extraídos com dados fornecidos manualmente
        const mergedMetadata = {
            ...extractedData.metadata,
            ...(metadata ? JSON.parse(metadata) : {})
        };

        // Criar novo documento
        const document = new Document({
            name: name || extractedData.name || req.file.originalname,
            description: description || extractedData.description || '',
            categoryId: categoryId || extractedData.categoryId,
            type: type || extractedData.type,
            issueDate: issueDate || extractedData.issueDate,
            expirationDate: expirationDate || extractedData.expirationDate,
            fileUrl: `/uploads/${req.file.filename}`,
            fileSize: req.file.size,
            fileFormat: path.extname(req.file.originalname).substring(1),
            metadata: mergedMetadata,
            tags: tags ? JSON.parse(tags) : extractedData.tags || [],
            userId: req.user.id,
            collaboratorId: req.body.collaboratorId || null,
            requiresApproval: requiresApproval === 'true',
            approved: !requiresApproval || requiresApproval !== 'true',
            bidId: bidId || null,
            projectId: projectId || null
        });

        await document.save();

        res.status(201).json({
            success: true,
            document,
            extractedData: extractedData
        });
    } catch (error) {
        console.error('Erro no upload de documento:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Rota para upload de múltiplos documentos
router.post('/upload/batch', authMiddleware, upload.array('files', 10), async (req, res) => {
    try {
        const { categoryId, type, requiresApproval, bidId, projectId } = req.body;
        
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ success: false, message: 'Nenhum arquivo enviado' });
        }

        const uploadedDocuments = [];
        const failedUploads = [];

        // Processar cada arquivo
        for (const file of req.files) {
            try {
                // Extrair dados do documento automaticamente
                let extractedData = {};
                try {
                    extractedData = await extractDocumentData(file.path);
                } catch (extractError) {
                    console.error('Erro na extração de dados:', extractError);
                }

                // Criar novo documento
                const document = new Document({
                    name: extractedData.name || file.originalname,
                    description: extractedData.description || '',
                    categoryId: categoryId || extractedData.categoryId,
                    type: type || extractedData.type,
                    issueDate: extractedData.issueDate,
                    expirationDate: extractedData.expirationDate,
                    fileUrl: `/uploads/${file.filename}`,
                    fileSize: file.size,
                    fileFormat: path.extname(file.originalname).substring(1),
                    metadata: extractedData.metadata || {},
                    tags: extractedData.tags || [],
                    userId: req.user.id,
                    requiresApproval: requiresApproval === 'true',
                    approved: !requiresApproval || requiresApproval !== 'true',
                    bidId: bidId || null,
                    projectId: projectId || null
                });

                await document.save();
                uploadedDocuments.push(document);
            } catch (docError) {
                console.error('Erro ao processar documento:', docError);
                failedUploads.push({
                    filename: file.originalname,
                    error: docError.message
                });
            }
        }

        res.status(201).json({
            success: true,
            uploadedCount: uploadedDocuments.length,
            failedCount: failedUploads.length,
            documents: uploadedDocuments,
            failedUploads
        });
    } catch (error) {
        console.error('Erro no upload em lote:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Rota para listar documentos
router.get('/', authMiddleware, async (req, res) => {
    try {
        const { 
            category, 
            status, 
            search, 
            sortBy, 
            sortOrder,
            page = 1,
            limit = 20
        } = req.query;

        // Construir filtro
        const filter = { userId: req.user.id };
        
        if (category) filter.categoryId = category;
        if (status) filter.status = status;
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { tags: { $in: [new RegExp(search, 'i')] } }
            ];
        }

        // Opções de ordenação
        const sort = {};
        if (sortBy) {
            sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
        } else {
            sort.createdAt = -1; // Padrão: mais recentes primeiro
        }

        // Paginação
        const skip = (page - 1) * limit;
        
        // Buscar documentos
        const documents = await Document.find(filter)
            .sort(sort)
            .skip(skip)
            .limit(parseInt(limit))
            .populate('categoryId', 'name')
            .populate('type', 'name');
            
        // Contar total para paginação
        const total = await Document.countDocuments(filter);
        
        res.status(200).json({
            success: true,
            count: documents.length,
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: parseInt(page),
            documents
        });
    } catch (error) {
        console.error('Erro ao listar documentos:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Rota para obter um documento específico
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const document = await Document.findOne({
            _id: req.params.id,
            userId: req.user.id
        })
        .populate('categoryId', 'name')
        .populate('type', 'name')
        .populate('collaboratorId', 'name email');
        
        if (!document) {
            return res.status(404).json({ success: false, message: 'Documento não encontrado' });
        }
        
        res.status(200).json({
            success: true,
            document
        });
    } catch (error) {
        console.error('Erro ao buscar documento:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Rota para atualizar um documento
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const {
            name,
            description,
            categoryId,
            type,
            issueDate,
            expirationDate,
            tags,
            metadata,
            bidId,
            projectId
        } = req.body;

        // Verificar se o documento existe e pertence ao usuário
        const document = await Document.findOne({
            _id: req.params.id,
            userId: req.user.id
        });
        
        if (!document) {
            return res.status(404).json({ success: false, message: 'Documento não encontrado' });
        }
        
        // Atualizar campos
        if (name) document.name = name;
        if (description) document.description = description;
        if (categoryId) document.categoryId = categoryId;
        if (type) document.type = type;
        if (issueDate) document.issueDate = issueDate;
        if (expirationDate) document.expirationDate = expirationDate;
        if (tags) document.tags = JSON.parse(tags);
        if (metadata) document.metadata = { ...document.metadata, ...JSON.parse(metadata) };
        if (bidId) document.bidId = bidId;
        if (projectId) document.projectId = projectId;
        
        await document.save();
        
        res.status(200).json({
            success: true,
            document
        });
    } catch (error) {
        console.error('Erro ao atualizar documento:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Rota para excluir um documento
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        // Verificar se o documento existe e pertence ao usuário
        const document = await Document.findOne({
            _id: req.params.id,
            userId: req.user.id
        });
        
        if (!document) {
            return res.status(404).json({ success: false, message: 'Documento não encontrado' });
        }
        
        // Remover arquivo físico
        const filePath = path.join(__dirname, '..', document.fileUrl);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
        
        // Remover documento do banco de dados
        await Document.deleteOne({ _id: req.params.id });
        
        res.status(200).json({
            success: true,
            message: 'Documento excluído com sucesso'
        });
    } catch (error) {
        console.error('Erro ao excluir documento:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Rota para aprovar um documento (enviado por colaborador)
router.patch('/:id/approve', authMiddleware, async (req, res) => {
    try {
        // Verificar se o documento existe e pertence ao usuário
        const document = await Document.findOne({
            _id: req.params.id,
            userId: req.user.id,
            requiresApproval: true
        });
        
        if (!document) {
            return res.status(404).json({ success: false, message: 'Documento não encontrado ou não requer aprovação' });
        }
        
        document.approved = true;
        await document.save();
        
        res.status(200).json({
            success: true,
            message: 'Documento aprovado com sucesso',
            document
        });
    } catch (error) {
        console.error('Erro ao aprovar documento:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Rota para rejeitar um documento (enviado por colaborador)
router.patch('/:id/reject', authMiddleware, async (req, res) => {
    try {
        // Verificar se o documento existe e pertence ao usuário
        const document = await Document.findOne({
            _id: req.params.id,
            userId: req.user.id,
            requiresApproval: true
        });
        
        if (!document) {
            return res.status(404).json({ success: false, message: 'Documento não encontrado ou não requer aprovação' });
        }
        
        // Remover arquivo físico
        const filePath = path.join(__dirname, '..', document.fileUrl);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
        
        // Remover documento do banco de dados
        await Document.deleteOne({ _id: req.params.id });
        
        res.status(200).json({
            success: true,
            message: 'Documento rejeitado e excluído com sucesso'
        });
    } catch (error) {
        console.error('Erro ao rejeitar documento:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Rota para adicionar anotação a um documento
router.post('/:id/annotations', authMiddleware, async (req, res) => {
    try {
        const { text, position } = req.body;
        
        // Verificar se o documento existe e pertence ao usuário
        const document = await Document.findOne({
            _id: req.params.id,
            userId: req.user.id
        });
        
        if (!document) {
            return res.status(404).json({ success: false, message: 'Documento não encontrado' });
        }
        
        // Adicionar anotação
        document.annotations.push({
            text,
            author: req.user.id,
            date: Date.now(),
            position: JSON.parse(position)
        });
        
        await document.save();
        
        res.status(201).json({
            success: true,
            message: 'Anotação adicionada com sucesso',
            annotation: document.annotations[document.annotations.length - 1]
        });
    } catch (error) {
        console.error('Erro ao adicionar anotação:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Rota para remover anotação de um documento
router.delete('/:id/annotations/:annotationId', authMiddleware, async (req, res) => {
    try {
        // Verificar se o documento existe e pertence ao usuário
        const document = await Document.findOne({
            _id: req.params.id,
            userId: req.user.id
        });
        
        if (!document) {
            return res.status(404).json({ success: false, message: 'Documento não encontrado' });
        }
        
        // Remover anotação
        document.annotations = document.annotations.filter(
            annotation => annotation._id.toString() !== req.params.annotationId
        );
        
        await document.save();
        
        res.status(200).json({
            success: true,
            message: 'Anotação removida com sucesso'
        });
    } catch (error) {
        console.error('Erro ao remover anotação:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
