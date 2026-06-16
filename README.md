# App Visitas Leiteiras

Este projeto foi preparado para o usuario testar **sem instalar Node.js ou Docker no computador**.

Fluxo recomendado:

- **Backend + banco:** Render
- **Web gestor:** Vercel
- **Mobile técnico:** Expo + Expo Go

Se preferir, tambem deixei configuracao para **Railway** no backend.

---

## O que ja esta pronto no repositorio

- `render.yaml` para subir **API + PostgreSQL** no Render
- `railway.json` + `Procfile` para backend no Railway
- `apps/web/vercel.json` para deploy do portal gestor na Vercel
- `apps/mobile/app.config.ts` + `apps/mobile/eas.json` para publicar o app mobile pela Expo
- `.github/workflows/mobile-expo-update.yml` para publicar o mobile pela nuvem via GitHub Actions

---

## Ordem mais simples de deploy

1. Subir o **backend** no Render
2. Copiar a URL do backend
3. Subir o **web gestor** na Vercel
4. Publicar o **mobile** na Expo apontando para a URL do backend

---

# 1) Backend no Render

## Por que Render?

Porque aqui o backend fica mais simples:

- banco PostgreSQL no mesmo fluxo
- deploy automatico por GitHub
- arquivo `render.yaml` ja pronto

## Passo a passo

### 1. Criar conta
- Acesse: `https://render.com`
- Clique em **Get Started**
- Entre com GitHub

### 2. Importar o repositorio
- No painel do Render, clique em **New +**
- Escolha **Blueprint**
- Selecione o seu repositorio GitHub
- O Render vai ler automaticamente o arquivo `render.yaml`

### 3. Confirmar a criacao
Ele deve mostrar:

- um banco `visitas-leiteiras-db`
- um web service `visitas-leiteiras-api`

Clique em **Apply**

### 4. Esperar o deploy
Quando terminar, o backend ficara com uma URL parecida com:

- `https://visitas-leiteiras-api.onrender.com`

### 5. Testar
Abra no navegador:

- `https://SUA-URL.onrender.com/api/catalogs/areas`

Se aparecer a lista de areas, o backend esta funcionando.

---

# 2) Backend no Railway

Use esta opcao somente se preferir Railway.

## Passo a passo

### 1. Criar conta
- Acesse: `https://railway.app`
- Entre com GitHub

### 2. Criar projeto
- Clique em **New Project**
- Escolha **Deploy from GitHub repo**
- Selecione o repositorio

### 3. Criar banco
- Dentro do projeto, clique em **New**
- Escolha **Database > PostgreSQL**

### 4. Configurar variaveis no servico da API
No servico da API, adicione:

- `DATABASE_URL` = connection string do PostgreSQL do Railway
- `JWT_ACCESS_SECRET` = qualquer valor longo
- `JWT_REFRESH_SECRET` = qualquer valor longo
- `JWT_ACCESS_TTL` = `15m`
- `JWT_REFRESH_TTL_DAYS` = `30`

### 5. Configurar comandos
Se o Railway pedir comandos manualmente, use:

- **Build Command:** `npm install && npm run build:api:cloud`
- **Start Command:** `npm run start:api:prod`

### 6. Rodar migration e seed
No console/deploy command do Railway, rode:

- `npm --workspace apps/api run prisma:deploy`
- `npm --workspace apps/api run db:seed`

Depois disso o backend estara pronto.

---

# 3) Web gestor na Vercel

## Passo a passo

### 1. Criar conta
- Acesse: `https://vercel.com`
- Entre com GitHub

### 2. Importar o repositorio
- Clique em **Add New > Project**
- Selecione o repositorio

### 3. Configurar o projeto
Antes de clicar em Deploy:

- em **Root Directory**, escolha `apps/web`

Se quiser expor a URL do backend no frontend, adicione:

- `NEXT_PUBLIC_API_URL` = `https://SUA-URL-DA-API/api`

### 4. Deploy
- Clique em **Deploy**

Pronto. O portal gestor abrira numa URL da Vercel.

---

# 4) Mobile tecnico na Expo

## Objetivo

Permitir ao usuario abrir o app no celular usando:

- **Expo Go**
- sem Node local
- sem Android Studio
- sem Xcode

## O que voce precisa

- conta gratuita em `https://expo.dev`
- app **Expo Go** instalado no celular
- repositorio no GitHub

## Como funciona neste projeto

O repositorio ja possui um workflow GitHub Actions:

- `.github/workflows/mobile-expo-update.yml`

Esse workflow publica o app mobile pela nuvem, sem depender do computador do usuario.

## Passo a passo

### 1. Criar conta na Expo
- Acesse `https://expo.dev`
- Crie sua conta

### 2. Criar um access token
- No painel da Expo, abra **Account Settings**
- Abra **Access Tokens**
- Clique em **Create Token**

Guarde esse token.

### 3. Criar o projeto na Expo
No painel da Expo:

- clique em **New Project**
- use o nome `visitas-leiteiras`

Copie o **Project ID** gerado pela Expo.

### 4. Configurar secrets/variables no GitHub
No GitHub do repositorio:

- **Settings > Secrets and variables > Actions**

Adicione:

#### Secret
- `EXPO_TOKEN` = token criado na Expo

#### Variables
- `EXPO_OWNER` = seu usuario da Expo
- `EXPO_PROJECT_ID` = project id da Expo
- `EXPO_PUBLIC_API_URL` = `https://SUA-URL-DA-API/api`

### 5. Rodar a publicacao
No GitHub:

- abra a aba **Actions**
- selecione **Mobile Expo Publish**
- clique em **Run workflow**

### 6. Abrir no celular
Depois que o workflow terminar:

- abra o projeto no painel da Expo
- pegue o link/QR Code publicado
- escaneie no **Expo Go**

Assim o celular abrirá o app apontando para a API em nuvem.

---

# 5) Credenciais iniciais para teste

Depois do seed do backend:

- Tecnico: `tecnico@visitasleiteiras.com`
- Gestor: `gestor@visitasleiteiras.com`
- Senha: `123456`

---

# 6) Resumo ultra-simples

Se quiser o caminho mais facil:

## Backend
- Render
- conectar GitHub
- usar o `render.yaml`

## Web
- Vercel
- conectar GitHub
- root directory `apps/web`

## Mobile
- Expo
- criar token
- colar 1 secret + 3 variables no GitHub
- rodar a action **Mobile Expo Publish**
- abrir com Expo Go

---

# 7) Arquivos principais de deploy

- `render.yaml`
- `railway.json`
- `Procfile`
- `apps/web/vercel.json`
- `apps/mobile/app.config.ts`
- `apps/mobile/eas.json`
- `apps/mobile/.env.example`
- `.github/workflows/mobile-expo-update.yml`

---

# 8) Observacoes importantes

- O backend foi preparado para usar a URL do banco em `DATABASE_URL`
- O mobile usa `EXPO_PUBLIC_API_URL`
- O web pode usar `NEXT_PUBLIC_API_URL` se voce quiser ligar o frontend ao backend depois
- Se o Render ou Railway mudarem as regras de plano gratuito, escolha o que estiver oferecendo melhor opcao no momento

---

# 9) Se quiser o caminho mais rapido para teste hoje

Minha recomendacao:

1. **Render** para API + banco
2. **Vercel** para web
3. **Expo** com GitHub Action para publicar o mobile

Esse é o fluxo com menos dependência do computador corporativo.