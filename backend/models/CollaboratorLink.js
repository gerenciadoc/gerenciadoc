const mongoose = require('mongoose');

const collaboratorLinkSchema = new mongoose.Schema({
    token: {
        type: String,
        required: [true, 'O token é obrigatório.'],
        unique: true
    },
    email: {
        type: String,
        required: [true, 'O email do colaborador é obrigatório.'],
        match: [/^\S+@\S+\.\S+$/, 'Por favor, use um email válido.']
    },
    name: {
        type: String,
        required: [true, 'O nome do colaborador é obrigatório.']
    },
    documentTypeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DocumentType'
    },
    expirationDate: {
        type: Date,
        required: [true, 'A data de expiração do link é obrigatória.']
    },
    manualApproval: {
        type: Boolean,
        default: false
    },
    message: {
        type: String
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'O usuário que criou o link é obrigatório.']
    },
    documentsUploaded: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Document'
    }],
    status: {
        type: String,
        enum: ['active', 'expired', 'used'],
        default: 'active'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Middleware para atualizar o status com base na data de expiração
collaboratorLinkSchema.pre('save', function(next) {
    const today = new Date();
    
    if (this.expirationDate < today) {
        this.status = 'expired';
    }
    
    this.updatedAt = Date.now();
    next();
});

// Índices para otimização de consultas
collaboratorLinkSchema.index({ token: 1 });
collaboratorLinkSchema.index({ email: 1 });
collaboratorLinkSchema.index({ userId: 1 });
collaboratorLinkSchema.index({ status: 1 });
collaboratorLinkSchema.index({ expirationDate: 1 });

const CollaboratorLink = mongoose.model('CollaboratorLink', collaboratorLinkSchema);

module.exports = CollaboratorLink;
