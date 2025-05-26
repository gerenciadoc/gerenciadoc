// Configuração da API
const API_URL = 'http://localhost:5000/api';

// Função para fazer login
async function login(email, password) {
    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Erro ao fazer login');
        }

        // Salvar token e dados do usuário no localStorage
        localStorage.setItem('userToken', data.token);
        localStorage.setItem('userData', JSON.stringify({
            id: data._id,
            name: data.name,
            email: data.email,
            companyName: data.companyName,
            role: data.role,
            trialExpires: data.trialExpires,
            isActive: data.isActive
        }));

        return data;
    } catch (error) {
        console.error('Erro no login:', error);
        throw error;
    }
}

// Função para registrar novo usuário
async function register(userData) {
    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Erro ao registrar usuário');
        }

        // Salvar token e dados do usuário no localStorage
        localStorage.setItem('userToken', data.token);
        localStorage.setItem('userData', JSON.stringify({
            id: data._id,
            name: data.name,
            email: data.email,
            companyName: data.companyName,
            trialExpires: data.trialExpires,
            isActive: data.isActive
        }));

        return data;
    } catch (error) {
        console.error('Erro no registro:', error);
        throw error;
    }
}

// Função para obter perfil do usuário
async function getUserProfile() {
    try {
        const token = localStorage.getItem('userToken');
        
        if (!token) {
            throw new Error('Usuário não autenticado');
        }

        const response = await fetch(`${API_URL}/auth/profile`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Erro ao obter perfil');
        }

        return data;
    } catch (error) {
        console.error('Erro ao obter perfil:', error);
        throw error;
    }
}

// Função para verificar se o usuário está logado
function isLoggedIn() {
    return localStorage.getItem('userToken') !== null;
}

// Função para obter dados do usuário do localStorage
function getUserData() {
    const userData = localStorage.getItem('userData');
    return userData ? JSON.parse(userData) : null;
}

// Função para fazer logout
function logout() {
    localStorage.removeItem('userToken');
    localStorage.removeItem('userData');
    window.location.href = '/login.html';
}

// Função para verificar se o usuário é admin
function isAdmin() {
    const userData = getUserData();
    return userData && userData.role === 'admin';
}

// Função para verificar se o trial do usuário expirou
function isTrialExpired() {
    const userData = getUserData();
    if (!userData || !userData.trialExpires) return false;
    
    const trialExpires = new Date(userData.trialExpires);
    const now = new Date();
    
    return now > trialExpires;
}

// Função para redirecionar usuário não autenticado
function requireAuth() {
    if (!isLoggedIn()) {
        window.location.href = '/login.html';
        return false;
    }
    return true;
}

// Função para redirecionar usuário não admin
function requireAdmin() {
    if (!isLoggedIn() || !isAdmin()) {
        window.location.href = '/dashboard.html';
        return false;
    }
    return true;
}

// Exportar funções
window.authService = {
    login,
    register,
    getUserProfile,
    isLoggedIn,
    getUserData,
    logout,
    isAdmin,
    isTrialExpired,
    requireAuth,
    requireAdmin
};
