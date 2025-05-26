# Algoritmo de Extração Automática de Dados de Documentos

## Visão Geral

Este documento descreve a estratégia e implementação do algoritmo de extração automática de dados durante o upload de documentos no Gerenciadoc. O objetivo é reduzir significativamente o trabalho manual de preenchimento de metadados, melhorando a experiência do usuário e a eficiência do sistema.

## Estratégia de Extração

O algoritmo utilizará diferentes abordagens dependendo do tipo de arquivo:

### 1. Documentos PDF

Para arquivos PDF, utilizaremos:
- **Poppler-utils** para extração de texto
- **OCR (Tesseract)** para documentos digitalizados ou com texto em imagens
- **Expressões regulares** para identificar padrões específicos (datas, números, valores)

### 2. Documentos Word (DOCX)

Para arquivos DOCX, utilizaremos:
- **Bibliotecas Node.js** como `mammoth` ou `docx-parser` para extração de texto
- **Análise de estrutura** para identificar seções importantes (cabeçalhos, tabelas)

### 3. Planilhas Excel (XLSX)

Para arquivos XLSX, utilizaremos:
- **Bibliotecas Node.js** como `xlsx` ou `exceljs` para extração de dados
- **Análise de células específicas** para identificar valores importantes (orçamentos, cronogramas)

### 4. Imagens (JPG, PNG)

Para arquivos de imagem, utilizaremos:
- **OCR (Tesseract)** para extrair texto
- **Análise de layout** para identificar regiões importantes

## Dados a Extrair

O algoritmo tentará extrair automaticamente os seguintes dados:

1. **Informações Básicas**:
   - Tipo de documento (baseado em palavras-chave e estrutura)
   - Data de emissão
   - Data de validade
   - Número do documento

2. **Informações Financeiras**:
   - Valor da proposta
   - Valor da licitação
   - Percentuais (BDI, descontos)

3. **Informações de Origem**:
   - Órgão emissor
   - CNPJ/CPF relacionado
   - Assinaturas e carimbos (detecção de presença)

4. **Informações de Licitação**:
   - Número do edital
   - Modalidade da licitação
   - Objeto da licitação

## Algoritmo de Processamento

O algoritmo seguirá estas etapas:

1. **Identificação do Tipo de Arquivo**:
   - Determinar a extensão e formato do arquivo
   - Selecionar o método de extração apropriado

2. **Extração de Texto**:
   - Converter o documento para texto plano
   - Aplicar OCR se necessário

3. **Análise de Padrões**:
   - Aplicar expressões regulares para identificar:
     - Datas (DD/MM/AAAA, DD.MM.AAAA, etc.)
     - Valores monetários (R$ X.XXX,XX)
     - Números de documentos (padrões específicos para certidões, CNPJs, etc.)
     - Palavras-chave que indicam o tipo de documento

4. **Classificação do Documento**:
   - Baseado nas palavras-chave e estrutura, classificar o documento em uma categoria
   - Determinar campos específicos a serem extraídos com base na categoria

5. **Extração de Metadados Específicos**:
   - Aplicar regras específicas para cada tipo de documento
   - Extrair informações relevantes baseadas na classificação

6. **Validação e Confiança**:
   - Atribuir níveis de confiança para cada dado extraído
   - Destacar campos com baixa confiança para revisão manual

## Implementação Técnica

### Bibliotecas e Ferramentas

- **PDF**: `pdf-parse`, `pdf2json`, `poppler-utils`
- **OCR**: `tesseract.js`, `node-tesseract-ocr`
- **DOCX**: `mammoth`, `docx-parser`
- **XLSX**: `xlsx`, `exceljs`
- **Expressões Regulares**: Padrões customizados para cada tipo de informação
- **NLP**: Processamento de linguagem natural para melhorar a extração contextual

### Fluxo de Processamento

```javascript
async function extractDocumentData(file) {
  // 1. Identificar tipo de arquivo
  const fileType = identifyFileType(file);
  
  // 2. Extrair texto baseado no tipo
  let text;
  switch (fileType) {
    case 'pdf':
      text = await extractPdfText(file);
      break;
    case 'docx':
      text = await extractDocxText(file);
      break;
    case 'xlsx':
      text = await extractXlsxData(file);
      break;
    case 'image':
      text = await performOCR(file);
      break;
    default:
      throw new Error('Tipo de arquivo não suportado');
  }
  
  // 3. Classificar documento
  const documentType = classifyDocument(text);
  
  // 4. Extrair metadados específicos
  const metadata = extractMetadata(text, documentType);
  
  // 5. Validar e atribuir confiança
  const validatedMetadata = validateMetadata(metadata, documentType);
  
  return {
    text,
    documentType,
    metadata: validatedMetadata
  };
}
```

## Expressões Regulares para Extração

Exemplos de expressões regulares para extração de dados comuns:

```javascript
// Datas (formato DD/MM/AAAA)
const dateRegex = /(\d{2}\/\d{2}\/\d{4})/g;

// Valores monetários
const moneyRegex = /R\$\s*(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)/g;

// CNPJs
const cnpjRegex = /(\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2})/g;

// Números de certidões (padrão genérico)
const certNumberRegex = /(?:Certidão|Certificado)\s+(?:n[º°\.]\s*|[Nn]úmero\s*[:=]?\s*)(\d[\d\.\/-]+)/g;
```

## Classificação de Documentos

A classificação será baseada em palavras-chave e estrutura:

```javascript
function classifyDocument(text) {
  // Normalizar texto (remover acentos, converter para minúsculas)
  const normalizedText = normalizeText(text);
  
  // Verificar palavras-chave para cada tipo de documento
  if (containsKeywords(normalizedText, ['certidao', 'negativa', 'debito', 'tributo'])) {
    return 'certidao';
  }
  
  if (containsKeywords(normalizedText, ['atestado', 'capacidade', 'tecnica', 'servico'])) {
    return 'atestado';
  }
  
  if (containsKeywords(normalizedText, ['proposta', 'tecnica', 'comercial'])) {
    return 'proposta';
  }
  
  if (containsKeywords(normalizedText, ['orcamento', 'planilha', 'custo', 'valor'])) {
    return 'orcamento';
  }
  
  if (containsKeywords(normalizedText, ['cronograma', 'fisico', 'financeiro', 'prazo'])) {
    return 'cronograma';
  }
  
  if (containsKeywords(normalizedText, ['bdi', 'bonificacao', 'despesa', 'indireta'])) {
    return 'bdi';
  }
  
  // Documento não classificado
  return 'outro';
}
```

## Tratamento de Casos Especiais

### Documentos Digitalizados com Baixa Qualidade

Para documentos com baixa qualidade de digitalização:
- Aplicar pré-processamento de imagem (ajuste de contraste, remoção de ruído)
- Utilizar configurações avançadas de OCR
- Solicitar confirmação manual para campos críticos

### Documentos com Múltiplas Páginas

Para documentos extensos:
- Processar páginas individualmente
- Focar em páginas específicas (primeira, última) para certos tipos de documentos
- Utilizar análise de estrutura para identificar seções importantes

### Documentos em Idiomas Diferentes

Para documentos em outros idiomas:
- Detectar idioma automaticamente
- Aplicar regras específicas para cada idioma
- Utilizar bibliotecas de NLP multilíngues

## Interface com o Usuário

A interface de upload mostrará:
- Progresso da extração de dados
- Campos preenchidos automaticamente (destacados visualmente)
- Indicadores de confiança para cada campo
- Opção para editar/corrigir campos com baixa confiança

## Métricas e Aprendizado

O sistema registrará:
- Taxa de sucesso na extração de cada tipo de dado
- Correções manuais feitas pelos usuários
- Tempo economizado em comparação com preenchimento manual

Estas métricas serão utilizadas para melhorar continuamente o algoritmo.

## Próximos Passos e Melhorias Futuras

1. **Aprendizado de Máquina**:
   - Implementar modelos de ML para melhorar a precisão da extração
   - Utilizar feedback dos usuários para treinar os modelos

2. **Integração com APIs Externas**:
   - Validar certidões em portais governamentais
   - Verificar CNPJs na Receita Federal

3. **Processamento em Lote**:
   - Permitir extração em massa para múltiplos documentos
   - Identificar padrões entre documentos relacionados

4. **Extração de Tabelas Complexas**:
   - Melhorar a extração de dados tabulares
   - Preservar estrutura e relacionamentos
