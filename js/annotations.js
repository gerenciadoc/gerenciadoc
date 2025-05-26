/**
 * Módulo de Anotações para Documentos - Gerenciadoc
 * Permite adicionar, editar e excluir anotações em documentos
 */

class DocumentAnnotations {
    constructor(containerId, documentId, fileUrl, readOnly = false) {
        this.container = document.getElementById(containerId);
        this.documentId = documentId;
        this.fileUrl = fileUrl;
        this.readOnly = readOnly;
        this.annotations = [];
        this.currentAnnotation = null;
        this.annotationCounter = 0;
        this.pdfDocument = null;
        this.currentPage = 1;
        this.totalPages = 0;
        this.scale = 1.0;
        
        // Inicializar
        this.init();
    }
    
    /**
     * Inicializa o visualizador de documentos com anotações
     */
    async init() {
        if (!this.container) {
            console.error('Container não encontrado');
            return;
        }
        
        // Criar estrutura básica
        this.createLayout();
        
        // Carregar documento
        await this.loadDocument();
        
        // Carregar anotações existentes
        await this.loadAnnotations();
        
        // Configurar eventos
        this.setupEvents();
    }
    
    /**
     * Cria a estrutura básica do visualizador
     */
    createLayout() {
        this.container.innerHTML = `
            <div class="document-viewer-container">
                <div class="document-toolbar">
                    <div class="document-navigation">
                        <button class="btn btn-sm btn-outline-secondary" id="prevPage" title="Página anterior">
                            <i class="bi bi-chevron-left"></i>
                        </button>
                        <span class="mx-2">
                            Página <span id="currentPage">1</span> de <span id="totalPages">1</span>
                        </span>
                        <button class="btn btn-sm btn-outline-secondary" id="nextPage" title="Próxima página">
                            <i class="bi bi-chevron-right"></i>
                        </button>
                    </div>
                    <div class="document-zoom">
                        <button class="btn btn-sm btn-outline-secondary" id="zoomOut" title="Diminuir zoom">
                            <i class="bi bi-zoom-out"></i>
                        </button>
                        <span class="mx-2" id="zoomLevel">100%</span>
                        <button class="btn btn-sm btn-outline-secondary" id="zoomIn" title="Aumentar zoom">
                            <i class="bi bi-zoom-in"></i>
                        </button>
                    </div>
                    ${!this.readOnly ? `
                        <div class="document-annotation-tools">
                            <button class="btn btn-sm btn-primary" id="addAnnotation" title="Adicionar anotação">
                                <i class="bi bi-plus-circle"></i> Adicionar anotação
                            </button>
                        </div>
                    ` : ''}
                </div>
                <div class="document-content-container">
                    <div class="document-content" id="documentContent">
                        <!-- O conteúdo do documento será renderizado aqui -->
                    </div>
                    <div class="document-annotations-panel" id="annotationsPanel">
                        <h6 class="annotations-panel-title">Anotações</h6>
                        <div class="annotations-list" id="annotationsList">
                            <!-- Lista de anotações será renderizada aqui -->
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Carrega o documento PDF
     */
    async loadDocument() {
        try {
            const documentContent = document.getElementById('documentContent');
            
            // Verificar extensão do arquivo
            const fileExtension = this.fileUrl.split('.').pop().toLowerCase();
            
            if (fileExtension === 'pdf') {
                // Carregar PDF usando PDF.js
                const loadingTask = pdfjsLib.getDocument(this.fileUrl);
                this.pdfDocument = await loadingTask.promise;
                this.totalPages = this.pdfDocument.numPages;
                
                // Atualizar contador de páginas
                document.getElementById('totalPages').textContent = this.totalPages;
                
                // Renderizar primeira página
                await this.renderPage(1);
            } else if (['jpg', 'jpeg', 'png', 'gif'].includes(fileExtension)) {
                // Renderizar imagem
                documentContent.innerHTML = `
                    <div class="document-page">
                        <img src="${this.fileUrl}" class="document-image" alt="Documento">
                    </div>
                `;
                this.totalPages = 1;
                document.getElementById('totalPages').textContent = '1';
                
                // Desabilitar navegação
                document.getElementById('prevPage').disabled = true;
                document.getElementById('nextPage').disabled = true;
            } else {
                // Outros formatos: exibir iframe
                documentContent.innerHTML = `
                    <div class="document-page">
                        <iframe src="${this.fileUrl}" class="document-iframe" frameborder="0"></iframe>
                    </div>
                `;
                this.totalPages = 1;
                document.getElementById('totalPages').textContent = '1';
                
                // Desabilitar navegação
                document.getElementById('prevPage').disabled = true;
                document.getElementById('nextPage').disabled = true;
            }
        } catch (error) {
            console.error('Erro ao carregar documento:', error);
            document.getElementById('documentContent').innerHTML = `
                <div class="alert alert-danger">
                    Erro ao carregar o documento. Por favor, tente novamente mais tarde.
                </div>
            `;
        }
    }
    
    /**
     * Renderiza uma página específica do PDF
     * @param {number} pageNumber - Número da página
     */
    async renderPage(pageNumber) {
        if (!this.pdfDocument) return;
        
        try {
            // Validar número da página
            pageNumber = Math.max(1, Math.min(pageNumber, this.totalPages));
            this.currentPage = pageNumber;
            
            // Atualizar contador
            document.getElementById('currentPage').textContent = pageNumber;
            
            // Habilitar/desabilitar botões de navegação
            document.getElementById('prevPage').disabled = pageNumber <= 1;
            document.getElementById('nextPage').disabled = pageNumber >= this.totalPages;
            
            // Obter página do PDF
            const page = await this.pdfDocument.getPage(pageNumber);
            
            // Calcular escala para ajustar à largura do container
            const viewport = page.getViewport({ scale: this.scale });
            
            // Criar canvas
            const documentContent = document.getElementById('documentContent');
            documentContent.innerHTML = '';
            
            const pageContainer = document.createElement('div');
            pageContainer.className = 'document-page';
            documentContent.appendChild(pageContainer);
            
            const canvas = document.createElement('canvas');
            pageContainer.appendChild(canvas);
            
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            
            // Renderizar PDF no canvas
            const renderContext = {
                canvasContext: context,
                viewport: viewport
            };
            
            await page.render(renderContext).promise;
            
            // Renderizar anotações desta página
            this.renderPageAnnotations(pageNumber);
        } catch (error) {
            console.error('Erro ao renderizar página:', error);
        }
    }
    
    /**
     * Carrega anotações existentes do servidor
     */
    async loadAnnotations() {
        try {
            // Buscar anotações do servidor
            const response = await api.getDocumentAnnotations(this.documentId);
            
            if (response.success) {
                this.annotations = response.annotations;
                
                // Atualizar contador
                this.annotationCounter = this.annotations.length;
                
                // Renderizar anotações da página atual
                this.renderPageAnnotations(this.currentPage);
                
                // Atualizar lista de anotações
                this.updateAnnotationsList();
            }
        } catch (error) {
            console.error('Erro ao carregar anotações:', error);
        }
    }
    
    /**
     * Renderiza as anotações de uma página específica
     * @param {number} pageNumber - Número da página
     */
    renderPageAnnotations(pageNumber) {
        const pageContainer = document.querySelector('.document-page');
        if (!pageContainer) return;
        
        // Remover anotações existentes
        const existingAnnotations = pageContainer.querySelectorAll('.annotation-marker');
        existingAnnotations.forEach(annotation => annotation.remove());
        
        // Filtrar anotações da página atual
        const pageAnnotations = this.annotations.filter(annotation => annotation.page === pageNumber);
        
        // Adicionar marcadores de anotação
        pageAnnotations.forEach(annotation => {
            const marker = document.createElement('div');
            marker.className = 'annotation-marker';
            marker.dataset.id = annotation.id;
            marker.textContent = annotation.number;
            
            // Posicionar marcador
            marker.style.left = `${annotation.x}%`;
            marker.style.top = `${annotation.y}%`;
            
            // Adicionar evento de clique
            marker.addEventListener('click', () => this.showAnnotationDetails(annotation.id));
            
            // Adicionar ao container
            pageContainer.appendChild(marker);
        });
    }
    
    /**
     * Atualiza a lista de anotações no painel lateral
     */
    updateAnnotationsList() {
        const annotationsList = document.getElementById('annotationsList');
        if (!annotationsList) return;
        
        // Limpar lista
        annotationsList.innerHTML = '';
        
        if (this.annotations.length === 0) {
            annotationsList.innerHTML = `
                <div class="text-center py-3 text-muted">
                    Nenhuma anotação encontrada
                </div>
            `;
            return;
        }
        
        // Ordenar anotações por número
        const sortedAnnotations = [...this.annotations].sort((a, b) => a.number - b.number);
        
        // Adicionar cada anotação à lista
        sortedAnnotations.forEach(annotation => {
            const item = document.createElement('div');
            item.className = 'annotation-item';
            item.dataset.id = annotation.id;
            
            item.innerHTML = `
                <div class="annotation-header">
                    <div class="annotation-number">${annotation.number}</div>
                    <div class="annotation-page">Página ${annotation.page}</div>
                </div>
                <div class="annotation-content">${annotation.text}</div>
                <div class="annotation-footer">
                    <div class="annotation-author">${annotation.author}</div>
                    <div class="annotation-date">${new Date(annotation.createdAt).toLocaleDateString('pt-BR')}</div>
                </div>
                ${!this.readOnly ? `
                    <div class="annotation-actions">
                        <button class="btn btn-sm btn-link edit-annotation" data-id="${annotation.id}">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-sm btn-link delete-annotation" data-id="${annotation.id}">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                ` : ''}
            `;
            
            // Adicionar evento de clique para navegar até a anotação
            item.addEventListener('click', () => {
                // Navegar para a página da anotação
                if (annotation.page !== this.currentPage) {
                    this.renderPage(annotation.page);
                }
                
                // Destacar a anotação
                this.highlightAnnotation(annotation.id);
            });
            
            // Adicionar eventos para botões de edição e exclusão
            if (!this.readOnly) {
                const editButton = item.querySelector('.edit-annotation');
                if (editButton) {
                    editButton.addEventListener('click', (e) => {
                        e.stopPropagation();
                        this.editAnnotation(annotation.id);
                    });
                }
                
                const deleteButton = item.querySelector('.delete-annotation');
                if (deleteButton) {
                    deleteButton.addEventListener('click', (e) => {
                        e.stopPropagation();
                        this.confirmDeleteAnnotation(annotation.id);
                    });
                }
            }
            
            annotationsList.appendChild(item);
        });
    }
    
    /**
     * Destaca uma anotação específica
     * @param {string} annotationId - ID da anotação
     */
    highlightAnnotation(annotationId) {
        // Remover destaque de todas as anotações
        document.querySelectorAll('.annotation-marker.highlighted').forEach(marker => {
            marker.classList.remove('highlighted');
        });
        
        document.querySelectorAll('.annotation-item.highlighted').forEach(item => {
            item.classList.remove('highlighted');
        });
        
        // Adicionar destaque à anotação selecionada
        const marker = document.querySelector(`.annotation-marker[data-id="${annotationId}"]`);
        if (marker) {
            marker.classList.add('highlighted');
            
            // Rolar para a anotação
            marker.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        
        const item = document.querySelector(`.annotation-item[data-id="${annotationId}"]`);
        if (item) {
            item.classList.add('highlighted');
            
            // Rolar para o item na lista
            item.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
    
    /**
     * Mostra detalhes de uma anotação
     * @param {string} annotationId - ID da anotação
     */
    showAnnotationDetails(annotationId) {
        const annotation = this.annotations.find(a => a.id === annotationId);
        if (!annotation) return;
        
        // Destacar anotação
        this.highlightAnnotation(annotationId);
        
        // Mostrar tooltip com detalhes
        const marker = document.querySelector(`.annotation-marker[data-id="${annotationId}"]`);
        if (!marker) return;
        
        // Remover tooltips existentes
        document.querySelectorAll('.annotation-tooltip').forEach(tooltip => tooltip.remove());
        
        // Criar tooltip
        const tooltip = document.createElement('div');
        tooltip.className = 'annotation-tooltip';
        tooltip.innerHTML = `
            <div class="annotation-tooltip-header">
                <div class="annotation-tooltip-title">Anotação #${annotation.number}</div>
                <button class="btn-close btn-sm" id="closeTooltip"></button>
            </div>
            <div class="annotation-tooltip-content">${annotation.text}</div>
            <div class="annotation-tooltip-footer">
                <div class="annotation-tooltip-author">${annotation.author}</div>
                <div class="annotation-tooltip-date">${new Date(annotation.createdAt).toLocaleDateString('pt-BR')}</div>
            </div>
        `;
        
        // Posicionar tooltip
        const pageContainer = document.querySelector('.document-page');
        pageContainer.appendChild(tooltip);
        
        // Calcular posição
        const markerRect = marker.getBoundingClientRect();
        const containerRect = pageContainer.getBoundingClientRect();
        
        let left = markerRect.left - containerRect.left + markerRect.width + 10;
        let top = markerRect.top - containerRect.top;
        
        // Ajustar se estiver fora dos limites
        const tooltipRect = tooltip.getBoundingClientRect();
        if (left + tooltipRect.width > containerRect.width) {
            left = markerRect.left - containerRect.left - tooltipRect.width - 10;
        }
        
        tooltip.style.left = `${left}px`;
        tooltip.style.top = `${top}px`;
        
        // Adicionar evento para fechar tooltip
        const closeButton = tooltip.querySelector('#closeTooltip');
        closeButton.addEventListener('click', () => {
            tooltip.remove();
        });
        
        // Fechar ao clicar fora
        document.addEventListener('click', function closeTooltip(e) {
            if (!tooltip.contains(e.target) && e.target !== marker) {
                tooltip.remove();
                document.removeEventListener('click', closeTooltip);
            }
        });
    }
    
    /**
     * Inicia o processo de adicionar uma nova anotação
     */
    startAddAnnotation() {
        // Verificar se já está em modo de adição
        if (this.currentAnnotation) return;
        
        // Ativar modo de adição
        this.currentAnnotation = {
            page: this.currentPage,
            number: this.annotationCounter + 1
        };
        
        // Alterar cursor
        document.getElementById('documentContent').classList.add('annotation-mode');
        
        // Mostrar mensagem
        showNotification('Clique no documento para posicionar a anotação', 'info');
    }
    
    /**
     * Posiciona uma nova anotação no documento
     * @param {MouseEvent} event - Evento de clique
     */
    positionAnnotation(event) {
        if (!this.currentAnnotation) return;
        
        const pageContainer = document.querySelector('.document-page');
        if (!pageContainer) return;
        
        // Calcular posição relativa
        const rect = pageContainer.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * 100;
        const y = ((event.clientY - rect.top) / rect.height) * 100;
        
        // Atualizar anotação
        this.currentAnnotation.x = x;
        this.currentAnnotation.y = y;
        
        // Mostrar modal para adicionar texto
        this.showAnnotationModal();
    }
    
    /**
     * Mostra modal para adicionar ou editar texto da anotação
     */
    showAnnotationModal() {
        // Criar modal se não existir
        if (!document.getElementById('annotationModal')) {
            const modalHTML = `
                <div class="modal fade" id="annotationModal" tabindex="-1" aria-labelledby="annotationModalLabel" aria-hidden="true">
                    <div class="modal-dialog">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title" id="annotationModalLabel">Adicionar Anotação</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fechar"></button>
                            </div>
                            <div class="modal-body">
                                <form id="annotationForm">
                                    <div class="mb-3">
                                        <label for="annotationText" class="form-label">Texto da anotação</label>
                                        <textarea class="form-control" id="annotationText" rows="4" required></textarea>
                                    </div>
                                </form>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancelar</button>
                                <button type="button" class="btn btn-primary" id="saveAnnotation">Salvar</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.insertAdjacentHTML('beforeend', modalHTML);
            
            // Configurar evento de salvar
            document.getElementById('saveAnnotation').addEventListener('click', () => {
                const text = document.getElementById('annotationText').value.trim();
                if (text) {
                    this.saveAnnotation(text);
                    bootstrap.Modal.getInstance(document.getElementById('annotationModal')).hide();
                }
            });
        }
        
        // Atualizar título do modal
        const isEditing = this.currentAnnotation.id !== undefined;
        document.getElementById('annotationModalLabel').textContent = isEditing ? 'Editar Anotação' : 'Adicionar Anotação';
        
        // Preencher texto se estiver editando
        if (isEditing) {
            const annotation = this.annotations.find(a => a.id === this.currentAnnotation.id);
            if (annotation) {
                document.getElementById('annotationText').value = annotation.text;
            }
        } else {
            document.getElementById('annotationText').value = '';
        }
        
        // Mostrar modal
        const modal = new bootstrap.Modal(document.getElementById('annotationModal'));
        modal.show();
        
        // Focar no campo de texto
        document.getElementById('annotationText').focus();
    }
    
    /**
     * Salva uma anotação no servidor
     * @param {string} text - Texto da anotação
     */
    async saveAnnotation(text) {
        if (!this.currentAnnotation) return;
        
        try {
            showLoader();
            
            const annotationData = {
                ...this.currentAnnotation,
                text,
                documentId: this.documentId
            };
            
            let response;
            
            if (annotationData.id) {
                // Atualizar anotação existente
                response = await api.updateAnnotation(this.documentId, annotationData.id, {
                    text: annotationData.text
                });
                
                if (response.success) {
                    // Atualizar anotação na lista
                    const index = this.annotations.findIndex(a => a.id === annotationData.id);
                    if (index !== -1) {
                        this.annotations[index] = {
                            ...this.annotations[index],
                            text: annotationData.text,
                            updatedAt: new Date().toISOString()
                        };
                    }
                    
                    showNotification('Anotação atualizada com sucesso!', 'success');
                }
            } else {
                // Criar nova anotação
                response = await api.addAnnotation(this.documentId, {
                    page: annotationData.page,
                    x: annotationData.x,
                    y: annotationData.y,
                    text: annotationData.text
                });
                
                if (response.success) {
                    // Adicionar à lista
                    this.annotations.push({
                        ...response.annotation,
                        number: this.annotationCounter + 1
                    });
                    
                    // Incrementar contador
                    this.annotationCounter++;
                    
                    showNotification('Anotação adicionada com sucesso!', 'success');
                }
            }
            
            // Limpar anotação atual
            this.currentAnnotation = null;
            
            // Desativar modo de adição
            document.getElementById('documentContent').classList.remove('annotation-mode');
            
            // Atualizar visualização
            this.renderPageAnnotations(this.currentPage);
            this.updateAnnotationsList();
            
            hideLoader();
        } catch (error) {
            console.error('Erro ao salvar anotação:', error);
            showNotification('Erro ao salvar anotação', 'danger');
            hideLoader();
        }
    }
    
    /**
     * Inicia o processo de edição de uma anotação
     * @param {string} annotationId - ID da anotação
     */
    editAnnotation(annotationId) {
        const annotation = this.annotations.find(a => a.id === annotationId);
        if (!annotation) return;
        
        // Configurar anotação atual
        this.currentAnnotation = {
            id: annotation.id,
            page: annotation.page,
            x: annotation.x,
            y: annotation.y,
            number: annotation.number
        };
        
        // Mostrar modal
        this.showAnnotationModal();
    }
    
    /**
     * Confirma a exclusão de uma anotação
     * @param {string} annotationId - ID da anotação
     */
    confirmDeleteAnnotation(annotationId) {
        const annotation = this.annotations.find(a => a.id === annotationId);
        if (!annotation) return;
        
        // Criar modal se não existir
        if (!document.getElementById('deleteAnnotationModal')) {
            const modalHTML = `
                <div class="modal fade" id="deleteAnnotationModal" tabindex="-1" aria-labelledby="deleteAnnotationModalLabel" aria-hidden="true">
                    <div class="modal-dialog">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title" id="deleteAnnotationModalLabel">Confirmar exclusão</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fechar"></button>
                            </div>
                            <div class="modal-body">
                                <p>Tem certeza que deseja excluir esta anotação?</p>
                                <p class="text-danger">Esta ação não pode ser desfeita.</p>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancelar</button>
                                <button type="button" class="btn btn-danger" id="confirmDeleteAnnotation">Excluir</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.insertAdjacentHTML('beforeend', modalHTML);
        }
        
        // Configurar evento de confirmação
        const confirmButton = document.getElementById('confirmDeleteAnnotation');
        confirmButton.onclick = () => {
            this.deleteAnnotation(annotationId);
            bootstrap.Modal.getInstance(document.getElementById('deleteAnnotationModal')).hide();
        };
        
        // Mostrar modal
        const modal = new bootstrap.Modal(document.getElementById('deleteAnnotationModal'));
        modal.show();
    }
    
    /**
     * Exclui uma anotação
     * @param {string} annotationId - ID da anotação
     */
    async deleteAnnotation(annotationId) {
        try {
            showLoader();
            
            const response = await api.removeAnnotation(this.documentId, annotationId);
            
            if (response.success) {
                // Remover da lista
                this.annotations = this.annotations.filter(a => a.id !== annotationId);
                
                // Atualizar visualização
                this.renderPageAnnotations(this.currentPage);
                this.updateAnnotationsList();
                
                showNotification('Anotação excluída com sucesso!', 'success');
            }
            
            hideLoader();
        } catch (error) {
            console.error('Erro ao excluir anotação:', error);
            showNotification('Erro ao excluir anotação', 'danger');
            hideLoader();
        }
    }
    
    /**
     * Configura eventos do visualizador
     */
    setupEvents() {
        // Navegação de páginas
        const prevPageButton = document.getElementById('prevPage');
        if (prevPageButton) {
            prevPageButton.addEventListener('click', () => {
                if (this.currentPage > 1) {
                    this.renderPage(this.currentPage - 1);
                }
            });
        }
        
        const nextPageButton = document.getElementById('nextPage');
        if (nextPageButton) {
            nextPageButton.addEventListener('click', () => {
                if (this.currentPage < this.totalPages) {
                    this.renderPage(this.currentPage + 1);
                }
            });
        }
        
        // Zoom
        const zoomInButton = document.getElementById('zoomIn');
        if (zoomInButton) {
            zoomInButton.addEventListener('click', () => {
                this.scale = Math.min(this.scale + 0.25, 3.0);
                document.getElementById('zoomLevel').textContent = `${Math.round(this.scale * 100)}%`;
                this.renderPage(this.currentPage);
            });
        }
        
        const zoomOutButton = document.getElementById('zoomOut');
        if (zoomOutButton) {
            zoomOutButton.addEventListener('click', () => {
                this.scale = Math.max(this.scale - 0.25, 0.5);
                document.getElementById('zoomLevel').textContent = `${Math.round(this.scale * 100)}%`;
                this.renderPage(this.currentPage);
            });
        }
        
        // Adicionar anotação
        if (!this.readOnly) {
            const addAnnotationButton = document.getElementById('addAnnotation');
            if (addAnnotationButton) {
                addAnnotationButton.addEventListener('click', () => {
                    this.startAddAnnotation();
                });
            }
            
            // Clicar no documento para posicionar anotação
            const documentContent = document.getElementById('documentContent');
            documentContent.addEventListener('click', (e) => {
                if (this.currentAnnotation && !this.currentAnnotation.id) {
                    this.positionAnnotation(e);
                }
            });
        }
        
        // Teclas de atalho
        document.addEventListener('keydown', (e) => {
            // Cancelar adição de anotação com ESC
            if (e.key === 'Escape' && this.currentAnnotation && !this.currentAnnotation.id) {
                this.currentAnnotation = null;
                document.getElementById('documentContent').classList.remove('annotation-mode');
                showNotification('Adição de anotação cancelada', 'info');
            }
            
            // Navegação com setas
            if (e.key === 'ArrowLeft' && this.currentPage > 1) {
                this.renderPage(this.currentPage - 1);
            } else if (e.key === 'ArrowRight' && this.currentPage < this.totalPages) {
                this.renderPage(this.currentPage + 1);
            }
        });
    }
}

// Exportar classe
window.DocumentAnnotations = DocumentAnnotations;
