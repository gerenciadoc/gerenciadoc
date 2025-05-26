// Simple script for dashboard preview
document.addEventListener('DOMContentLoaded', function() {
    // Handle sidebar navigation
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            // Remove active class from all links
            navLinks.forEach(l => l.classList.remove('active'));
            // Add active class to clicked link
            this.classList.add('active');
            
            // Show alert for navigation
            alert('Navegação para: ' + this.textContent.trim() + '\n\nEsta é uma prévia navegável. A implementação completa será feita após sua aprovação.');
        });
    });
    
    // Handle action buttons
    const actionButtons = document.querySelectorAll('.btn-outline-primary, .btn-outline-secondary');
    actionButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const action = this.querySelector('i').classList.contains('bi-eye') ? 'Visualizar' : 'Baixar';
            const row = this.closest('tr');
            const document = row ? row.querySelector('td:first-child').textContent : 'documento';
            
            alert('Ação: ' + action + ' ' + document + '\n\nEsta é uma prévia navegável. A implementação completa será feita após sua aprovação.');
        });
    });
    
    // Handle "Ver Todos" buttons
    const viewAllButtons = document.querySelectorAll('a.btn-outline-primary');
    viewAllButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.closest('.card').querySelector('.card-title').textContent;
            
            alert('Navegação para: Ver todos os ' + section + '\n\nEsta é uma prévia navegável. A implementação completa será feita após sua aprovação.');
        });
    });
});
