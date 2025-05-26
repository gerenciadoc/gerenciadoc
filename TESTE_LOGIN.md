# Guia de Teste do Login e Módulo de Documentos

Este guia fornece instruções passo a passo para testar o funcionamento do sistema de login e do módulo de gestão de documentos após a configuração das variáveis de ambiente no Vercel.

## Pré-requisitos

Antes de iniciar os testes, certifique-se de que:

1. As variáveis de ambiente foram configuradas no painel do Vercel:
   - `MONGODB_URI` com a string de conexão correta
   - `JWT_SECRET` com uma chave segura
   - `NODE_ENV` configurado como "production"

2. O redeploy do projeto foi realizado após a configuração das variáveis

## Teste 1: Criação de Usuário de Teste

1. Acesse a URL: `https://[seu-dominio-vercel]/api/seed/create-test-user`
2. Verifique se a resposta é: `{"message":"Usuário de teste criado/atualizado com sucesso"}`
3. Se ocorrer algum erro, verifique o console do navegador para mais detalhes

## Teste 2: Login com Usuário de Teste

1. Acesse a página de login: `https://[seu-dominio-vercel]/login.html`
2. Insira as credenciais:
   - Email: `teste@gerenciadoc.com`
   - Senha: `senha123`
3. Clique no botão "Entrar"
4. Verifique se você é redirecionado para a página de dashboard

## Teste 3: Acesso ao Módulo de Documentos

1. Após fazer login, acesse: `https://[seu-dominio-vercel]/documentos.html`
2. Verifique se a página carrega corretamente com a visualização em lista
3. Confirme se as categorias (Jurídico, Fiscal, Técnico, etc.) são exibidas
4. Teste o upload de um documento para verificar a extração automática

## Teste 4: Diagnóstico de Problemas (se necessário)

Se encontrar problemas durante os testes, siga estas etapas de diagnóstico:

1. Verifique o endpoint de debug: `https://[seu-dominio-vercel]/api/login-debug`
   - Use o método GET para verificar se o endpoint está acessível
   - Use o método POST com as credenciais para testar o login com logs detalhados

2. Verifique o console do navegador (F12) para erros específicos

3. Problemas comuns e soluções:
   - "Failed to fetch": Verifique se as funções serverless estão sendo implantadas corretamente
   - "Erro no servidor": Verifique as variáveis de ambiente e a conexão com o MongoDB
   - "Credenciais inválidas": Execute novamente o script de criação de usuário de teste

## Relatório de Teste

Após realizar os testes, anote:

1. Quais testes foram bem-sucedidos
2. Quais testes falharam e com quais mensagens de erro
3. Quaisquer comportamentos inesperados observados

Estas informações serão úteis para diagnóstico e correção de problemas remanescentes.
