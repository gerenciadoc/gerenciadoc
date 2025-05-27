/**
 * Gerenciadoc - Funcionalidades da tela de Detalhes da Licitação
 * Data: 27 de Maio de 2025
 */

document.addEventListener('DOMContentLoaded', function() {
    // Inicialização dos tooltips do Bootstrap
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // Inicializar funcionalidades do checklist
    initializeChecklist();
});

/**
 * Inicializa as funcionalidades do checklist
 */
function initializeChecklist() {
    // Botões de remover item
    const removeButtons = document.querySelectorAll('.btn-sm.btn-icon.text-danger');
    removeButtons.forEach(button => {
        button.addEventListener('click', function() {
            const row = this.closest('tr');
            
            // Confirmar antes de remover
            if (confirm('Tem certeza que deseja remover este item do checklist?')) {
                // Remover a linha
                row.remove();
                
                // Atualizar o progresso
                updateProgress();
            }
        });
    });

    // Checkboxes do checklist
    const checkboxes = document.querySelectorAll('.form-check-input');
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const row = this.closest('tr');
            const statusCell = row.querySelector('td:nth-child(4)');
            
            if (this.checked) {
                statusCell.innerHTML = '<span class="badge bg-success">Concluído</span>';
            } else {
                statusCell.innerHTML = '<span class="badge bg-warning text-dark">Pendente</span>';
            }
            
            // Atualizar o progresso
            updateProgress();
        });
    });

    // Botão de adicionar item
    const addItemButton = document.querySelector('[data-bs-target="#adicionarItemChecklistModal"]');
    if (addItemButton) {
        // Garantir que o modal existe
        createAddItemModal();
    }
}

/**
 * Cria o modal para adicionar novo item ao checklist
 */
function createAddItemModal() {
    // Verificar se o modal já existe
    if (document.getElementById('adicionarItemChecklistModal')) {
        return;
    }
    
    // Criar o modal
    const modalHTML = `
    <div class="modal fade" id="adicionarItemChecklistModal" tabindex="-1" aria-labelledby="adicionarItemChecklistModalLabel" aria-hidden="true">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="adicionarItemChecklistModalLabel">Adicionar Item ao Checklist</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fechar"></button>
                </div>
                <div class="modal-body">
                    <form id="formAdicionarItem">
                        <div class="mb-3">
                            <label for="nomeItem" class="form-label">Nome do Item</label>
                            <input type="text" class="form-control" id="nomeItem" required>
                        </div>
                        <div class="mb-3">
                            <label for="categoriaItem" class="form-label">Categoria</label>
                            <select class="form-select" id="categoriaItem" required>
                                <option value="">Selecione uma categoria</option>
                                <option value="Fiscal">Fiscal</option>
                                <option value="Trabalhista">Trabalhista</option>
                                <option value="Técnica">Técnica</option>
                                <option value="Habilitação Jurídica">Habilitação Jurídica</option>
                                <option value="Qualificação">Qualificação</option>
                            </select>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancelar</button>
                    <button type="button" class="btn btn-primary" id="btnSalvarItem">Adicionar Item</button>
                </div>
            </div>
        </div>
    </div>
    `;
    
    // Adicionar o modal ao DOM
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Adicionar evento ao botão de salvar
    document.getElementById('btnSalvarItem').addEventListener('click', function() {
        addNewChecklistItem();
    });
}

/**
 * Adiciona um novo item ao checklist
 */
function addNewChecklistItem() {
    const nomeItem = document.getElementById('nomeItem').value;
    const categoriaItem = document.getElementById('categoriaItem').value;
    
    if (!nomeItem || !categoriaItem) {
        alert('Por favor, preencha todos os campos.');
        return;
    }
    
    // Criar nova linha na tabela
    const tbody = document.querySelector('.table tbody');
    const newRow = document.createElement('tr');
    
    newRow.innerHTML = `
        <td>
            <div class="form-check">
                <input class="form-check-input" type="checkbox">
            </div>
        </td>
        <td>${nomeItem}</td>
        <td>${categoriaItem}</td>
        <td><span class="badge bg-warning text-dark">Pendente</span></td>
        <td>
            <button class="btn btn-sm btn-icon" title="Ver documento">
                <i class="fas fa-eye"></i>
            </button>
            <button class="btn btn-sm btn-icon" title="Editar">
                <i class="fas fa-edit"></i>
            </button>
            <button class="btn btn-sm btn-icon text-danger" title="Remover item">
                <i class="fas fa-trash-alt"></i>
            </button>
        </td>
    `;
    
    tbody.appendChild(newRow);
    
    // Adicionar evento ao botão de remover
    const removeButton = newRow.querySelector('.btn-sm.btn-icon.text-danger');
    removeButton.addEventListener('click', function() {
        if (confirm('Tem certeza que deseja remover este item do checklist?')) {
            newRow.remove();
            updateProgress();
        }
    });
    
    // Adicionar evento ao checkbox
    const checkbox = newRow.querySelector('.form-check-input');
    checkbox.addEventListener('change', function() {
        const statusCell = newRow.querySelector('td:nth-child(4)');
        
        if (this.checked) {
            statusCell.innerHTML = '<span class="badge bg-success">Concluído</span>';
        } else {
            statusCell.innerHTML = '<span class="badge bg-warning text-dark">Pendente</span>';
        }
        
        updateProgress();
    });
    
    // Atualizar o progresso
    updateProgress();
    
    // Fechar o modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('adicionarItemChecklistModal'));
    modal.hide();
    
    // Limpar o formulário
    document.getElementById('formAdicionarItem').reset();
}

/**
 * Atualiza o progresso do checklist
 */
function updateProgress() {
    const checkboxes = document.querySelectorAll('.form-check-input');
    const totalItems = checkboxes.length;
    const checkedItems = document.querySelectorAll('.form-check-input:checked').length;
    
    // Calcular porcentagem
    const percentage = totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0;
    
    // Atualizar a barra de progresso
    const progressBar = document.querySelector('.progress-bar');
    progressBar.style.width = `${percentage}%`;
    progressBar.setAttribute('aria-valuenow', percentage);
    
    // Atualizar o texto de progresso
    const progressBadge = document.querySelector('.card-header .badge');
    progressBadge.textContent = `${percentage}% Completo`;
}
