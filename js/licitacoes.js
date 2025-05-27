/**
 * Gerenciadoc - Funcionalidades da tela de Licitações
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
 * Inicializa os filtros da tela de licitações
 */
function initializeFilters() {
    const searchInput = document.querySelector('input[placeholder="Pesquisar licitações..."]');
    const statusSelect = document.querySelector('select option[selected]').parentElement;
    const typeSelect = document.querySelectorAll('select')[1];
    const sortSelect = document.querySelectorAll('select')[2];
    const clearFiltersBtn = document.querySelector('.btn-outline-primary');
    
    // Cards de licitações
    const cards = document.querySelectorAll('.licitacao-card');
    
    // Pesquisa por texto
    if (searchInput) {
        searchInput.addEventListener('keyup', function() {
            const searchTerm = this.value.toLowerCase();
            filterCardsByText(cards, searchTerm);
        });
    }
    
    // Filtro por status
    if (statusSelect) {
        statusSelect.addEventListener('change', function() {
            applyFilters(cards, searchInput, statusSelect, typeSelect, sortSelect);
        });
    }
    
    // Filtro por tipo
    if (typeSelect) {
        typeSelect.addEventListener('change', function() {
            applyFilters(cards, searchInput, statusSelect, typeSelect, sortSelect);
        });
    }
    
    // Ordenação
    if (sortSelect) {
        sortSelect.addEventListener('change', function() {
            applyFilters(cards, searchInput, statusSelect, typeSelect, sortSelect);
        });
    }
    
    // Limpar filtros
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', function() {
            // Resetar campos
            if (searchInput) searchInput.value = '';
            if (statusSelect) statusSelect.selectedIndex = 0;
            if (typeSelect) typeSelect.selectedIndex = 0;
            if (sortSelect) sortSelect.selectedIndex = 0;
            
            // Mostrar todos os cards
            cards.forEach(card => {
                card.closest('.col-md-6').style.display = '';
            });
        });
    }
}

/**
 * Filtra os cards com base no texto digitado
 */
function filterCardsByText(cards, searchTerm) {
    cards.forEach(card => {
        const text = card.textContent.toLowerCase();
        if (text.includes(searchTerm)) {
            card.closest('.col-md-6').style.display = '';
        } else {
            card.closest('.col-md-6').style.display = 'none';
        }
    });
}

/**
 * Aplica todos os filtros aos cards
 */
function applyFilters(cards, searchInput, statusSelect, typeSelect, sortSelect) {
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    const statusValue = statusSelect ? statusSelect.value : 'Todos os status';
    const typeValue = typeSelect ? typeSelect.value : 'Todos os tipos';
    
    cards.forEach(card => {
        const text = card.textContent.toLowerCase();
        const status = card.querySelector('.badge').textContent;
        const type = card.querySelector('.text-muted').textContent;
        
        let showCard = true;
        
        // Filtro de texto
        if (searchTerm && !text.includes(searchTerm)) {
            showCard = false;
        }
        
        // Filtro de status
        if (statusValue !== 'Todos os status' && status !== statusValue) {
            showCard = false;
        }
        
        // Filtro de tipo
        if (typeValue !== 'Todos os tipos' && !type.includes(typeValue)) {
            showCard = false;
        }
        
        card.closest('.col-md-6').style.display = showCard ? '' : 'none';
    });
    
    // Aplicar ordenação
    if (sortSelect) {
        const sortValue = sortSelect.value;
        sortCards(cards, sortValue);
    }
}

/**
 * Ordena os cards com base no critério selecionado
 */
function sortCards(cards, sortCriteria) {
    const container = cards[0].closest('.row');
    const cardsArray = Array.from(cards).map(card => card.closest('.col-md-6'));
    
    cardsArray.sort((a, b) => {
        const cardA = a.querySelector('.licitacao-card');
        const cardB = b.querySelector('.licitacao-card');
        
        if (sortCriteria.includes('Data de abertura')) {
            const dateTextA = cardA.querySelector('.font-medium').textContent;
            const dateTextB = cardB.querySelector('.font-medium').textContent;
            const dateA = parseDate(dateTextA);
            const dateB = parseDate(dateTextB);
            
            return sortCriteria.includes('mais próxima') ? dateA - dateB : dateB - dateA;
        } else if (sortCriteria.includes('Valor')) {
            const valueTextA = cardA.querySelector('.font-medium').textContent;
            const valueTextB = cardB.querySelector('.font-medium').textContent;
            const valueA = parseFloat(valueTextA.replace(/[^0-9,]/g, '').replace(',', '.'));
            const valueB = parseFloat(valueTextB.replace(/[^0-9,]/g, '').replace(',', '.'));
            
            return sortCriteria.includes('maior') ? valueB - valueA : valueA - valueB;
        }
        return 0;
    });
    
    // Reordenar no DOM
    cardsArray.forEach(card => {
        container.appendChild(card);
    });
}

/**
 * Converte texto de data para objeto Date
 */
function parseDate(dateText) {
    const parts = dateText.split('/');
    return new Date(parts[2], parts[1] - 1, parts[0]);
}
