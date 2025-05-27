/**
 * Gerenciadoc - Adiciona botão de remover a todos os itens do checklist
 * Data: 27 de Maio de 2025
 */

document.addEventListener('DOMContentLoaded', function() {
    // Adicionar botão de remover a todos os itens do checklist
    addRemoveButtonsToAllChecklistItems();
});

/**
 * Adiciona botão de remover a todos os itens do checklist
 */
function addRemoveButtonsToAllChecklistItems() {
    // Selecionar todas as linhas do checklist
    const checklistRows = document.querySelectorAll('.table tbody tr');
    
    checklistRows.forEach(row => {
        const actionsCell = row.querySelector('td:last-child');
        
        // Verificar se já existe o botão de remover
        if (!actionsCell.querySelector('.text-danger')) {
            // Criar botão de remover
            const removeButton = document.createElement('button');
            removeButton.className = 'btn btn-sm btn-icon text-danger';
            removeButton.title = 'Remover item';
            removeButton.innerHTML = '<i class="fas fa-trash-alt"></i>';
            
            // Adicionar evento de clique
            removeButton.addEventListener('click', function() {
                if (confirm('Tem certeza que deseja remover este item do checklist?')) {
                    row.remove();
                    updateProgress();
                }
            });
            
            // Adicionar ao final da célula de ações
            actionsCell.appendChild(removeButton);
        }
    });
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
    if (progressBar) {
        progressBar.style.width = `${percentage}%`;
        progressBar.setAttribute('aria-valuenow', percentage);
    }
    
    // Atualizar o texto de progresso
    const progressBadge = document.querySelector('.card-header .badge');
    if (progressBadge) {
        progressBadge.textContent = `${percentage}% Completo`;
    }
}
