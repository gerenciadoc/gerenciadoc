# Gerenciadoc - Sistema de Gestão de Documentos para Licitações

Sistema completo para gerenciamento de documentos relacionados a processos licitatórios, com extração automática de dados, categorização inteligente e controle de validade.

## Configuração do Ambiente

### Variáveis de Ambiente no Vercel

Para garantir o funcionamento correto do sistema em produção, é necessário configurar as seguintes variáveis de ambiente no painel do Vercel:

1. Acesse o painel do projeto no Vercel
2. Navegue até **Settings > Environment Variables**
3. Adicione as seguintes variáveis:

| Nome | Valor | Descrição |
|------|-------|-----------|
| `MONGODB_URI` | `mongodb+srv://gerenciadoc:<db_password>@cluster0.vowrllh.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0` | String de conexão com o MongoDB (substitua `<db_password>` pela senha real) |
| `JWT_SECRET` | `chave-secreta-gerada` | Chave secreta para geração de tokens JWT (gere uma chave segura) |
| `NODE_ENV` | `production` | Ambiente de execução |

### Gerando uma Chave JWT Segura

Para gerar uma chave JWT segura, execute o seguinte comando:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copie o resultado e use-o como valor para a variável `JWT_SECRET`.

## Criação de Usuário de Teste

Para criar um usuário de teste no sistema, acesse a seguinte URL após o deploy:

```
https://[seu-dominio-vercel]/api/seed/create-test-user
```

Isso criará um usuário com as seguintes credenciais:
- Email: teste@gerenciadoc.com
- Senha: senha123
- Função: admin
- Período de teste: 5 dias

## Estrutura do Projeto

- `/api` - Funções serverless para o backend
- `/backend` - Código do backend Node.js/Express
- `/js` - Scripts do frontend
- `/pages` - Rotas Next.js para API
- `*.html` - Páginas do frontend

## Módulos Principais

### Gestão de Documentos

O módulo de gestão de documentos permite:
- Upload de documentos com extração automática de dados
- Categorização hierárquica (Jurídico, Fiscal, Técnico, etc.)
- Controle de validade com alertas visuais
- Sistema de anotações para colaboração
- Fluxo de aprovação para documentos enviados por colaboradores

### Autenticação e Controle de Acesso

- Sistema de login com JWT
- Diferentes níveis de acesso (admin, usuário, colaborador)
- Período de teste de 5 dias
- Planos de assinatura: Basic, Standard e Premium

## Solução de Problemas

Se encontrar problemas com o login, verifique:
1. Se as variáveis de ambiente estão configuradas corretamente no Vercel
2. Se o usuário existe no banco de dados (execute o script de criação de usuário)
3. Acesse o endpoint de debug para mais informações: `/api/login-debug`

## Desenvolvimento Local

Para executar o projeto localmente:

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev
```

O frontend estará disponível em `http://localhost:3000` e o backend em `http://localhost:5000`.
