// Módulo de gestão de documentos - Gerenciadoc
// Implementação da interface de usuário para visualização em lista, upload e detalhamento

// Configuração da API
const API_BASE_URL = '/api';

// Estado da aplicação
let currentDocuments = [];
let currentFilters = {
    category: '',
    status: '',
    search: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
    page: 1,
    limit: 20
};
let categories = [];
let documentTypes = [];
let totalPages = 1;

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    // Carregar dados iniciais
    loadCategories();
    loadDocumentTypes();
    loadDocuments();
    
    // Configurar listeners
    setupEventListeners();
    
    // Configurar área de upload
    setupDropzone();
});

// Carregar categorias do servidor
async function loadCategories() {
    try {
        const response = await fetch(`${API_BASE_URL}/categories`);
        if (!response.ok) throw new Error('Falha ao carregar categorias');
        
        categories = await response.json();
        populateCategoryFilters(categories);
    } catch (error) {
        console.error('Erro ao carregar categorias:', error);
        showNotification('Erro ao carregar categorias', 'danger');
    }
}

// Carregar tipos de documentos do servidor
async function loadDocumentTypes() {
    try {
        const response = await fetch(`${API_BASE_URL}/document-types`);
        if (!response.ok) throw new Error('Falha ao carregar tipos de documentos');
        
        documentTypes = await response.json();
        populateDocumentTypeSelects(documentTypes);
    } catch (error) {
        console.error('Erro ao carregar tipos de documentos:', error);
        showNotification('Erro ao carregar tipos de documentos', 'danger');
    }
}

// Carregar documentos do servidor com filtros aplicados
async function loadDocuments() {
    try {
        showLoader();
        
        // Construir query string com filtros
        const queryParams = new URLSearchParams();
        for (const [key, value] of Object.entries(currentFilters)) {
            if (value) queryParams.append(key, value);
        }
        
        const response = await fetch(`${API_BASE_URL}/documents?${queryParams.toString()}`);
        if (!response.ok) throw new Error('Falha ao carregar documentos');
        
        const data = await response.json();
        currentDocuments = data.documents;
        totalPages = data.totalPages;
        
        renderDocumentsList(currentDocuments);
        updatePagination(currentFilters.page, totalPages);
        updateDocumentStats(data);
        
        hideLoader();
    } catch (error) {
        console.error('Erro ao carregar documentos:', error);
        showNotification('Erro ao carregar documentos', 'danger');
        hideLoader();
    }
}

// Renderizar lista de documentos
function renderDocumentsList(documents) {
    const documentsContainer = document.getElementById('documentsList');
    
    if (!documents || documents.length === 0) {
        documentsContainer.innerHTML = `
            <div class="text-center py-5">
                <i class="bi bi-file-earmark-x text-secondary" style="font-size: 3rem;"></i>
                <h5 class="mt-3">Nenhum documento encontrado</h5>
                <p class="text-muted">Tente ajustar os filtros ou adicione novos documentos.</p>
            </div>
        `;
        return;
    }
    
    // Limpar container
    documentsContainer.innerHTML = '';
    
    // Adicionar cabeçalho da lista
    const headerRow = document.createElement('div');
    headerRow.className = 'row border-bottom py-2 fw-bold bg-light';
    headerRow.innerHTML = `
        <div class="col-md-4">Nome do Documento</div>
        <div class="col-md-2">Categoria</div>
        <div class="col-md-2">Data de Validade</div>
        <div class="col-md-2">Status</div>
        <div class="col-md-2 text-end">Ações</div>
    `;
    documentsContainer.appendChild(headerRow);
    
    // Adicionar cada documento
    documents.forEach(doc => {
        const row = document.createElement('div');
        row.className = 'row border-bottom py-3 align-items-center document-row';
        
        // Determinar classe de status
        let statusClass = '';
        let statusText = '';
        
        switch (doc.status) {
            case 'valid':
                statusClass = 'badge-valid';
                statusText = 'Válido';
                break;
            case 'expiring':
                statusClass = 'badge-expiring';
                statusText = 'A vencer';
                break;
            case 'expired':
                statusClass = 'badge-expired';
                statusText = 'Vencido';
                break;
            case 'pending':
                statusClass = 'badge-pending';
                statusText = 'Pendente';
                break;
            default:
                statusClass = 'badge-secondary';
                statusText = 'Indefinido';
        }
        
        // Formatar data de validade
        const validityDate = doc.expirationDate 
            ? new Date(doc.expirationDate).toLocaleDateString('pt-BR')
            : 'Sem validade';
        
        // Determinar ícone do tipo de arquivo
        let fileIcon = '';
        const fileFormat = doc.fileFormat ? doc.fileFormat.toLowerCase() : '';
        
        if (['pdf'].includes(fileFormat)) {
            fileIcon = '<i class="bi bi-file-earmark-pdf document-icon pdf"></i>';
        } else if (['doc', 'docx'].includes(fileFormat)) {
            fileIcon = '<i class="bi bi-file-earmark-word document-icon doc"></i>';
        } else if (['xls', 'xlsx'].includes(fileFormat)) {
            fileIcon = '<i class="bi bi-file-earmark-excel document-icon xls"></i>';
        } else if (['jpg', 'jpeg', 'png', 'gif'].includes(fileFormat)) {
            fileIcon = '<i class="bi bi-file-earmark-image document-icon img"></i>';
        } else {
            fileIcon = '<i class="bi bi-file-earmark document-icon other"></i>';
        }
        
        row.innerHTML = `
            <div class="col-md-4">
                <div class="d-flex align-items-center">
                    ${fileIcon}
                    <div class="ms-3">
                        <h6 class="mb-0">${doc.name}</h6>
                        <small class="text-muted">${formatFileSize(doc.fileSize)}</small>
                    </div>
                </div>
            </div>
            <div class="col-md-2">
                ${doc.categoryId ? doc.categoryId.name : 'Não categorizado'}
            </div>
            <div class="col-md-2">
                ${validityDate}
            </div>
            <div class="col-md-2">
                <span class="badge ${statusClass}">${statusText}</span>
            </div>
            <div class="col-md-2 text-end">
                <div class="d-flex justify-content-end">
                    <span class="action-icon view me-2" data-id="${doc._id}" title="Visualizar">
                        <i class="bi bi-eye"></i>
                    </span>
                    <span class="action-icon edit me-2" data-id="${doc._id}" title="Editar">
                        <i class="bi bi-pencil"></i>
                    </span>
                    <span class="action-icon download me-2" data-id="${doc._id}" title="Download">
                        <i class="bi bi-download"></i>
                    </span>
                    <span class="action-icon delete" data-id="${doc._id}" title="Excluir">
                        <i class="bi bi-trash"></i>
                    </span>
                </div>
            </div>
        `;
        
        // Adicionar evento de clique para visualizar documento
        const viewIcon = row.querySelector('.action-icon.view');
        viewIcon.addEventListener('click', () => viewDocument(doc._id));
        
        // Adicionar evento de clique para editar documento
        const editIcon = row.querySelector('.action-icon.edit');
        editIcon.addEventListener('click', () => editDocument(doc._id));
        
        // Adicionar evento de clique para download do documento
        const downloadIcon = row.querySelector('.action-icon.download');
        downloadIcon.addEventListener('click', () => downloadDocument(doc._id, doc.fileUrl));
        
        // Adicionar evento de clique para excluir documento
        const deleteIcon = row.querySelector('.action-icon.delete');
        deleteIcon.addEventListener('click', () => confirmDeleteDocument(doc._id, doc.name));
        
        documentsContainer.appendChild(row);
    });
}

// Formatar tamanho de arquivo
function formatFileSize(bytes) {
    if (!bytes) return 'Desconhecido';
    
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Byte';
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
}

// Atualizar estatísticas de documentos
function updateDocumentStats(data) {
    document.getElementById('validDocumentsCount').textContent = data.stats?.valid || 0;
    document.getElementById('expiringDocumentsCount').textContent = data.stats?.expiring || 0;
    document.getElementById('expiredDocumentsCount').textContent = data.stats?.expired || 0;
    document.getElementById('pendingDocumentsCount').textContent = data.stats?.pending || 0;
}

// Atualizar paginação
function updatePagination(currentPage, totalPages) {
    const paginationContainer = document.getElementById('documentsPagination');
    
    if (totalPages <= 1) {
        paginationContainer.innerHTML = '';
        return;
    }
    
    let paginationHTML = `
        <nav aria-label="Navegação de páginas">
            <ul class="pagination justify-content-center">
                <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
                    <a class="page-link" href="#" data-page="${currentPage - 1}" aria-label="Anterior">
                        <span aria-hidden="true">&laquo;</span>
                    </a>
                </li>
    `;
    
    // Determinar quais páginas mostrar
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);
    
    if (endPage - startPage < 4) {
        startPage = Math.max(1, endPage - 4);
    }
    
    for (let i = startPage; i <= endPage; i++) {
        paginationHTML += `
            <li class="page-item ${i === currentPage ? 'active' : ''}">
                <a class="page-link" href="#" data-page="${i}">${i}</a>
            </li>
        `;
    }
    
    paginationHTML += `
                <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
                    <a class="page-link" href="#" data-page="${currentPage + 1}" aria-label="Próximo">
                        <span aria-hidden="true">&raquo;</span>
                    </a>
                </li>
            </ul>
        </nav>
    `;
    
    paginationContainer.innerHTML = paginationHTML;
    
    // Adicionar eventos de clique
    const pageLinks = paginationContainer.querySelectorAll('.page-link');
    pageLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = parseInt(link.getAttribute('data-page'));
            if (page && page !== currentPage && page >= 1 && page <= totalPages) {
                currentFilters.page = page;
                loadDocuments();
            }
        });
    });
}

// Configurar listeners de eventos
function setupEventListeners() {
    // Filtro de pesquisa
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('keyup', debounce(() => {
        currentFilters.search = searchInput.value;
        currentFilters.page = 1; // Resetar para primeira página
        loadDocuments();
    }, 500));
    
    // Filtro de categoria
    const categoryFilter = document.getElementById('categoryFilter');
    categoryFilter.addEventListener('change', () => {
        currentFilters.category = categoryFilter.value;
        currentFilters.page = 1;
        loadDocuments();
    });
    
    // Filtro de status
    const statusFilter = document.getElementById('statusFilter');
    statusFilter.addEventListener('change', () => {
        currentFilters.status = statusFilter.value;
        currentFilters.page = 1;
        loadDocuments();
    });
    
    // Ordenação
    const sortOptions = document.getElementById('sortOptions');
    sortOptions.addEventListener('change', () => {
        const [sortBy, sortOrder] = sortOptions.value.split('-');
        currentFilters.sortBy = sortBy;
        currentFilters.sortOrder = sortOrder;
        loadDocuments();
    });
    
    // Botão de upload
    const uploadButton = document.getElementById('uploadDocumentBtn');
    uploadButton.addEventListener('click', () => {
        openUploadModal();
    });
    
    // Botão de limpar filtros
    const clearFiltersButton = document.getElementById('clearFiltersBtn');
    clearFiltersButton.addEventListener('click', () => {
        document.getElementById('searchInput').value = '';
        document.getElementById('categoryFilter').value = '';
        document.getElementById('statusFilter').value = '';
        document.getElementById('sortOptions').value = 'createdAt-desc';
        
        currentFilters = {
            category: '',
            status: '',
            search: '',
            sortBy: 'createdAt',
            sortOrder: 'desc',
            page: 1,
            limit: 20
        };
        
        loadDocuments();
    });
}

// Função para debounce (evitar múltiplas chamadas)
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Preencher filtros de categoria
function populateCategoryFilters(categories) {
    const categoryFilter = document.getElementById('categoryFilter');
    const uploadCategorySelect = document.getElementById('documentCategory');
    
    // Limpar opções existentes
    categoryFilter.innerHTML = '<option value="">Todas as categorias</option>';
    if (uploadCategorySelect) {
        uploadCategorySelect.innerHTML = '<option value="">Selecione uma categoria</option>';
    }
    
    // Adicionar categorias
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category._id;
        option.textContent = category.name;
        
        categoryFilter.appendChild(option.cloneNode(true));
        
        if (uploadCategorySelect) {
            uploadCategorySelect.appendChild(option);
        }
    });
}

// Preencher selects de tipos de documento
function populateDocumentTypeSelects(types) {
    const uploadTypeSelect = document.getElementById('documentType');
    
    if (uploadTypeSelect) {
        // Limpar opções existentes
        uploadTypeSelect.innerHTML = '<option value="">Selecione um tipo</option>';
        
        // Adicionar tipos
        types.forEach(type => {
            const option = document.createElement('option');
            option.value = type._id;
            option.textContent = type.name;
            uploadTypeSelect.appendChild(option);
        });
    }
}

// Configurar área de upload com drag and drop
function setupDropzone() {
    const dropzone = document.getElementById('uploadDropzone');
    const fileInput = document.getElementById('fileInput');
    
    if (!dropzone || !fileInput) return;
    
    // Eventos de drag and drop
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropzone.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    ['dragenter', 'dragover'].forEach(eventName => {
        dropzone.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        dropzone.addEventListener(eventName, unhighlight, false);
    });
    
    function highlight() {
        dropzone.classList.add('highlight');
    }
    
    function unhighlight() {
        dropzone.classList.remove('highlight');
    }
    
    // Manipular soltura de arquivos
    dropzone.addEventListener('drop', handleDrop, false);
    
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        fileInput.files = files;
        handleFiles(files);
    }
    
    // Manipular clique no dropzone
    dropzone.addEventListener('click', () => {
        fileInput.click();
    });
    
    // Manipular seleção de arquivos
    fileInput.addEventListener('change', () => {
        handleFiles(fileInput.files);
    });
}

// Manipular arquivos selecionados
function handleFiles(files) {
    if (!files.length) return;
    
    const fileList = document.getElementById('fileList');
    fileList.innerHTML = '';
    
    Array.from(files).forEach(file => {
        // Determinar ícone com base no tipo de arquivo
        let iconClass = 'bi-file-earmark';
        const fileType = file.type;
        
        if (fileType.includes('pdf')) {
            iconClass = 'bi-file-earmark-pdf';
        } else if (fileType.includes('word') || fileType.includes('doc')) {
            iconClass = 'bi-file-earmark-word';
        } else if (fileType.includes('sheet') || fileType.includes('excel')) {
            iconClass = 'bi-file-earmark-excel';
        } else if (fileType.includes('image')) {
            iconClass = 'bi-file-earmark-image';
        }
        
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.innerHTML = `
            <div class="file-icon">
                <i class="bi ${iconClass}"></i>
            </div>
            <div class="file-info">
                <div class="file-name">${file.name}</div>
                <div class="file-meta">${formatFileSize(file.size)}</div>
                <div class="progress file-progress">
                    <div class="progress-bar" role="progressbar" style="width: 0%"></div>
                </div>
            </div>
            <div class="file-actions">
                <span class="action-icon delete" title="Remover">
                    <i class="bi bi-x-circle"></i>
                </span>
            </div>
        `;
        
        // Adicionar evento para remover arquivo
        const deleteButton = fileItem.querySelector('.action-icon.delete');
        deleteButton.addEventListener('click', () => {
            fileItem.remove();
            // Se for o último arquivo, limpar o input
            if (fileList.children.length === 0) {
                document.getElementById('fileInput').value = '';
            }
        });
        
        fileList.appendChild(fileItem);
    });
    
    // Iniciar extração automática
    if (files.length === 1) {
        extractDocumentData(files[0]);
    }
}

// Extrair dados do documento automaticamente
async function extractDocumentData(file) {
    try {
        showLoader();
        
        // Criar FormData para envio do arquivo
        const formData = new FormData();
        formData.append('file', file);
        
        // Enviar para API de extração
        const response = await fetch(`${API_BASE_URL}/documents/extract`, {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) throw new Error('Falha ao extrair dados do documento');
        
        const data = await response.json();
        
        // Preencher formulário com dados extraídos
        if (data.success) {
            populateFormWithExtractedData(data.extractedData);
            showNotification('Dados extraídos com sucesso!', 'success');
        }
        
        hideLoader();
    } catch (error) {
        console.error('Erro ao extrair dados:', error);
        showNotification('Não foi possível extrair dados automaticamente', 'warning');
        hideLoader();
    }
}

// Preencher formulário com dados extraídos
function populateFormWithExtractedData(data) {
    if (!data) return;
    
    // Preencher campos básicos
    if (data.name) document.getElementById('documentName').value = data.name;
    if (data.description) document.getElementById('documentDescription').value = data.description;
    
    // Preencher categoria
    if (data.categoryId) {
        const categorySelect = document.getElementById('documentCategory');
        if (categorySelect) categorySelect.value = data.categoryId;
    }
    
    // Preencher tipo
    if (data.type) {
        const typeSelect = document.getElementById('documentType');
        if (typeSelect) typeSelect.value = data.type;
    }
    
    // Preencher datas
    if (data.issueDate) {
        const issueDateInput = document.getElementById('issueDate');
        if (issueDateInput) issueDateInput.value = formatDateForInput(data.issueDate);
    }
    
    if (data.expirationDate) {
        const expirationDateInput = document.getElementById('expirationDate');
        if (expirationDateInput) expirationDateInput.value = formatDateForInput(data.expirationDate);
    }
    
    // Preencher tags
    if (data.tags && data.tags.length > 0) {
        const tagsInput = document.getElementById('documentTags');
        if (tagsInput) tagsInput.value = data.tags.join(', ');
    }
    
    // Preencher metadados específicos
    if (data.metadata) {
        const metadataContainer = document.getElementById('metadataFields');
        if (metadataContainer) {
            // Limpar campos existentes
            metadataContainer.innerHTML = '';
            
            // Adicionar campos para cada metadado
            for (const [key, value] of Object.entries(data.metadata)) {
                if (value !== null && value !== undefined) {
                    const fieldDiv = document.createElement('div');
                    fieldDiv.className = 'mb-3';
                    
                    // Formatar nome do campo
                    const fieldName = key
                        .replace(/([A-Z])/g, ' $1')
                        .replace(/^./, str => str.toUpperCase());
                    
                    fieldDiv.innerHTML = `
                        <label class="form-label">${fieldName}</label>
                        <input type="text" class="form-control" name="metadata.${key}" value="${value}">
                    `;
                    
                    metadataContainer.appendChild(fieldDiv);
                }
            }
        }
    }
}

// Formatar data para input
function formatDateForInput(dateString) {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
}

// Abrir modal de upload
function openUploadModal() {
    const modal = new bootstrap.Modal(document.getElementById('uploadDocumentModal'));
    
    // Limpar formulário
    document.getElementById('uploadForm').reset();
    document.getElementById('fileList').innerHTML = '';
    
    // Mostrar modal
    modal.show();
}

// Enviar documento
async function uploadDocument(e) {
    e.preventDefault();
    
    const form = document.getElementById('uploadForm');
    const fileInput = document.getElementById('fileInput');
    
    if (!fileInput.files || fileInput.files.length === 0) {
        showNotification('Selecione um arquivo para upload', 'warning');
        return;
    }
    
    try {
        showLoader();
        
        // Criar FormData com todos os campos do formulário
        const formData = new FormData(form);
        
        // Enviar para API
        const response = await fetch(`${API_BASE_URL}/documents/upload`, {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) throw new Error('Falha ao enviar documento');
        
        const data = await response.json();
        
        // Fechar modal e atualizar lista
        bootstrap.Modal.getInstance(document.getElementById('uploadDocumentModal')).hide();
        showNotification('Documento enviado com sucesso!', 'success');
        loadDocuments();
        
        hideLoader();
    } catch (error) {
        console.error('Erro ao enviar documento:', error);
        showNotification('Erro ao enviar documento', 'danger');
        hideLoader();
    }
}

// Visualizar documento
async function viewDocument(id) {
    try {
        showLoader();
        
        // Buscar detalhes do documento
        const response = await fetch(`${API_BASE_URL}/documents/${id}`);
        if (!response.ok) throw new Error('Falha ao carregar documento');
        
        const data = await response.json();
        const document = data.document;
        
        // Preencher modal de visualização
        const modal = document.getElementById('viewDocumentModal');
        
        // Título do modal
        modal.querySelector('.modal-title').textContent = document.name;
        
        // Conteúdo do modal
        const modalBody = modal.querySelector('.modal-body');
        
        // Determinar classe de status
        let statusClass = '';
        let statusText = '';
        
        switch (document.status) {
            case 'valid':
                statusClass = 'badge-valid';
                statusText = 'Válido';
                break;
            case 'expiring':
                statusClass = 'badge-expiring';
                statusText = 'A vencer';
                break;
            case 'expired':
                statusClass = 'badge-expired';
                statusText = 'Vencido';
                break;
            case 'pending':
                statusClass = 'badge-pending';
                statusText = 'Pendente';
                break;
            default:
                statusClass = 'badge-secondary';
                statusText = 'Indefinido';
        }
        
        // Formatar datas
        const issueDate = document.issueDate 
            ? new Date(document.issueDate).toLocaleDateString('pt-BR')
            : 'Não informada';
            
        const expirationDate = document.expirationDate 
            ? new Date(document.expirationDate).toLocaleDateString('pt-BR')
            : 'Sem validade';
        
        // Construir HTML para metadados
        let metadataHTML = '';
        if (document.metadata && Object.keys(document.metadata).length > 0) {
            metadataHTML = '<div class="mt-4"><h6>Metadados</h6><ul class="list-group">';
            
            for (const [key, value] of Object.entries(document.metadata)) {
                if (value !== null && value !== undefined) {
                    // Formatar nome do campo
                    const fieldName = key
                        .replace(/([A-Z])/g, ' $1')
                        .replace(/^./, str => str.toUpperCase());
                    
                    metadataHTML += `
                        <li class="list-group-item d-flex justify-content-between align-items-center">
                            <span>${fieldName}</span>
                            <span class="text-primary">${value}</span>
                        </li>
                    `;
                }
            }
            
            metadataHTML += '</ul></div>';
        }
        
        // Construir HTML para tags
        let tagsHTML = '';
        if (document.tags && document.tags.length > 0) {
            tagsHTML = '<div class="mt-3"><h6>Tags</h6><div>';
            
            document.tags.forEach(tag => {
                tagsHTML += `<span class="category-badge">${tag}</span>`;
            });
            
            tagsHTML += '</div></div>';
        }
        
        // Preencher conteúdo do modal
        modalBody.innerHTML = `
            <div class="row">
                <div class="col-md-6">
                    <div class="document-preview mb-3">
                        <iframe src="${document.fileUrl}" width="100%" height="100%" frameborder="0"></iframe>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-body">
                            <h5 class="card-title">${document.name}</h5>
                            <p class="card-text">${document.description || 'Sem descrição'}</p>
                            
                            <div class="d-flex justify-content-between mb-2">
                                <span>Status:</span>
                                <span class="badge ${statusClass}">${statusText}</span>
                            </div>
                            
                            <div class="d-flex justify-content-between mb-2">
                                <span>Categoria:</span>
                                <span>${document.categoryId ? document.categoryId.name : 'Não categorizado'}</span>
                            </div>
                            
                            <div class="d-flex justify-content-between mb-2">
                                <span>Tipo:</span>
                                <span>${document.type ? document.type.name : 'Não especificado'}</span>
                            </div>
                            
                            <div class="d-flex justify-content-between mb-2">
                                <span>Data de Emissão:</span>
                                <span>${issueDate}</span>
                            </div>
                            
                            <div class="d-flex justify-content-between mb-2">
                                <span>Data de Validade:</span>
                                <span>${expirationDate}</span>
                            </div>
                            
                            <div class="d-flex justify-content-between mb-2">
                                <span>Tamanho:</span>
                                <span>${formatFileSize(document.fileSize)}</span>
                            </div>
                            
                            ${tagsHTML}
                            ${metadataHTML}
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Mostrar modal
        const viewModal = new bootstrap.Modal(modal);
        viewModal.show();
        
        hideLoader();
    } catch (error) {
        console.error('Erro ao visualizar documento:', error);
        showNotification('Erro ao carregar documento', 'danger');
        hideLoader();
    }
}

// Editar documento
async function editDocument(id) {
    try {
        showLoader();
        
        // Buscar detalhes do documento
        const response = await fetch(`${API_BASE_URL}/documents/${id}`);
        if (!response.ok) throw new Error('Falha ao carregar documento');
        
        const data = await response.json();
        const document = data.document;
        
        // Preencher modal de edição
        const modal = document.getElementById('editDocumentModal');
        const form = modal.querySelector('#editDocumentForm');
        
        // Definir ID do documento no formulário
        form.setAttribute('data-document-id', id);
        
        // Preencher campos
        form.querySelector('#editDocumentName').value = document.name;
        form.querySelector('#editDocumentDescription').value = document.description || '';
        
        if (document.categoryId) {
            form.querySelector('#editDocumentCategory').value = document.categoryId._id;
        }
        
        if (document.type) {
            form.querySelector('#editDocumentType').value = document.type._id;
        }
        
        if (document.issueDate) {
            form.querySelector('#editIssueDate').value = formatDateForInput(document.issueDate);
        }
        
        if (document.expirationDate) {
            form.querySelector('#editExpirationDate').value = formatDateForInput(document.expirationDate);
        }
        
        if (document.tags && document.tags.length > 0) {
            form.querySelector('#editDocumentTags').value = document.tags.join(', ');
        }
        
        // Preencher metadados
        const metadataContainer = form.querySelector('#editMetadataFields');
        metadataContainer.innerHTML = '';
        
        if (document.metadata && Object.keys(document.metadata).length > 0) {
            for (const [key, value] of Object.entries(document.metadata)) {
                if (value !== null && value !== undefined) {
                    const fieldDiv = document.createElement('div');
                    fieldDiv.className = 'mb-3';
                    
                    // Formatar nome do campo
                    const fieldName = key
                        .replace(/([A-Z])/g, ' $1')
                        .replace(/^./, str => str.toUpperCase());
                    
                    fieldDiv.innerHTML = `
                        <label class="form-label">${fieldName}</label>
                        <input type="text" class="form-control" name="metadata.${key}" value="${value}">
                    `;
                    
                    metadataContainer.appendChild(fieldDiv);
                }
            }
        }
        
        // Mostrar modal
        const editModal = new bootstrap.Modal(modal);
        editModal.show();
        
        hideLoader();
    } catch (error) {
        console.error('Erro ao editar documento:', error);
        showNotification('Erro ao carregar documento para edição', 'danger');
        hideLoader();
    }
}

// Salvar edição de documento
async function saveDocumentEdit(e) {
    e.preventDefault();
    
    const form = document.getElementById('editDocumentForm');
    const documentId = form.getAttribute('data-document-id');
    
    if (!documentId) {
        showNotification('ID do documento não encontrado', 'danger');
        return;
    }
    
    try {
        showLoader();
        
        // Coletar dados do formulário
        const formData = new FormData(form);
        const documentData = {};
        
        // Converter FormData para objeto
        for (const [key, value] of formData.entries()) {
            if (key.startsWith('metadata.')) {
                if (!documentData.metadata) documentData.metadata = {};
                const metadataKey = key.replace('metadata.', '');
                documentData.metadata[metadataKey] = value;
            } else {
                documentData[key] = value;
            }
        }
        
        // Processar tags
        if (documentData.tags) {
            documentData.tags = documentData.tags
                .split(',')
                .map(tag => tag.trim())
                .filter(tag => tag);
        }
        
        // Enviar para API
        const response = await fetch(`${API_BASE_URL}/documents/${documentId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(documentData)
        });
        
        if (!response.ok) throw new Error('Falha ao atualizar documento');
        
        // Fechar modal e atualizar lista
        bootstrap.Modal.getInstance(document.getElementById('editDocumentModal')).hide();
        showNotification('Documento atualizado com sucesso!', 'success');
        loadDocuments();
        
        hideLoader();
    } catch (error) {
        console.error('Erro ao atualizar documento:', error);
        showNotification('Erro ao atualizar documento', 'danger');
        hideLoader();
    }
}

// Download de documento
function downloadDocument(id, fileUrl) {
    // Criar link temporário para download
    const link = document.createElement('a');
    link.href = fileUrl;
    link.target = '_blank';
    link.download = ''; // Usar nome padrão do arquivo
    
    // Adicionar ao DOM, clicar e remover
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Confirmar exclusão de documento
function confirmDeleteDocument(id, name) {
    const modal = document.getElementById('deleteConfirmModal');
    
    // Preencher nome do documento
    modal.querySelector('.document-name').textContent = name;
    
    // Configurar botão de confirmação
    const confirmButton = modal.querySelector('#confirmDeleteBtn');
    confirmButton.onclick = () => deleteDocument(id);
    
    // Mostrar modal
    const deleteModal = new bootstrap.Modal(modal);
    deleteModal.show();
}

// Excluir documento
async function deleteDocument(id) {
    try {
        showLoader();
        
        // Enviar para API
        const response = await fetch(`${API_BASE_URL}/documents/${id}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) throw new Error('Falha ao excluir documento');
        
        // Fechar modal e atualizar lista
        bootstrap.Modal.getInstance(document.getElementById('deleteConfirmModal')).hide();
        showNotification('Documento excluído com sucesso!', 'success');
        loadDocuments();
        
        hideLoader();
    } catch (error) {
        console.error('Erro ao excluir documento:', error);
        showNotification('Erro ao excluir documento', 'danger');
        hideLoader();
    }
}

// Mostrar notificação
function showNotification(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-white bg-${type} border-0`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');
    
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Fechar"></button>
        </div>
    `;
    
    const toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) {
        // Criar container se não existir
        const container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        document.body.appendChild(container);
    }
    
    document.getElementById('toastContainer').appendChild(toast);
    
    const bsToast = new bootstrap.Toast(toast, {
        autohide: true,
        delay: 3000
    });
    
    bsToast.show();
    
    // Remover após ocultar
    toast.addEventListener('hidden.bs.toast', () => {
        toast.remove();
    });
}

// Mostrar loader
function showLoader() {
    const loader = document.getElementById('pageLoader');
    if (loader) loader.classList.remove('d-none');
}

// Ocultar loader
function hideLoader() {
    const loader = document.getElementById('pageLoader');
    if (loader) loader.classList.add('d-none');
}

// Exportar funções para uso global
window.uploadDocument = uploadDocument;
window.saveDocumentEdit = saveDocumentEdit;
