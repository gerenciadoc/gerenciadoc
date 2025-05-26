const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');
const mammoth = require('mammoth');
const xlsx = require('xlsx');
const { createWorker } = require('tesseract.js');

/**
 * Extrai dados automaticamente de documentos
 * @param {string} filePath - Caminho do arquivo a ser processado
 * @returns {Object} - Dados extraídos do documento
 */
async function extractDocumentData(filePath) {
    try {
        // Identificar tipo de arquivo
        const fileType = identifyFileType(filePath);
        
        // Extrair texto baseado no tipo
        let text;
        switch (fileType) {
            case 'pdf':
                text = await extractPdfText(filePath);
                break;
            case 'docx':
                text = await extractDocxText(filePath);
                break;
            case 'xlsx':
                text = await extractXlsxData(filePath);
                break;
            case 'image':
                text = await performOCR(filePath);
                break;
            default:
                throw new Error('Tipo de arquivo não suportado');
        }
        
        // Classificar documento
        const documentType = classifyDocument(text);
        
        // Extrair metadados específicos
        const metadata = extractMetadata(text, documentType);
        
        // Validar e atribuir confiança
        const validatedMetadata = validateMetadata(metadata, documentType);
        
        return {
            name: extractDocumentName(text, path.basename(filePath)),
            description: extractDescription(text),
            type: documentType,
            categoryId: mapTypeToCategory(documentType),
            issueDate: validatedMetadata.issueDate,
            expirationDate: validatedMetadata.expirationDate,
            metadata: validatedMetadata,
            tags: generateTags(text, documentType),
        };
    } catch (error) {
        console.error('Erro na extração de dados:', error);
        // Retorna objeto vazio em caso de erro, para não interromper o fluxo
        return {
            metadata: {}
        };
    }
}

/**
 * Identifica o tipo de arquivo com base na extensão
 * @param {string} filePath - Caminho do arquivo
 * @returns {string} - Tipo de arquivo (pdf, docx, xlsx, image)
 */
function identifyFileType(filePath) {
    const extension = path.extname(filePath).toLowerCase();
    
    if (extension === '.pdf') return 'pdf';
    if (extension === '.docx' || extension === '.doc') return 'docx';
    if (extension === '.xlsx' || extension === '.xls') return 'xlsx';
    if (['.jpg', '.jpeg', '.png', '.tiff', '.bmp'].includes(extension)) return 'image';
    
    throw new Error(`Extensão não suportada: ${extension}`);
}

/**
 * Extrai texto de um arquivo PDF
 * @param {string} filePath - Caminho do arquivo PDF
 * @returns {string} - Texto extraído
 */
async function extractPdfText(filePath) {
    try {
        const dataBuffer = fs.readFileSync(filePath);
        const data = await pdf(dataBuffer);
        return data.text;
    } catch (error) {
        console.error('Erro ao extrair texto do PDF:', error);
        return '';
    }
}

/**
 * Extrai texto de um arquivo DOCX
 * @param {string} filePath - Caminho do arquivo DOCX
 * @returns {string} - Texto extraído
 */
async function extractDocxText(filePath) {
    try {
        const result = await mammoth.extractRawText({ path: filePath });
        return result.value;
    } catch (error) {
        console.error('Erro ao extrair texto do DOCX:', error);
        return '';
    }
}

/**
 * Extrai dados de uma planilha Excel
 * @param {string} filePath - Caminho do arquivo Excel
 * @returns {string} - Texto extraído (concatenação de células)
 */
async function extractXlsxData(filePath) {
    try {
        const workbook = xlsx.readFile(filePath);
        const sheetNames = workbook.SheetNames;
        let result = '';
        
        // Concatenar conteúdo de todas as planilhas
        for (const sheetName of sheetNames) {
            const worksheet = workbook.Sheets[sheetName];
            const json = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
            
            result += `Planilha: ${sheetName}\n`;
            json.forEach(row => {
                if (row.length > 0) {
                    result += row.join(' | ') + '\n';
                }
            });
            result += '\n';
        }
        
        return result;
    } catch (error) {
        console.error('Erro ao extrair dados do Excel:', error);
        return '';
    }
}

/**
 * Realiza OCR em uma imagem
 * @param {string} filePath - Caminho do arquivo de imagem
 * @returns {string} - Texto extraído
 */
async function performOCR(filePath) {
    try {
        const worker = await createWorker('por');
        const { data: { text } } = await worker.recognize(filePath);
        await worker.terminate();
        return text;
    } catch (error) {
        console.error('Erro ao realizar OCR:', error);
        return '';
    }
}

/**
 * Classifica o documento com base no texto extraído
 * @param {string} text - Texto extraído do documento
 * @returns {string} - Tipo de documento
 */
function classifyDocument(text) {
    // Normalizar texto (remover acentos, converter para minúsculas)
    const normalizedText = normalizeText(text);
    
    // Verificar palavras-chave para cada tipo de documento
    if (containsKeywords(normalizedText, ['certidao', 'negativa', 'debito', 'tributo', 'regularidade'])) {
        return 'certidao';
    }
    
    if (containsKeywords(normalizedText, ['atestado', 'capacidade', 'tecnica', 'servico', 'fornecimento'])) {
        return 'atestado';
    }
    
    if (containsKeywords(normalizedText, ['proposta', 'tecnica', 'comercial', 'preco'])) {
        return 'proposta';
    }
    
    if (containsKeywords(normalizedText, ['orcamento', 'planilha', 'custo', 'valor', 'preco unitario'])) {
        return 'orcamento';
    }
    
    if (containsKeywords(normalizedText, ['cronograma', 'fisico', 'financeiro', 'prazo', 'etapa'])) {
        return 'cronograma';
    }
    
    if (containsKeywords(normalizedText, ['bdi', 'bonificacao', 'despesa', 'indireta'])) {
        return 'bdi';
    }
    
    if (containsKeywords(normalizedText, ['contrato', 'social', 'estatuto', 'cnpj', 'constituicao'])) {
        return 'documento_constitutivo';
    }
    
    if (containsKeywords(normalizedText, ['balanco', 'patrimonial', 'demonstracao', 'contabil'])) {
        return 'balanco';
    }
    
    // Documento não classificado
    return 'outro';
}

/**
 * Normaliza o texto removendo acentos e convertendo para minúsculas
 * @param {string} text - Texto a ser normalizado
 * @returns {string} - Texto normalizado
 */
function normalizeText(text) {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Verifica se o texto contém palavras-chave específicas
 * @param {string} text - Texto normalizado
 * @param {Array<string>} keywords - Lista de palavras-chave
 * @returns {boolean} - Verdadeiro se contém pelo menos 2 palavras-chave
 */
function containsKeywords(text, keywords) {
    let count = 0;
    for (const keyword of keywords) {
        if (text.includes(keyword)) {
            count++;
        }
    }
    return count >= 2; // Pelo menos 2 palavras-chave para maior precisão
}

/**
 * Extrai metadados específicos com base no tipo de documento
 * @param {string} text - Texto extraído do documento
 * @param {string} documentType - Tipo de documento
 * @returns {Object} - Metadados extraídos
 */
function extractMetadata(text, documentType) {
    const metadata = {};
    
    // Extrair datas (formato DD/MM/AAAA)
    const dateRegex = /(\d{2}\/\d{2}\/\d{4})/g;
    const dates = text.match(dateRegex) || [];
    
    if (dates.length > 0) {
        // Primeira data geralmente é a data de emissão
        metadata.issueDate = parseDate(dates[0]);
        
        // Se houver mais de uma data, a última pode ser a data de validade
        if (dates.length > 1) {
            metadata.expirationDate = parseDate(dates[dates.length - 1]);
        }
    }
    
    // Extrair valores monetários
    const moneyRegex = /R\$\s*(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)/g;
    const moneyMatches = text.matchAll(moneyRegex);
    const moneyValues = [];
    
    for (const match of moneyMatches) {
        moneyValues.push(parseFloat(match[1].replace('.', '').replace(',', '.')));
    }
    
    if (moneyValues.length > 0) {
        metadata.proposalValue = moneyValues[0];
        
        if (moneyValues.length > 1) {
            metadata.bidValue = moneyValues[1];
            
            // Calcular diferença percentual
            if (metadata.bidValue > 0) {
                metadata.percentageDifference = ((metadata.proposalValue - metadata.bidValue) / metadata.bidValue) * 100;
            }
        }
    }
    
    // Extrair CNPJs
    const cnpjRegex = /(\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2})/g;
    const cnpjMatches = text.match(cnpjRegex) || [];
    
    if (cnpjMatches.length > 0) {
        metadata.cnpj = cnpjMatches[0];
    }
    
    // Extrair números de certidões (padrão genérico)
    if (documentType === 'certidao') {
        const certNumberRegex = /(?:Certidão|Certificado)\s+(?:n[º°\.]\s*|[Nn]úmero\s*[:=]?\s*)(\d[\d\.\/-]+)/g;
        const certMatches = text.matchAll(certNumberRegex);
        
        for (const match of certMatches) {
            metadata.documentNumber = match[1];
            break;
        }
        
        // Tentar identificar o órgão emissor
        const commonIssuers = [
            'Receita Federal', 'Fazenda', 'Caixa', 'INSS', 'Ministério',
            'Prefeitura', 'Secretaria', 'Tribunal', 'Justiça'
        ];
        
        for (const issuer of commonIssuers) {
            if (text.includes(issuer)) {
                metadata.issuer = extractIssuerContext(text, issuer);
                break;
            }
        }
    }
    
    return metadata;
}

/**
 * Extrai o contexto do órgão emissor
 * @param {string} text - Texto completo
 * @param {string} issuer - Palavra-chave do emissor
 * @returns {string} - Nome do emissor com contexto
 */
function extractIssuerContext(text, issuer) {
    const index = text.indexOf(issuer);
    if (index >= 0) {
        // Extrair até 50 caracteres antes e depois para obter contexto
        const start = Math.max(0, index - 50);
        const end = Math.min(text.length, index + issuer.length + 50);
        const context = text.substring(start, end);
        
        // Limpar e formatar
        return context
            .replace(/\s+/g, ' ')
            .trim();
    }
    return issuer;
}

/**
 * Converte string de data para objeto Date
 * @param {string} dateStr - String de data no formato DD/MM/AAAA
 * @returns {Date|null} - Objeto Date ou null se inválido
 */
function parseDate(dateStr) {
    try {
        const parts = dateStr.split('/');
        if (parts.length === 3) {
            const day = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1; // Meses em JS são 0-indexed
            const year = parseInt(parts[2], 10);
            
            const date = new Date(year, month, day);
            
            // Verificar se a data é válida
            if (!isNaN(date.getTime())) {
                return date;
            }
        }
    } catch (error) {
        console.error('Erro ao converter data:', error);
    }
    return null;
}

/**
 * Valida os metadados extraídos e atribui níveis de confiança
 * @param {Object} metadata - Metadados extraídos
 * @param {string} documentType - Tipo de documento
 * @returns {Object} - Metadados validados
 */
function validateMetadata(metadata, documentType) {
    const validatedMetadata = { ...metadata };
    
    // Validar datas
    if (validatedMetadata.issueDate && validatedMetadata.expirationDate) {
        // Verificar se a data de validade é posterior à data de emissão
        if (validatedMetadata.expirationDate <= validatedMetadata.issueDate) {
            // Data de validade inválida, remover
            delete validatedMetadata.expirationDate;
        }
    }
    
    // Validar valores monetários
    if (validatedMetadata.proposalValue && validatedMetadata.proposalValue < 0) {
        delete validatedMetadata.proposalValue;
    }
    
    if (validatedMetadata.bidValue && validatedMetadata.bidValue < 0) {
        delete validatedMetadata.bidValue;
    }
    
    return validatedMetadata;
}

/**
 * Extrai um nome para o documento com base no texto
 * @param {string} text - Texto extraído do documento
 * @param {string} fallbackName - Nome padrão caso não seja possível extrair
 * @returns {string} - Nome do documento
 */
function extractDocumentName(text, fallbackName) {
    // Tentar extrair título ou nome do documento
    const titleRegex = /(?:título|nome|referente a|referência)[:]\s*([^\n\.]{5,100})/i;
    const match = text.match(titleRegex);
    
    if (match && match[1]) {
        return match[1].trim();
    }
    
    return fallbackName;
}

/**
 * Extrai uma descrição para o documento
 * @param {string} text - Texto extraído do documento
 * @returns {string} - Descrição do documento
 */
function extractDescription(text) {
    // Limitar a 200 caracteres para uma descrição concisa
    if (text.length <= 200) {
        return text.trim();
    }
    
    return text.substring(0, 197).trim() + '...';
}

/**
 * Mapeia o tipo de documento para uma categoria
 * @param {string} documentType - Tipo de documento
 * @returns {string} - ID da categoria (será substituído pelo ID real)
 */
function mapTypeToCategory(documentType) {
    // Este mapeamento será substituído pelos IDs reais das categorias no banco de dados
    const typeToCategory = {
        'certidao': 'fiscal',
        'atestado': 'tecnico',
        'proposta': 'propostas',
        'orcamento': 'propostas',
        'cronograma': 'propostas',
        'bdi': 'propostas',
        'documento_constitutivo': 'juridico',
        'balanco': 'economico',
        'outro': 'outros'
    };
    
    return typeToCategory[documentType] || 'outros';
}

/**
 * Gera tags para o documento com base no texto e tipo
 * @param {string} text - Texto extraído do documento
 * @param {string} documentType - Tipo de documento
 * @returns {Array<string>} - Lista de tags
 */
function generateTags(text, documentType) {
    const tags = [documentType];
    
    // Adicionar tags com base no tipo de documento
    switch (documentType) {
        case 'certidao':
            if (text.includes('federal')) tags.push('federal');
            if (text.includes('estadual')) tags.push('estadual');
            if (text.includes('municipal')) tags.push('municipal');
            if (text.includes('trabalhista')) tags.push('trabalhista');
            if (text.includes('FGTS')) tags.push('fgts');
            break;
            
        case 'atestado':
            if (text.includes('técnica')) tags.push('tecnica');
            if (text.includes('capacidade')) tags.push('capacidade');
            if (text.includes('operacional')) tags.push('operacional');
            break;
            
        case 'proposta':
            if (text.includes('técnica')) tags.push('tecnica');
            if (text.includes('comercial')) tags.push('comercial');
            if (text.includes('preço')) tags.push('preco');
            break;
    }
    
    return tags;
}

module.exports = {
    extractDocumentData
};
