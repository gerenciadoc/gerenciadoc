# Guia de Uso do Gerenciadoc - Solução Alternativa de Login

Este guia fornece instruções detalhadas para usar o Gerenciadoc enquanto resolvemos os problemas de integração com o Vercel.

## 1. Login Alternativo

O sistema possui uma página de login alternativa que funciona independentemente das funções serverless do Vercel:

**URL de Login Alternativo:**
```
https://gerenciadoc-git-main-eliseus-projects-b673746e.vercel.app/login-direct.html
```

**Credenciais de Teste:**
- Email: teste@gerenciadoc.com
- Senha: senha123

Esta página de login alternativa usa autenticação direta e permite acesso completo ao módulo de gestão de documentos.

## 2. Criação de Usuários com Script Local

Para criar novos usuários, você pode usar o script `criar-usuario.js` que se conecta diretamente ao MongoDB:

### Instruções de Uso:

1. **Baixe o arquivo** `scripts/criar-usuario.js` do repositório GitHub

2. **Instale as dependências necessárias:**
   ```bash
   npm install mongoose bcryptjs
   ```

3. **Execute o script:**
   ```bash
   node criar-usuario.js
   ```

4. **Siga as instruções no console** para fornecer os dados do novo usuário:
   - Nome
   - Email
   - Senha
   - Empresa (opcional)
   - Papel (user/admin)

5. **Use as credenciais criadas** para fazer login através da página de login alternativa

## 3. Acesso ao Módulo de Documentos

Após fazer login com sucesso, você pode acessar o módulo de gestão de documentos:

```
https://gerenciadoc-git-main-eliseus-projects-b673746e.vercel.app/documentos.html
```

Este módulo permite:
- Visualizar documentos em formato de lista
- Categorizar documentos hierarquicamente
- Fazer upload de documentos com extração automática
- Usar o sistema de anotações para colaboração

## 4. Solução de Problemas

Se encontrar algum problema ao usar o sistema:

1. **Verifique se está usando a página de login alternativa**
   - A página de login normal ainda está sendo ajustada

2. **Confirme que o usuário existe no banco de dados**
   - Use o script `criar-usuario.js` para listar todos os usuários cadastrados

3. **Limpe o cache do navegador**
   - Às vezes, dados antigos podem causar problemas de autenticação

4. **Use o modo anônimo/privado do navegador**
   - Isso evita conflitos com extensões ou configurações existentes

## 5. Próximos Passos

Estamos trabalhando para resolver os problemas de integração entre o Vercel e o MongoDB. As principais causas identificadas são:

- Restrições de IP no MongoDB Atlas
- Timeout nas funções serverless do Vercel
- Incompatibilidade de versões do driver MongoDB

Enquanto isso, você pode continuar usando o sistema normalmente através da solução alternativa de login.

## 6. Contato para Suporte

Se precisar de suporte adicional ou tiver dúvidas sobre o uso do sistema, entre em contato através do email de suporte ou abra uma issue no repositório GitHub do projeto.
