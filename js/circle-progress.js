/**
 * Gerenciadoc - Funcionalidade de gráficos circulares de progresso
 * Data: 27 de Maio de 2025
 */

document.addEventListener('DOMContentLoaded', function() {
    // Inicializar todos os gráficos circulares na página
    initializeCircleProgress();
});

/**
 * Inicializa todos os gráficos circulares na página
 */
function initializeCircleProgress() {
    const containers = document.querySelectorAll('.circle-progress-container');
    
    containers.forEach(container => {
        const percentage = parseInt(container.getAttribute('data-percentage') || '0');
        const color = container.getAttribute('data-color') || 'primary';
        
        createCircleProgress(container, percentage, color);
    });
}

/**
 * Cria um gráfico circular SVG com a porcentagem especificada
 * @param {HTMLElement} container - Elemento container do gráfico
 * @param {number} percentage - Porcentagem de preenchimento (0-100)
 * @param {string} color - Cor do gráfico (primary, success, warning, danger)
 */
function createCircleProgress(container, percentage, color) {
    // Limpar o container
    container.innerHTML = '';
    
    // Criar o SVG
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'circle-progress');
    svg.setAttribute('viewBox', '0 0 100 100');
    
    // Calcular o raio e a circunferência
    const radius = 45;
    const circumference = 2 * Math.PI * radius;
    
    // Criar o círculo de fundo
    const backgroundCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    backgroundCircle.setAttribute('class', 'circle-progress__background');
    backgroundCircle.setAttribute('cx', '50');
    backgroundCircle.setAttribute('cy', '50');
    backgroundCircle.setAttribute('r', radius.toString());
    
    // Criar o círculo de progresso
    const progressCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    progressCircle.setAttribute('class', `circle-progress__progress circle-progress__progress--${color}`);
    progressCircle.setAttribute('cx', '50');
    progressCircle.setAttribute('cy', '50');
    progressCircle.setAttribute('r', radius.toString());
    
    // Calcular o offset do traço para a porcentagem
    const dashOffset = circumference - (percentage / 100) * circumference;
    progressCircle.style.strokeDasharray = circumference;
    progressCircle.style.strokeDashoffset = dashOffset;
    
    // Adicionar os círculos ao SVG
    svg.appendChild(backgroundCircle);
    svg.appendChild(progressCircle);
    
    // Adicionar o SVG ao container
    container.appendChild(svg);
    
    // Adicionar o texto de porcentagem
    const textElement = document.createElement('div');
    textElement.setAttribute('class', 'circle-progress__text');
    textElement.textContent = `${percentage}%`;
    container.appendChild(textElement);
}

/**
 * Atualiza a porcentagem de um gráfico circular existente
 * @param {HTMLElement} container - Elemento container do gráfico
 * @param {number} percentage - Nova porcentagem (0-100)
 */
function updateCircleProgress(container, percentage) {
    const progressCircle = container.querySelector('.circle-progress__progress');
    const textElement = container.querySelector('.circle-progress__text');
    
    if (!progressCircle || !textElement) return;
    
    // Calcular o raio e a circunferência
    const radius = 45;
    const circumference = 2 * Math.PI * radius;
    
    // Calcular o novo offset do traço
    const dashOffset = circumference - (percentage / 100) * circumference;
    progressCircle.style.strokeDasharray = circumference;
    progressCircle.style.strokeDashoffset = dashOffset;
    
    // Atualizar o texto
    textElement.textContent = `${percentage}%`;
    
    // Atualizar o atributo data-percentage
    container.setAttribute('data-percentage', percentage.toString());
}
