# Modelo de Dados - Módulo de Gestão de Documentos

## Visão Geral
Este documento descreve o modelo de dados para o módulo de gestão de documentos do Gerenciadoc, incluindo as entidades principais, seus atributos e relacionamentos.

## Entidades Principais

### 1. Documento
Representa um documento físico ou digital armazenado no sistema.

```javascript
{
  _id: ObjectId,
  nome: String,                     // Nome do arquivo
  descricao: String,                // Descrição opcional do documento
  tipo: String,                     // Tipo de documento (referência à entidade TipoDocumento)
  categoriaId: ObjectId,            // Referência à categoria
  dataEmissao: Date,                // Data em que o documento foi emitido
  dataValidade: Date,               // Data de validade do documento
  status: String,                   // "válido", "prestes a vencer", "vencido"
  arquivoUrl: String,               // URL para o arquivo no armazenamento
  tamanho: Number,                  // Tamanho do arquivo em bytes
  formato: String,                  // Formato do arquivo (PDF, DOC, etc.)
  metadados: {                      // Metadados específicos do documento
    orgaoEmissor: String,           // Órgão que emitiu o documento
    numeroDocumento: String,        // Número de identificação do documento
    valorProposta: Number,          // Valor da proposta (para documentos financeiros)
    valorLicitacao: Number,         // Valor da licitação (para comparação)
    diferencaPercentual: Number,    // Diferença percentual calculada
    // Outros metadados específicos do tipo de documento
  },
  tags: [String],                   // Tags para facilitar a busca
  anotacoes: [{                     // Anotações feitas no documento
    texto: String,
    autor: ObjectId,                // Referência ao usuário que fez a anotação
    data: Date,
    posicao: {                      // Posição da anotação no documento
      pagina: Number,
      x: Number,
      y: Number
    }
  }],
  versoes: [{                       // Histórico de versões do documento
    arquivoUrl: String,
    dataUpload: Date,
    usuarioId: ObjectId,
    descricao: String
  }],
  usuarioId: ObjectId,              // Usuário proprietário do documento
  colaboradorId: ObjectId,          // Colaborador que enviou o documento (se aplicável)
  aprovado: Boolean,                // Indica se o documento foi aprovado (para documentos enviados por colaboradores)
  necessitaAprovacao: Boolean,      // Indica se o documento precisa de aprovação manual
  criadoEm: Date,                   // Data de criação do registro
  atualizadoEm: Date,               // Data da última atualização
  licitacaoId: ObjectId,            // Referência à licitação (se aplicável)
  projetoId: ObjectId               // Referência ao projeto (se aplicável)
}
```

### 2. Categoria
Representa uma categoria de documentos para organização hierárquica.

```javascript
{
  _id: ObjectId,
  nome: String,                     // Nome da categoria
  descricao: String,                // Descrição da categoria
  pai: ObjectId,                    // Referência à categoria pai (para hierarquia)
  criadoEm: Date,
  atualizadoEm: Date
}
```

### 3. TipoDocumento
Define os tipos de documentos predefinidos no sistema.

```javascript
{
  _id: ObjectId,
  nome: String,                     // Nome do tipo de documento
  descricao: String,                // Descrição do tipo
  validadePadrao: Number,           // Validade padrão em dias (se aplicável)
  metadadosRequeridos: [String],    // Lista de metadados obrigatórios para este tipo
  categoriaId: ObjectId,            // Categoria padrão para este tipo
  criadoEm: Date,
  atualizadoEm: Date
}
```

### 4. Licitacao
Representa uma licitação específica para agrupar documentos relacionados.

```javascript
{
  _id: ObjectId,
  titulo: String,                   // Título da licitação
  descricao: String,                // Descrição da licitação
  orgaoLicitante: String,           // Órgão responsável pela licitação
  numeroEdital: String,             // Número do edital
  dataAbertura: Date,               // Data de abertura da licitação
  dataEntrega: Date,                // Data de entrega dos documentos
  valor: Number,                    // Valor estimado da licitação
  status: String,                   // Status da licitação (em andamento, concluída, etc.)
  documentos: [ObjectId],           // Referências aos documentos relacionados
  usuarioId: ObjectId,              // Usuário responsável
  criadoEm: Date,
  atualizadoEm: Date
}
```

### 5. LinkColaborador
Representa um link de convite para colaboradores enviarem documentos.

```javascript
{
  _id: ObjectId,
  token: String,                    // Token único para o link
  email: String,                    // Email do colaborador convidado
  nome: String,                     // Nome do colaborador
  tipoDocumentoId: ObjectId,        // Tipo de documento solicitado
  dataExpiracao: Date,              // Data de expiração do link
  aprovacaoManual: Boolean,         // Indica se os documentos precisam de aprovação manual
  mensagem: String,                 // Mensagem opcional para o colaborador
  usuarioId: ObjectId,              // Usuário que criou o link
  documentosEnviados: [ObjectId],   // Documentos enviados através deste link
  status: String,                   // "ativo", "expirado", "usado"
  criadoEm: Date,
  atualizadoEm: Date
}
```

## Relacionamentos

1. **Documento → Categoria**: Um documento pertence a uma categoria
2. **Documento → TipoDocumento**: Um documento é de um tipo específico
3. **Documento → Usuário**: Um documento pertence a um usuário
4. **Documento → Colaborador**: Um documento pode ser enviado por um colaborador
5. **Documento → Licitação**: Um documento pode estar associado a uma licitação
6. **Categoria → Categoria**: Uma categoria pode ter uma categoria pai (hierarquia)
7. **LinkColaborador → Usuário**: Um link é criado por um usuário
8. **LinkColaborador → TipoDocumento**: Um link solicita um tipo específico de documento
9. **LinkColaborador → Documento**: Um link pode ter vários documentos enviados através dele

## Índices Recomendados

1. `Documento`: índices em `usuarioId`, `status`, `dataValidade`, `tipo`, `categoriaId`
2. `LinkColaborador`: índices em `token`, `email`, `usuarioId`, `status`
3. `Licitacao`: índices em `usuarioId`, `dataEntrega`, `status`

## Considerações de Implementação

1. **Controle de Validade**: Implementar lógica para atualizar automaticamente o status dos documentos com base na data de validade
2. **Versionamento**: Manter histórico completo de versões para auditoria e recuperação
3. **Metadados Dinâmicos**: Permitir metadados flexíveis baseados no tipo de documento
4. **Cálculos Automáticos**: Implementar cálculo automático de diferença percentual entre valor da proposta e valor da licitação
5. **Fluxo de Aprovação**: Implementar lógica para notificação e aprovação de documentos enviados por colaboradores
