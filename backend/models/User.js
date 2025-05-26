const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'O nome completo é obrigatório.']
    },
    email: {
        type: String,
        required: [true, 'O email é obrigatório.'],
        unique: true,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, 'Por favor, use um email válido.']
    },
    password: {
        type: String,
        required: [true, 'A senha é obrigatória.'],
        minlength: [8, 'A senha deve ter pelo menos 8 caracteres.']
    },
    companyName: {
        type: String,
        required: [true, 'O nome da empresa é obrigatório.']
    },
    cnpj: {
        type: String,
        required: [true, 'O CNPJ é obrigatório.'],
        unique: true
        // Adicionar validação de formato CNPJ posteriormente
    },
    phone: {
        type: String
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    trialExpires: {
        type: Date
    },
    isActive: {
        type: Boolean,
        default: false // Ativado após confirmação de email ou pagamento
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Middleware para criptografar a senha antes de salvar
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

// Método para comparar senhas
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;
