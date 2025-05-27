/**
 * Gerenciadoc - Funcionalidades da tela de Documentos
 * Data: 27 de Maio de 2025
 */

document.addEventListener('DOMContentLoaded', function() {
    // Inicialização dos tooltips do Bootstrap
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // Funcionalidade de filtros
    initializeFilters();
});

/**
 * Inicializa os filtros da tabela de documentos
 */
function initializeFilters() {
    const searchInput = document.querySelector('input[placeholder="Pesquisar documentos..."]');
    const categorySelect = document.querySelector('select option[selected]').parentElement;
    const statusSelect = document.querySelectorAll('select')[1];
    const sortSelect = document.querySelectorAll('select')[2];
    const clearFiltersBtn = document.querySelector('.btn-outline-primary');
    
    // Tabela e linhas
    const table = document.querySelector('table');
    const rows = table.querySelectorAll('tbody tr');
    
    // Pesquisa por texto
    if (searchInput) {
        searchInput.addEventListener('keyup', function() {
            const searchTerm = this.value.toLowerCase();
            filterTableByText(rows, searchTerm);
        });
    }
    
    // Filtro por categoria
    if (categorySelect) {
        categorySelect.addEventListener('change', function() {
            applyFilters(rows, searchInput, categorySelect, statusSelect, sortSelect);
        });
    }
    
    // Filtro por status
    if (statusSelect) {
        statusSelect.addEventListener('change', function() {
            applyFilters(rows, searchInput, categorySelect, statusSelect, sortSelect);
        });
    }
    
    // Ordenação
    if (sortSelect) {
        sortSelect.addEventListener('change', function() {
            applyFilters(rows, searchInput, categorySelect, statusSelect, sortSelect);
        });
    }
    
    // Limpar filtros
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', function() {
            // Resetar campos
            if (searchInput) searchInput.value = '';
            if (categorySelect) categorySelect.selectedIndex = 0;
            if (statusSelect) statusSelect.selectedIndex = 0;
            if (sortSelect) sortSelect.selectedIndex = 0;
            
            // Mostrar todas as linhas
            rows.forEach(row => {
                row.style.display = '';
            });
        });
    }
}

/**
 * Filtra a tabela com base no texto digitado
 */
function filterTableByText(rows, searchTerm) {
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        if (text.includes(searchTerm)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

/**
 * Aplica todos os filtros à tabela
 */
function applyFilters(rows, searchInput, categorySelect, statusSelect, sortSelect) {
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    const categoryValue = categorySelect ? categorySelect.value : 'Todas as categorias';
    const statusValue = statusSelect ? statusSelect.value : 'Todos os status';
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        const category = row.querySelector('td:nth-child(2)').textContent;
        const status = row.querySelector('.status-badge').textContent;
        
        let showRow = true;
        
        // Filtro de texto
        if (searchTerm && !text.includes(searchTerm)) {
            showRow = false;
        }
        
        // Filtro de categoria
        if (categoryValue !== 'Todas as categorias' && category !== categoryValue) {
            showRow = false;
        }
        
        // Filtro de status
        if (statusValue !== 'Todos os status' && status !== statusValue) {
            showRow = false;
        }
        
        row.style.display = showRow ? '' : 'none';
    });
    
    // Aplicar ordenação
    if (sortSelect) {
        const sortValue = sortSelect.value;
        sortTable(rows, sortValue);
    }
}

/**
 * Ordena a tabela com base no critério selecionado
 */
function sortTable(rows, sortCriteria) {
    const tbody = rows[0].parentNode;
    const rowsArray = Array.from(rows);
    
    rowsArray.sort((a, b) => {
        if (sortCriteria === 'Mais recentes') {
            const dateA = new Date(a.querySelector('td:nth-child(4)').textContent);
            const dateB = new Date(b.querySelector('td:nth-child(4)').textContent);
            return dateB - dateA;
        } else if (sortCriteria === 'Mais antigos') {
            const dateA = new Date(a.querySelector('td:nth-child(4)').textContent);
            const dateB = new Date(b.querySelector('td:nth-child(4)').textContent);
            return dateA - dateB;
        } else if (sortCriteria === 'Próximos a vencer') {
            const dateA = new Date(a.querySelector('td:nth-child(4)').textContent);
            const dateB = new Date(b.querySelector('td:nth-child(4)').textContent);
            const today = new Date();
            return (dateA - today) - (dateB - today);
        } else if (sortCriteria === 'Alfabético (A-Z)') {
            const textA = a.querySelector('td:first-child').textContent;
            const textB = b.querySelector('td:first-child').textContent;
            return textA.localeCompare(textB);
        }
        return 0;
    });
    
    // Reordenar no DOM
    rowsArray.forEach(row => {
        tbody.appendChild(row);
    });
}
