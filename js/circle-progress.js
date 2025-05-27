/**
 * Gerenciadoc - Funcionalidades para gráficos circulares de progresso
 * Data: 27 de Maio de 2025
 */

document.addEventListener('DOMContentLoaded', function() {
    // Inicializar todos os gráficos circulares na página
    initializeCircleProgressCharts();
});

/**
 * Inicializa todos os gráficos circulares de progresso na página
 */
function initializeCircleProgressCharts() {
    const progressElements = document.querySelectorAll('.circle-progress-container');
    
    progressElements.forEach(element => {
        const percentage = parseInt(element.getAttribute('data-percentage') || '0');
        const color = element.getAttribute('data-color') || 'primary';
        
        createCircleProgressChart(element, percentage, color);
    });
}

/**
 * Cria um gráfico circular de progresso
 * @param {HTMLElement} container - Elemento container do gráfico
 * @param {number} percentage - Porcentagem de progresso (0-100)
 * @param {string} color - Cor do progresso (primary, success, warning, danger)
 */
function createCircleProgressChart(container, percentage, color) {
    // Calcular o perímetro do círculo
    const radius = 45;
    const circumference = 2 * Math.PI * radius;
    
    // Calcular o valor do traço baseado na porcentagem
    const dashoffset = circumference - (percentage / 100) * circumference;
    
    // Criar o SVG
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'circle-progress');
    svg.setAttribute('viewBox', '0 0 100 100');
    
    // Criar o círculo de fundo
    const backgroundCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    backgroundCircle.setAttribute('class', 'circle-progress__background');
    backgroundCircle.setAttribute('cx', '50');
    backgroundCircle.setAttribute('cy', '50');
    backgroundCircle.setAttribute('r', radius);
    
    // Criar o círculo de progresso
    const progressCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    progressCircle.setAttribute('class', `circle-progress__progress circle-progress__progress--${color}`);
    progressCircle.setAttribute('cx', '50');
    progressCircle.setAttribute('cy', '50');
    progressCircle.setAttribute('r', radius);
    progressCircle.style.strokeDasharray = circumference;
    progressCircle.style.strokeDashoffset = dashoffset;
    
    // Adicionar os círculos ao SVG
    svg.appendChild(backgroundCircle);
    svg.appendChild(progressCircle);
    
    // Limpar o container e adicionar o SVG
    container.innerHTML = '';
    container.appendChild(svg);
    
    // Adicionar o texto de porcentagem
    const textElement = document.createElement('div');
    textElement.className = 'circle-progress__text';
    textElement.textContent = `${percentage}%`;
    container.appendChild(textElement);
}
