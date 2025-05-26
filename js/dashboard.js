// Dashboard principal do Gerenciadoc
document.addEventListener('DOMContentLoaded', function() {
    console.log('Dashboard inicializado');
    
    // Verificar autenticação
    if (window.authService && !window.authService.isLoggedIn()) {
        console.log('Usuário não autenticado, redirecionando para login');
        window.location.href = 'login.html';
        return;
    }

    // Carregar dados do usuário
    if (window.authService) {
        const userData = window.authService.getUserData();
        if (userData) {
            const userNameElement = document.getElementById('userName');
            if (userNameElement) {
                userNameElement.textContent = `Olá, ${userData.name || 'Usuário'}`;
            }
        }
    }

    // Configurar logout
    const btnLogout = document.getElementById('btnLogout');
    if (btnLogout) {
        btnLogout.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Logout solicitado');
            if (window.authService) {
                window.authService.logout();
            } else {
                window.location.href = 'login.html';
            }
        });
    }

    // Configurar navegação do menu lateral
    setupNavigation();

    // Carregar dados do dashboard
    loadDashboardData();

    // Configurar eventos para botões de ação
    setupActionButtons();

    // Configurar eventos para botões "Ver Todos"
    setupViewAllButtons();
});

// Função para configurar navegação
function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            // Não prevenir o comportamento padrão para o link de logout
            if (this.id === 'btnLogout') return;
            
            e.preventDefault();
            console.log('Navegação para:', this.getAttribute('href'));
            
            // Remover classe active de todos os links
            navLinks.forEach(l => l.classList.remove('active'));
            
            // Adicionar classe active ao link clicado
            this.classList.add('active');
            
            // Redirecionar para a página correspondente
            const href = this.getAttribute('href');
            if (href && href !== '#') {
                window.location.href = href;
            }
        });
    });
}

// Função para carregar dados do dashboard
async function loadDashboardData() {
    try {
        console.log('Carregando dados do dashboard');
        
        // Obter token de autenticação
        const token = localStorage.getItem('userToken');
        if (!token) {
            console.log('Token não encontrado, usando dados de demonstração');
            loadDemoData();
            return;
        }

        // Carregar métricas
        await loadMetrics();
        
        // Carregar documentos recentes
        await loadRecentDocuments();
        
        // Carregar próximos alertas
        await loadUpcomingAlerts();
    } catch (error) {
        console.error('Erro ao carregar dados do dashboard:', error);
        // Usar dados de demonstração em caso de erro
        loadDemoData();
    }
}

// Função para carregar métricas
async function loadMetrics() {
    try {
        console.log('Carregando métricas');
        
        const API_URL = window.location.hostname.includes('localhost') 
            ? 'http://localhost:5000/api' 
            : 'https://' + window.location.hostname + '/api';
        
        const token = localStorage.getItem('userToken');
        
        const response = await fetch(`${API_URL}/documents/metrics`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Falha ao obter métricas');
        }

        const data = await response.json();
        
        // Atualizar métricas na interface
        updateMetrics(data);
    } catch (error) {
        console.error('Erro ao carregar métricas:', error);
        // Usar métricas de demonstração
        updateMetrics({
            validDocuments: 42,
            totalDocuments: 50,
            expiringDocuments: 8,
            expiredDocuments: 3,
            pendingApproval: 5
        });
    }
}

// Função para atualizar métricas na interface
function updateMetrics(metrics) {
    console.log('Atualizando métricas na interface', metrics);
    
    const metricElements = document.querySelectorAll('.metric-value');
    
    // Documentos válidos
    if (metricElements[0]) metricElements[0].textContent = metrics.validDocuments || 42;
    
    // Vencendo em breve
    if (metricElements[1]) metricElements[1].textContent = metrics.expiringDocuments || 8;
    
    // Documentos vencidos
    if (metricElements[2]) metricElements[2].textContent = metrics.expiredDocuments || 3;
    
    // Pendentes de aprovação
    if (metricElements[3]) metricElements[3].textContent = metrics.pendingApproval || 5;
}

// Função para carregar documentos recentes
async function loadRecentDocuments() {
    try {
        console.log('Carregando documentos recentes');
        
        const API_URL = window.location.hostname.includes('localhost') 
            ? 'http://localhost:5000/api' 
            : 'https://' + window.location.hostname + '/api';
        
        const token = localStorage.getItem('userToken');
        
        const response = await fetch(`${API_URL}/documents/recent`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Falha ao obter documentos recentes');
        }

        const documents = await response.json();
        
        // Atualizar tabela de documentos recentes
        updateRecentDocuments(documents);
    } catch (error) {
        console.error('Erro ao carregar documentos recentes:', error);
        // Usar documentos de demonstração
        const demoDocuments = [
            { name: 'Certidão Negativa Federal', status: 'valid', validUntil: '2025-08-15' },
            { name: 'Certidão Negativa Estadual', status: 'valid', validUntil: '2025-07-22' },
            { name: 'Certidão Negativa Municipal', status: 'warning', validUntil: '2025-06-10' },
            { name: 'Certidão FGTS', status: 'warning', validUntil: '2025-06-05' },
            { name: 'Certidão Trabalhista', status: 'valid', validUntil: '2025-09-30' }
        ];
        updateRecentDocuments(demoDocuments);
    }
}

// Função para atualizar tabela de documentos recentes
function updateRecentDocuments(documents) {
    console.log('Atualizando tabela de documentos recentes', documents);
    
    const tableBody = document.querySelector('.table tbody');
    if (!tableBody) {
        console.error('Elemento tbody não encontrado');
        return;
    }
    
    // Limpar tabela
    tableBody.innerHTML = '';
    
    // Adicionar documentos à tabela
    documents.forEach(doc => {
        const row = document.createElement('tr');
        
        // Formatar data
        const date = new Date(doc.validUntil);
        const formattedDate = date.toLocaleDateString('pt-BR');
        
        // Determinar status
        let statusText = 'Válido';
        let statusClass = 'valid';
        
        if (doc.status === 'warning') {
            statusText = 'Vence em breve';
            statusClass = 'warning';
        } else if (doc.status === 'danger') {
            statusText = 'Vencido';
            statusClass = 'danger';
        }
        
        row.innerHTML = `
            <td>${doc.name}</td>
            <td><span class="status-badge ${statusClass}">${statusText}</span></td>
            <td>${formattedDate}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary action-btn" data-action="view" data-id="${doc.id || ''}"><i class="bi bi-eye"></i></button>
                <button class="btn btn-sm btn-outline-primary action-btn" data-action="download" data-id="${doc.id || ''}"><i class="bi bi-download"></i></button>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
    
    // Reconfigurar eventos para botões de ação
    setupActionButtons();
}

// Função para carregar próximos alertas
async function loadUpcomingAlerts() {
    try {
        console.log('Carregando próximos alertas');
        
        const API_URL = window.location.hostname.includes('localhost') 
            ? 'http://localhost:5000/api' 
            : 'https://' + window.location.hostname + '/api';
        
        const token = localStorage.getItem('userToken');
        
        const response = await fetch(`${API_URL}/documents/alerts`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Falha ao obter alertas');
        }

        const alerts = await response.json();
        
        // Atualizar lista de alertas
        updateUpcomingAlerts(alerts);
    } catch (error) {
        console.error('Erro ao carregar alertas:', error);
        // Usar alertas de demonstração
        const demoAlerts = [
            { name: 'Certidão Municipal', validUntil: '2025-06-10', daysRemaining: 5 },
            { name: 'Certidão FGTS', validUntil: '2025-06-05', daysRemaining: 10 },
            { name: 'Balanço Patrimonial', validUntil: '2025-06-15', daysRemaining: 20 },
            { name: 'Atestado de Capacidade', validUntil: '2025-06-20', daysRemaining: 25 }
        ];
        updateUpcomingAlerts(demoAlerts);
    }
}

// Função para atualizar lista de alertas
function updateUpcomingAlerts(alerts) {
    console.log('Atualizando lista de alertas', alerts);
    
    const alertList = document.querySelector('.alert-list');
    if (!alertList) {
        console.error('Elemento alert-list não encontrado');
        return;
    }
    
    // Limpar lista
    alertList.innerHTML = '';
    
    // Adicionar alertas à lista
    alerts.forEach(alert => {
        // Formatar data
        const date = new Date(alert.validUntil);
        const formattedDate = date.toLocaleDateString('pt-BR');
        
        // Determinar classe de alerta
        let alertClass = 'info';
        if (alert.daysRemaining <= 10) {
            alertClass = 'danger';
        } else if (alert.daysRemaining <= 20) {
            alertClass = 'warning';
        }
        
        const item = document.createElement('li');
        item.className = 'alert-item';
        item.innerHTML = `
            <div class="alert-info">
                <h6>${alert.name}</h6>
                <small>Vence em ${formattedDate}</small>
            </div>
            <span class="alert-days ${alertClass}">${alert.daysRemaining} dias</span>
        `;
        
        alertList.appendChild(item);
    });
}

// Função para configurar eventos para botões de ação
function setupActionButtons() {
    console.log('Configurando eventos para botões de ação');
    
    // Remover eventos antigos para evitar duplicação
    const oldButtons = document.querySelectorAll('.action-btn');
    oldButtons.forEach(button => {
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);
    });
    
    // Adicionar novos eventos
    const actionButtons = document.querySelectorAll('.action-btn');
    actionButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const action = this.getAttribute('data-action');
            const id = this.getAttribute('data-id');
            const row = this.closest('tr');
            const documentName = row ? row.querySelector('td:first-child').textContent : 'documento';
            
            console.log(`Ação: ${action}, Documento: ${documentName}, ID: ${id}`);
            
            if (action === 'view') {
                // Visualizar documento
                alert(`Visualizando documento: ${documentName}`);
            } else if (action === 'download') {
                // Baixar documento
                alert(`Baixando documento: ${documentName}`);
            }
        });
    });
}

// Função para configurar eventos para botões "Ver Todos"
function setupViewAllButtons() {
    console.log('Configurando eventos para botões "Ver Todos"');
    
    const viewAllButtons = document.querySelectorAll('.card-header .btn-outline-primary');
    viewAllButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            
            const href = this.getAttribute('href');
            console.log(`Navegando para: ${href}`);
            
            if (href && href !== '#') {
                window.location.href = href;
            }
        });
    });
}

// Função para carregar dados de demonstração
function loadDemoData() {
    console.log('Carregando dados de demonstração');
    
    // Atualizar métricas
    updateMetrics({
        validDocuments: 42,
        totalDocuments: 50,
        expiringDocuments: 8,
        expiredDocuments: 3,
        pendingApproval: 5
    });
    
    // Atualizar documentos recentes
    const demoDocuments = [
        { name: 'Certidão Negativa Federal', status: 'valid', validUntil: '2025-08-15' },
        { name: 'Certidão Negativa Estadual', status: 'valid', validUntil: '2025-07-22' },
        { name: 'Certidão Negativa Municipal', status: 'warning', validUntil: '2025-06-10' },
        { name: 'Certidão FGTS', status: 'warning', validUntil: '2025-06-05' },
        { name: 'Certidão Trabalhista', status: 'valid', validUntil: '2025-09-30' }
    ];
    updateRecentDocuments(demoDocuments);
    
    // Atualizar alertas
    const demoAlerts = [
        { name: 'Certidão Municipal', validUntil: '2025-06-10', daysRemaining: 5 },
        { name: 'Certidão FGTS', validUntil: '2025-06-05', daysRemaining: 10 },
        { name: 'Balanço Patrimonial', validUntil: '2025-06-15', daysRemaining: 20 },
        { name: 'Atestado de Capacidade', validUntil: '2025-06-20', daysRemaining: 25 }
    ];
    updateUpcomingAlerts(demoAlerts);
}
