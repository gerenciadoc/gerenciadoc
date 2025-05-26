const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'O nome da categoria é obrigatório.'],
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    parent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        default: null
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
categorySchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Índices para otimização de consultas
categorySchema.index({ parent: 1 });
categorySchema.index({ name: 1 });

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;
