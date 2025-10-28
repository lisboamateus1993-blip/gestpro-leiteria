# Gestpro - Financeiro Leiteria

Sistema de controle financeiro profissional para gestão de leiteria.

## 🚀 Deploy no Render

### Pré-requisitos
- Conta no GitHub
- Conta no Render (gratuita)

### Passo a Passo

1. **Faça fork ou clone este repositório no seu GitHub**

2. **Acesse [Render.com](https://render.com) e faça login com GitHub**

3. **Crie um novo Web Service**
   - Clique em "New +" → "Web Service"
   - Conecte seu repositório GitHub
   - Selecione o repositório `gestpro-leiteria`

4. **Configure o Web Service**
   - **Name**: `gestpro-leiteria`
   - **Environment**: `Node`
   - **Build Command**: `pnpm install && pnpm build`
   - **Start Command**: `pnpm start`
   - **Plan**: Free

5. **Adicione as variáveis de ambiente**
   ```
   NODE_ENV=production
   DATABASE_URL=<sua_url_do_banco>
   JWT_SECRET=<seu_jwt_secret>
   OAUTH_SERVER_URL=https://vidabiz.butterfly-effect.dev
   VITE_OAUTH_PORTAL_URL=https://vida.butterfly-effect.dev
   ```

6. **Crie um banco de dados MySQL**
   - No Render, vá em "New +" → "MySQL"
   - Copie a URL de conexão
   - Cole na variável `DATABASE_URL`

7. **Deploy**
   - Clique em "Create Web Service"
   - Aguarde o deploy (3-5 minutos)
   - Seu app estará disponível em: `https://gestpro-leiteria.onrender.com`

## 🔧 Tecnologias

- **Frontend**: React + Vite + TailwindCSS
- **Backend**: Node.js + Express + tRPC
- **Banco de Dados**: MySQL
- **Autenticação**: OAuth

## 📦 Instalação Local

```bash
# Instalar dependências
pnpm install

# Configurar variáveis de ambiente
cp .env.example .env

# Rodar em desenvolvimento
pnpm dev

# Build para produção
pnpm build

# Rodar em produção
pnpm start
```

## 🌐 Links

- **Firebase Hosting**: https://gestpro-leiteria-2025.web.app
- **Repositório**: [GitHub](https://github.com/seu-usuario/gestpro-leiteria)

## 📝 Licença

MIT

