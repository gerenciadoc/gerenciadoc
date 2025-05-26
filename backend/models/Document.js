const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'O nome do documento é obrigatório.']
    },
    description: {
        type: String
    },
    type: {
        type: String,
        ref: 'DocumentType'
    },
    categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: [true, 'A categoria do documento é obrigatória.']
    },
    issueDate: {
        type: Date
    },
    expirationDate: {
        type: Date
    },
    status: {
        type: String,
        enum: ['valid', 'expiring', 'expired', 'pending'],
        default: 'valid'
    },
    fileUrl: {
        type: String,
        required: [true, 'A URL do arquivo é obrigatória.']
    },
    fileSize: {
        type: Number
    },
    fileFormat: {
        type: String
    },
    metadata: {
        issuer: String,
        documentNumber: String,
        proposalValue: Number,
        bidValue: Number,
        percentageDifference: Number,
        // Outros metadados específicos
    },
    tags: [String],
    annotations: [{
        text: String,
        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        date: {
            type: Date,
            default: Date.now
        },
        position: {
            page: Number,
            x: Number,
            y: Number
        }
    }],
    versions: [{
        fileUrl: String,
        uploadDate: {
            type: Date,
            default: Date.now
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        description: String
    }],
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'O usuário proprietário é obrigatório.']
    },
    collaboratorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    approved: {
        type: Boolean,
        default: true
    },
    requiresApproval: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    bidId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Bid'
    },
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project'
    }
});

// Middleware para atualizar o status com base na data de validade
documentSchema.pre('save', function(next) {
    if (this.expirationDate) {
        const today = new Date();
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(today.getDate() + 30);
        
        if (this.expirationDate < today) {
            this.status = 'expired';
        } else if (this.expirationDate < thirtyDaysFromNow) {
            this.status = 'expiring';
        } else {
            this.status = 'valid';
        }
    }
    
    if (this.requiresApproval && !this.approved) {
        this.status = 'pending';
    }
    
    this.updatedAt = Date.now();
    next();
});

// Índices para otimização de consultas
documentSchema.index({ userId: 1, status: 1 });
documentSchema.index({ categoryId: 1 });
documentSchema.index({ expirationDate: 1 });
documentSchema.index({ tags: 1 });

const Document = mongoose.model('Document', documentSchema);

module.exports = Document;
