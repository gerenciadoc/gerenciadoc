const mongoose = require('mongoose');

const documentTypeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'O nome do tipo de documento é obrigatório.'],
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    defaultValidity: {
        type: Number,
        default: null // Validade padrão em dias (se aplicável)
    },
    requiredMetadata: [String], // Lista de metadados obrigatórios para este tipo
    defaultCategoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category'
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

// Middleware para atualizar a data de modificação
documentTypeSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Índices para otimização de consultas
documentTypeSchema.index({ name: 1 });
documentTypeSchema.index({ defaultCategoryId: 1 });

const DocumentType = mongoose.model('DocumentType', documentTypeSchema);

module.exports = DocumentType;
