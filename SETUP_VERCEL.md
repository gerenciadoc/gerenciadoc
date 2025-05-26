# Configuração do Gerenciadoc no Vercel

Este guia detalha como configurar corretamente o ambiente do Gerenciadoc no Vercel para garantir o funcionamento adequado do sistema, especialmente o login e o módulo de gestão de documentos.

## Configuração das Variáveis de Ambiente

Para que o sistema funcione corretamente, é necessário configurar as seguintes variáveis de ambiente no painel do Vercel:

### Passo a Passo:

1. Acesse o [Dashboard do Vercel](https://vercel.com/dashboard)
2. Selecione o projeto "gerenciadoc"
3. Navegue até **Settings > Environment Variables**
4. Adicione as seguintes variáveis:

| Nome | Valor | Escopo |
|------|-------|--------|
| `MONGODB_URI` | `mongodb+srv://gerenciadoc:<db_password>@cluster0.vowrllh.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0` | Production, Preview, Development |
| `JWT_SECRET` | `[sua-chave-secreta-gerada]` | Production, Preview, Development |
| `NODE_ENV` | `production` | Production |

> **Importante**: Substitua `<db_password>` pela senha real do MongoDB e gere uma chave JWT segura conforme instruções abaixo.

### Gerando uma Chave JWT Segura

Para gerar uma chave JWT segura, execute o seguinte comando em um terminal:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copie o resultado e use-o como valor para a variável `JWT_SECRET`.

## Verificação da Configuração

Após configurar as variáveis de ambiente:

1. Acesse o painel do Vercel
2. Navegue até **Deployments**
3. Clique em **Redeploy** para aplicar as novas variáveis de ambiente
4. Aguarde a conclusão do deploy

## Criação de Usuário de Teste

Para criar um usuário de teste no sistema:

1. Acesse a URL: `https://[seu-dominio-vercel]/api/seed/create-test-user`
2. Verifique se a resposta indica sucesso na criação do usuário

Isso criará um usuário com as seguintes credenciais:
- Email: teste@gerenciadoc.com
- Senha: senha123
- Função: admin
- Período de teste: 5 dias

## Testando o Login

Para testar se o login está funcionando corretamente:

1. Acesse a página de login: `https://[seu-dominio-vercel]/login.html`
2. Insira as credenciais do usuário de teste
3. Se o login falhar, acesse o endpoint de debug: `https://[seu-dominio-vercel]/api/login-debug`
   - Use o método GET para verificar se o endpoint está acessível
   - Use o método POST com as credenciais para testar o login com logs detalhados

## Solução de Problemas Comuns

### Erro "Failed to fetch"
- Verifique se as funções serverless estão sendo corretamente implantadas
- Confirme que o arquivo `vercel.json` está configurado corretamente

### Erro "Erro no servidor"
- Verifique se as variáveis de ambiente estão configuradas corretamente
- Confirme que a string de conexão do MongoDB está correta e acessível

### Erro "Credenciais inválidas"
- Execute novamente o script de criação de usuário de teste
- Verifique se o banco de dados está acessível e funcionando corretamente
