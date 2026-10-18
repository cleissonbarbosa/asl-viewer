# GitHub Actions para Publicação no NPM

Este repositório contém três workflows do GitHub Actions para automatizar a publicação no npmjs:

## 📁 Workflows Incluídos

### 1. `ci.yml` - Integração Contínua

- **Quando executa**: Em pushes e PRs para as branches `main`/`master`
- **O que faz**:
  - Testa o código em Node.js 16, 18 e 20
  - Executa testes unitários
  - Faz build do projeto
  - Faz build do Storybook
  - Verifica se os artefatos de build foram criados corretamente

### 2. `publish.yml` - Publicação de Release

- **Quando executa**: Quando uma tag começando com `v` é criada (ex: `v1.0.0`)
- **O que faz**:
  - Executa todos os testes
  - Faz build do projeto
  - Publica no npmjs com acesso público
  - Cria uma release no GitHub

### 3. `publish-beta.yml` - Publicação Beta

- **Quando executa**: Em pushes para branches `develop` ou `beta`
- **O que faz**:
  - Executa testes
  - Gera uma versão beta com timestamp e hash do commit
  - Publica no npmjs com tag `beta`

## 🔧 Configuração Necessária

### 1. Secrets do GitHub

Você precisa adicionar os seguintes secrets no seu repositório GitHub:

#### `NPM_TOKEN`

1. Vá para [npmjs.com](https://www.npmjs.com) e faça login
2. Clique no seu avatar → "Access Tokens"
3. Clique em "Generate New Token" → "Classic Token"
4. Selecione "Automation" como tipo
5. Copie o token gerado
6. No GitHub, vá em Settings → Secrets and variables → Actions
7. Clique em "New repository secret"
8. Nome: `NPM_TOKEN`
9. Valor: cole o token do npm

#### `GITHUB_TOKEN` (Automático)

Este token é gerado automaticamente pelo GitHub, não precisa configurar.

### 2. Configuração do package.json

Verifique se seu `package.json` está configurado corretamente:

```json
{
  "name": "asl-workflow-viewer",
  "version": "1.0.0",
  "main": "dist/index.cjs",
  "module": "dist/index.esm.js",
  "types": "dist/index.d.ts",
  "files": ["dist"],
  "publishConfig": {
    "access": "public"
  }
}
```

## 🚀 Como Usar

### Publicar uma Release

1. Atualize a versão no `package.json`:

   ```bash
   npm version patch  # ou minor, major
   ```

2. Crie e envie a tag:

   ```bash
   git push origin main --tags
   ```

3. O workflow `publish.yml` será executado automaticamente

### Publicar uma Versão Beta

1. Faça push para a branch `develop` ou `beta`:

   ```bash
   git push origin develop
   ```

2. O workflow `publish-beta.yml` será executado automaticamente
3. Uma versão beta será publicada com formato: `1.0.0-beta.20250525123456.abc1234`

### Instalar Versões

```bash
# Versão estável
npm install asl-workflow-viewer

# Versão beta
npm install asl-workflow-viewer@beta

# Versão específica
npm install asl-workflow-viewer@1.0.0
```

## 🔍 Monitoramento

- Acompanhe os workflows na aba "Actions" do GitHub
- Verifique as publicações em [npmjs.com/package/asl-workflow-viewer](https://www.npmjs.com/package/asl-workflow-viewer)
- Logs detalhados estão disponíveis em cada execução do workflow

## 🛠️ Troubleshooting

### Erro de Permissão no NPM

- Verifique se o `NPM_TOKEN` está correto e tem permissões de publicação
- Certifique-se de que o package name não está em uso por outro usuário

### Falha no Build

- Verifique se todos os arquivos necessários estão na pasta `dist/`
- Execute `yarn build` localmente para testar

### Tag não Dispara o Workflow

- Certifique-se de que a tag começa com `v` (ex: `v1.0.0`)
- Verifique se a tag foi enviada para o repositório: `git push --tags`
