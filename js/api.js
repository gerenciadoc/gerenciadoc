/**
 * API Client para o Gerenciadoc
 * Centraliza todas as chamadas de API para o backend
 */

class GerenciadocAPI {
    constructor(baseURL = '/api') {
        this.baseURL = baseURL;
        this.token = localStorage.getItem('authToken');
    }

    /**
     * Configura o token de autenticação
     * @param {string} token - Token JWT
     */
    setToken(token) {
        this.token = token;
        localStorage.setItem('authToken', token);
    }

    /**
     * Remove o token de autenticação
     */
    clearToken() {
        this.token = null;
        localStorage.removeItem('authToken');
    }

    /**
     * Verifica se o usuário está autenticado
     * @returns {boolean}
     */
    isAuthenticated() {
        return !!this.token;
    }

    /**
     * Cria os headers para as requisições
     * @param {boolean} isMultipart - Se a requisição é multipart/form-data
     * @returns {Object} - Headers
     */
    getHeaders(isMultipart = false) {
        const headers = {};
        
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        
        if (!isMultipart) {
            headers['Content-Type'] = 'application/json';
        }
        
        return headers;
    }

    /**
     * Faz uma requisição para a API
     * @param {string} endpoint - Endpoint da API
     * @param {string} method - Método HTTP
     * @param {Object|FormData} data - Dados a serem enviados
     * @param {boolean} isMultipart - Se a requisição é multipart/form-data
     * @returns {Promise} - Promise com a resposta
     */
    async request(endpoint, method = 'GET', data = null, isMultipart = false) {
        const url = `${this.baseURL}${endpoint}`;
        const headers = this.getHeaders(isMultipart);
        
        const options = {
            method,
            headers
        };
        
        if (data) {
            if (isMultipart) {
                // Para FormData, não incluir Content-Type (o navegador define automaticamente)
                options.body = data;
            } else {
                options.body = JSON.stringify(data);
            }
        }
        
        try {
            const response = await fetch(url, options);
            
            // Verificar se a resposta é JSON
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                const responseData = await response.json();
                
                if (!response.ok) {
                    throw new Error(responseData.message || 'Erro na requisição');
                }
                
                return responseData;
            } else {
                if (!response.ok) {
                    throw new Error('Erro na requisição');
                }
                
                return await response.text();
            }
        } catch (error) {
            console.error(`Erro na requisição para ${url}:`, error);
            throw error;
        }
    }

    /**
     * Faz login no sistema
     * @param {string} email - Email do usuário
     * @param {string} password - Senha do usuário
     * @returns {Promise} - Promise com os dados do usuário
     */
    async login(email, password) {
        const data = await this.request('/auth/login', 'POST', { email, password });
        
        if (data.token) {
            this.setToken(data.token);
        }
        
        return data;
    }

    /**
     * Faz logout do sistema
     */
    logout() {
        this.clearToken();
    }

    /**
     * Registra um novo usuário
     * @param {Object} userData - Dados do usuário
     * @returns {Promise} - Promise com os dados do usuário
     */
    async register(userData) {
        return await this.request('/auth/register', 'POST', userData);
    }

    /**
     * Busca os dados do usuário logado
     * @returns {Promise} - Promise com os dados do usuário
     */
    async getProfile() {
        return await this.request('/auth/profile');
    }

    /**
     * Busca todas as categorias
     * @returns {Promise} - Promise com as categorias
     */
    async getCategories() {
        return await this.request('/categories');
    }

    /**
     * Busca todos os tipos de documentos
     * @returns {Promise} - Promise com os tipos de documentos
     */
    async getDocumentTypes() {
        return await this.request('/document-types');
    }

    /**
     * Busca documentos com filtros
     * @param {Object} filters - Filtros para a busca
     * @returns {Promise} - Promise com os documentos
     */
    async getDocuments(filters = {}) {
        // Construir query string
        const queryParams = new URLSearchParams();
        for (const [key, value] of Object.entries(filters)) {
            if (value !== undefined && value !== null && value !== '') {
                queryParams.append(key, value);
            }
        }
        
        const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
        return await this.request(`/documents${queryString}`);
    }

    /**
     * Busca um documento específico
     * @param {string} id - ID do documento
     * @returns {Promise} - Promise com o documento
     */
    async getDocument(id) {
        return await this.request(`/documents/${id}`);
    }

    /**
     * Faz upload de um documento
     * @param {FormData} formData - FormData com os dados do documento
     * @returns {Promise} - Promise com o documento criado
     */
    async uploadDocument(formData) {
        return await this.request('/documents/upload', 'POST', formData, true);
    }

    /**
     * Faz upload de múltiplos documentos
     * @param {FormData} formData - FormData com os documentos
     * @returns {Promise} - Promise com os documentos criados
     */
    async uploadMultipleDocuments(formData) {
        return await this.request('/documents/upload/batch', 'POST', formData, true);
    }

    /**
     * Extrai dados de um documento
     * @param {FormData} formData - FormData com o arquivo
     * @returns {Promise} - Promise com os dados extraídos
     */
    async extractDocumentData(formData) {
        return await this.request('/documents/extract', 'POST', formData, true);
    }

    /**
     * Atualiza um documento
     * @param {string} id - ID do documento
     * @param {Object} documentData - Dados do documento
     * @returns {Promise} - Promise com o documento atualizado
     */
    async updateDocument(id, documentData) {
        return await this.request(`/documents/${id}`, 'PUT', documentData);
    }

    /**
     * Exclui um documento
     * @param {string} id - ID do documento
     * @returns {Promise} - Promise com a resposta
     */
    async deleteDocument(id) {
        return await this.request(`/documents/${id}`, 'DELETE');
    }

    /**
     * Aprova um documento
     * @param {string} id - ID do documento
     * @returns {Promise} - Promise com o documento aprovado
     */
    async approveDocument(id) {
        return await this.request(`/documents/${id}/approve`, 'PATCH');
    }

    /**
     * Rejeita um documento
     * @param {string} id - ID do documento
     * @returns {Promise} - Promise com a resposta
     */
    async rejectDocument(id) {
        return await this.request(`/documents/${id}/reject`, 'PATCH');
    }

    /**
     * Adiciona uma anotação a um documento
     * @param {string} id - ID do documento
     * @param {Object} annotation - Dados da anotação
     * @returns {Promise} - Promise com a anotação criada
     */
    async addAnnotation(id, annotation) {
        return await this.request(`/documents/${id}/annotations`, 'POST', annotation);
    }

    /**
     * Remove uma anotação de um documento
     * @param {string} documentId - ID do documento
     * @param {string} annotationId - ID da anotação
     * @returns {Promise} - Promise com a resposta
     */
    async removeAnnotation(documentId, annotationId) {
        return await this.request(`/documents/${documentId}/annotations/${annotationId}`, 'DELETE');
    }

    /**
     * Cria um link para colaborador
     * @param {Object} linkData - Dados do link
     * @returns {Promise} - Promise com o link criado
     */
    async createCollaboratorLink(linkData) {
        return await this.request('/collaborator/links', 'POST', linkData);
    }

    /**
     * Busca links de colaboradores
     * @param {Object} filters - Filtros para a busca
     * @returns {Promise} - Promise com os links
     */
    async getCollaboratorLinks(filters = {}) {
        // Construir query string
        const queryParams = new URLSearchParams();
        for (const [key, value] of Object.entries(filters)) {
            if (value !== undefined && value !== null && value !== '') {
                queryParams.append(key, value);
            }
        }
        
        const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
        return await this.request(`/collaborator/links${queryString}`);
    }

    /**
     * Busca um link específico
     * @param {string} id - ID do link
     * @returns {Promise} - Promise com o link
     */
    async getCollaboratorLink(id) {
        return await this.request(`/collaborator/links/${id}`);
    }

    /**
     * Desativa um link
     * @param {string} id - ID do link
     * @returns {Promise} - Promise com o link desativado
     */
    async deactivateCollaboratorLink(id) {
        return await this.request(`/collaborator/links/${id}/deactivate`, 'PATCH');
    }

    /**
     * Verifica a validade de um token de colaborador
     * @param {string} token - Token do link
     * @returns {Promise} - Promise com os dados do link
     */
    async verifyCollaboratorToken(token) {
        return await this.request(`/colaborador/verify/${token}`);
    }

    /**
     * Faz upload de um documento como colaborador
     * @param {string} token - Token do link
     * @param {FormData} formData - FormData com os dados do documento
     * @returns {Promise} - Promise com o documento criado
     */
    async uploadDocumentAsCollaborator(token, formData) {
        return await this.request(`/colaborador/upload/${token}`, 'POST', formData, true);
    }
}

// Exportar instância única
const api = new GerenciadocAPI();
