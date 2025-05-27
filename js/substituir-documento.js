/**
 * Gerenciadoc - Funcionalidade de Substituição de Documentos
 * Data: 27 de Maio de 2025
 */

document.addEventListener('DOMContentLoaded', function() {
    // Criar o modal de substituição de documento se não existir
    createSubstituirDocumentoModal();
    
    // Adicionar botão de substituir a todas as linhas da tabela de documentos
    addSubstituirButtons();
});

/**
 * Cria o modal para substituição de documentos
 */
function createSubstituirDocumentoModal() {
    // Verificar se o modal já existe
    if (document.getElementById('substituirDocumentoModal')) {
        return;
    }
    
    // Criar o modal
    const modalHTML = `
    <div class="modal fade" id="substituirDocumentoModal" tabindex="-1" aria-labelledby="substituirDocumentoModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="substituirDocumentoModalLabel">Substituir Documento</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fechar"></button>
                </div>
                <div class="modal-body">
                    <p class="text-muted mb-4">Faça o upload de uma nova versão para substituir o documento atual.</p>
                    
                    <div class="mb-3">
                        <label for="documentoAtual" class="form-label">Documento a ser substituído</label>
                        <input type="text" class="form-control" id="documentoAtual" readonly>
                    </div>
                    
                    <div class="mb-3">
                        <label for="novaValidade" class="form-label">Nova data de validade</label>
                        <input type="date" class="form-control" id="novaValidade">
                    </div>
                    
                    <div class="mb-3">
                        <label for="arquivoSubstituicao" class="form-label">Novo arquivo</label>
                        <input type="file" class="form-control" id="arquivoSubstituicao" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png">
                        <div class="form-text">Formatos aceitos: PDF, DOC, DOCX, JPG, JPEG, PNG</div>
                    </div>
                    
                    <div class="mb-3">
                        <label for="observacaoSubstituicao" class="form-label">Observação (opcional)</label>
                        <textarea class="form-control" id="observacaoSubstituicao" rows="3"></textarea>
                    </div>
                    
                    <div class="alert alert-info">
                        <i class="fas fa-info-circle me-2"></i> A versão anterior do documento será mantida no histórico.
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancelar</button>
                    <button type="button" class="btn btn-primary" id="btnConfirmarSubstituicao">Substituir Documento</button>
                </div>
            </div>
        </div>
    </div>
    `;
    
    // Adicionar o modal ao DOM
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Adicionar evento ao botão de confirmar substituição
    document.getElementById('btnConfirmarSubstituicao').addEventListener('click', function() {
        substituirDocumento();
    });
}

/**
 * Adiciona botões de substituir a todas as linhas da tabela de documentos
 */
function addSubstituirButtons() {
    const rows = document.querySelectorAll('table tbody tr');
    
    rows.forEach(row => {
        const actionsCell = row.querySelector('td:last-child');
        const downloadButton = actionsCell.querySelector('[title="Baixar"]');
        
        // Verificar se já existe o botão de substituir
        if (!actionsCell.querySelector('[title="Substituir"]')) {
            // Criar botão de substituir
            const substituirButton = document.createElement('button');
            substituirButton.className = 'action-button';
            substituirButton.title = 'Substituir';
            substituirButton.setAttribute('data-bs-toggle', 'modal');
            substituirButton.setAttribute('data-bs-target', '#substituirDocumentoModal');
            substituirButton.innerHTML = '<i class="fas fa-sync-alt"></i>';
            
            // Inserir após o botão de download
            if (downloadButton) {
                downloadButton.insertAdjacentElement('afterend', substituirButton);
            } else {
                actionsCell.appendChild(substituirButton);
            }
            
            // Adicionar evento para preencher o nome do documento no modal
            substituirButton.addEventListener('click', function() {
                const documentoNome = row.querySelector('td:first-child').textContent;
                document.getElementById('documentoAtual').value = documentoNome;
            });
        }
    });
}

/**
 * Processa a substituição do documento
 */
function substituirDocumento() {
    const documentoAtual = document.getElementById('documentoAtual').value;
    const novaValidade = document.getElementById('novaValidade').value;
    const arquivoSubstituicao = document.getElementById('arquivoSubstituicao');
    
    // Validar campos obrigatórios
    if (!novaValidade) {
        alert('Por favor, informe a nova data de validade.');
        return;
    }
    
    if (!arquivoSubstituicao.files || arquivoSubstituicao.files.length === 0) {
        alert('Por favor, selecione um arquivo para substituição.');
        return;
    }
    
    // Simulação de substituição (em produção, isso seria uma chamada AJAX)
    // Mostrar feedback de sucesso
    alert(`Documento "${documentoAtual}" substituído com sucesso!`);
    
    // Atualizar a interface
    const rows = document.querySelectorAll('table tbody tr');
    rows.forEach(row => {
        const documentoNome = row.querySelector('td:first-child').textContent;
        if (documentoNome === documentoAtual) {
            // Atualizar a data de validade
            const validadeCell = row.querySelector('td:nth-child(4)');
            if (validadeCell) {
                const dataFormatada = formatarData(novaValidade);
                validadeCell.textContent = dataFormatada;
            }
            
            // Atualizar o status para "Válido"
            const statusCell = row.querySelector('td:nth-child(3)');
            if (statusCell) {
                statusCell.innerHTML = '<span class="status-badge status-valid">Válido</span>';
            }
        }
    });
    
    // Fechar o modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('substituirDocumentoModal'));
    modal.hide();
    
    // Limpar o formulário
    document.getElementById('novaValidade').value = '';
    document.getElementById('arquivoSubstituicao').value = '';
    document.getElementById('observacaoSubstituicao').value = '';
}

/**
 * Formata a data no padrão brasileiro
 */
function formatarData(dataISO) {
    const data = new Date(dataISO);
    const dia = String(data.getDate()).padStart(2, '0');
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const ano = data.getFullYear();
    
    return `${dia}/${mes}/${ano}`;
}
