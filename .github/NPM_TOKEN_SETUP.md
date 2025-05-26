# Configuração do NPM Token

## Passo a Passo para Configurar o NPM_TOKEN

### 1. Criar um Token no npmjs.com

1. Acesse [npmjs.com](https://www.npmjs.com) e faça login
2. Clique no seu avatar no canto superior direito
3. Selecione "Access Tokens"
4. Clique em "Generate New Token"
5. Escolha "Classic Token"
6. Selecione o tipo "Automation" (recomendado para CI/CD)
7. Copie o token gerado (ele aparecerá apenas uma vez)

### 2. Adicionar o Token como Secret no GitHub

1. Vá para o seu repositório no GitHub
2. Clique em "Settings" (na aba do repositório)
3. No menu lateral, clique em "Secrets and variables" → "Actions"
4. Clique em "New repository secret"
5. Nome: `NPM_TOKEN`
6. Valor: cole o token copiado do npmjs.com
7. Clique em "Add secret"

### 3. Verificar Permissões do Token

Certifique-se de que:

- O token tem permissões de publicação
- Você é o proprietário do package ou tem permissões de colaborador
- O nome do package no `package.json` está disponível no npm

### 4. Testar a Configuração

Depois de configurar o token, você pode testar criando uma tag:

```bash
# Bumping version
npm version patch

# Pushing tags (isso irá disparar o workflow de publicação)
git push origin main --tags
```

## Problemas Comuns

### "npm ERR! 403 Forbidden"

- Verifique se o NPM_TOKEN está correto
- Confirme se você tem permissões para publicar o package
- Verifique se o nome do package não está em uso

### "npm ERR! Package name too similar"

- O nome do package pode estar muito similar a um existente
- Considere usar um escopo: `@seu-usuario/asl-workflow-viewer`

### Workflow não executa

- Verifique se a tag começa com 'v' (exemplo: v1.0.0)
- Confirme se a tag foi enviada: `git push --tags`
- Verifique os logs na aba Actions do GitHub

## Segurança

- Nunca compartilhe seu NPM_TOKEN
- Use tokens do tipo "Automation" para CI/CD
- Revogue tokens antigos quando não precisar mais deles
- Monitore as publicações do seu package regularmente
