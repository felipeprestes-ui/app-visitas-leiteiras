# Guia de Deploy — App Visitas Leiteiras

> Voce nao precisa instalar Node.js, Docker nem nenhum programa no computador.
> Tudo e feito pelo navegador e pelo GitHub.

---

## O que voce vai ter no final

| Servico | O que faz | Link apos deploy |
|---|---|---|
| **Render** | Roda a API + banco de dados | `https://visitas-leiteiras-api.onrender.com` |
| **Vercel** | Roda o portal do gestor | `https://visitas-leiteiras-web.vercel.app` |
| **Expo Go** | App do tecnico no celular | QR Code no painel da Expo |

---

## Antes de comecar

Voce precisa de:

1. Uma conta no **GitHub** com este repositorio enviado
2. Acesso ao **e-mail** para criar contas nos servicos abaixo

---

# PARTE 1 — Backend no Render

> **Tempo estimado: 5 minutos**
> O Render cuida do banco PostgreSQL e da API automaticamente.

## Passo 1 — Criar conta no Render

1. Abra o navegador e acesse: **https://render.com**
2. Clique em **Get Started for Free**
3. Clique em **Continue with GitHub**
4. Autorize o acesso

## Passo 2 — Criar o servico com Blueprint

O projeto ja tem o arquivo `render.yaml` na raiz — ele configura tudo automaticamente.

1. No painel do Render, clique em **New +** (canto superior direito)
2. Escolha **Blueprint**
3. Clique em **Connect a repository**
4. Selecione o repositorio `app-visitas-leiteiras`
5. Clique em **Connect**

O Render vai ler o `render.yaml` e mostrar:
- banco de dados: `visitas-leiteiras-db`
- servico web: `visitas-leiteiras-api`

6. Clique em **Apply**

## Passo 3 — Aguardar o deploy

O primeiro deploy demora **5 a 10 minutos**.

Voce pode acompanhar clicando no servico `visitas-leiteiras-api` → aba **Logs**.

Quando aparecer a linha:

```
Application is running on port XXXX
```

O backend esta no ar.

## Passo 4 — Criar os usuarios iniciais (seed)

As tabelas do banco sao criadas automaticamente durante o deploy (o `render.yaml` cuida disso).

Voce so precisa rodar o seed **uma unica vez** para criar os usuarios de teste:

1. No painel do Render, abra o servico `visitas-leiteiras-api`
2. Clique na aba **Shell**
3. Digite o comando:

```
npm --workspace apps/api run db:seed
```

Aguarde terminar. Pronto — o banco agora tem os usuarios de teste.

## Passo 5 — Anotar a URL do backend

Na pagina do servico `visitas-leiteiras-api`, copie a URL que aparece no topo.
Ela vai parecer com:

```
https://visitas-leiteiras-api.onrender.com
```

**Guarde esta URL. Voce vai precisar dela nos proximos passos.**

## Verificar se funcionou

Abra no navegador:

```
https://SUA-URL.onrender.com/api/catalogs/areas
```

Se aparecer `["011","012","013",...]`, o backend esta funcionando.

---

# PARTE 2 — Portal do Gestor na Vercel

> **Tempo estimado: 3 minutos**

## Passo 1 — Criar conta na Vercel

1. Acesse: **https://vercel.com**
2. Clique em **Sign Up**
3. Clique em **Continue with GitHub**
4. Autorize o acesso

## Passo 2 — Importar o repositorio

1. No painel da Vercel, clique em **Add New... > Project**
2. Selecione o repositorio `app-visitas-leiteiras`
3. Clique em **Import**

## Passo 3 — Configurar o projeto

Na tela de configuracao:

- **Framework Preset**: Next.js (ja deve detectar automaticamente)
- **Root Directory**: clique em **Edit** e digite `apps/web`
- **Install Command**: `cd ../.. && npm install`
- **Build Command**: `cd ../.. && npm run build:web:cloud`
- **Output Directory**: `.next`

> Se quiser que o portal mostre dados da API, adicione em **Environment Variables**:
> - Nome: `NEXT_PUBLIC_API_URL`
> - Valor: `https://SUA-URL-DO-RENDER.onrender.com/api`

## Passo 4 — Fazer o deploy

Clique em **Deploy**.

Aguarde 2 a 3 minutos. Quando terminar, a Vercel mostra o link do portal.

**Acesse com:**
- E-mail: `gestor@visitasleiteiras.com`
- Senha: `123456`

---

# PARTE 3 — App Mobile no Expo Go

> **Tempo estimado: 10 minutos**
>
> O app roda no celular via **Expo Go**, sem precisar instalar nada no computador.
> O GitHub Actions publica o app automaticamente quando voce configura os dados abaixo.

## O que e Expo Go

**Expo Go** e um app gratuito disponivel na Play Store e App Store.
Ele consegue abrir projetos React Native publicados na nuvem via QR Code.

## Passo 1 — Instalar o Expo Go no celular

- **Android**: [Play Store — Expo Go](https://play.google.com/store/apps/details?id=host.exp.exponent)
- **iPhone**: [App Store — Expo Go](https://apps.apple.com/app/expo-go/id982107779)

## Passo 2 — Criar conta na Expo

1. Acesse: **https://expo.dev**
2. Clique em **Sign Up**
3. Crie a conta (pode usar GitHub)
4. Anote seu **nome de usuario** (voce vai precisar)

## Passo 3 — Criar o projeto na Expo

1. No painel da Expo, clique em **Create a project**
2. Use o nome: `visitas-leiteiras`
3. Apos criar, clique no projeto
4. Copie o **Project ID** (parece com `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)

## Passo 4 — Criar um Access Token na Expo

1. Clique no seu avatar (canto superior direito)
2. Clique em **Account settings**
3. Abra a aba **Access Tokens**
4. Clique em **Create Token**
5. De um nome qualquer (ex: `github-actions`)
6. Copie o token gerado (aparece so uma vez)

## Passo 5 — Adicionar dados no GitHub

No GitHub do repositorio:

1. Clique em **Settings**
2. No menu lateral, clique em **Secrets and variables > Actions**

### Adicionar o Secret (dado secreto):

Clique em **New repository secret**:

| Name | Value |
|---|---|
| `EXPO_TOKEN` | o token que voce copiou na Expo |

### Adicionar as Variables (dados publicos):

Clique na aba **Variables** → **New repository variable** (3 vezes):

| Name | Value |
|---|---|
| `EXPO_OWNER` | seu nome de usuario da Expo |
| `EXPO_PROJECT_ID` | o Project ID copiado |
| `EXPO_PUBLIC_API_URL` | `https://SUA-URL-DO-RENDER.onrender.com/api` |

## Passo 6 — Publicar o app

1. No GitHub, clique na aba **Actions**
2. Selecione o workflow **Mobile - Publicar no Expo**
3. Clique em **Run workflow** → **Run workflow**

Aguarde 3 a 5 minutos. O workflow instala as dependencias e publica o update.

## Passo 7 — Abrir no celular

1. Acesse **https://expo.dev** pelo navegador
2. Entre no projeto `visitas-leiteiras`
3. Clique na aba **Updates**
4. Clique no update publicado
5. Escaneie o **QR Code** com o app **Expo Go** no celular

O app vai abrir no celular apontando para a API no Render.

**Acesse com:**
- E-mail: `tecnico@visitasleiteiras.com`
- Senha: `123456`

---

# Credenciais de teste

| Tipo | E-mail | Senha |
|---|---|---|
| Tecnico | `tecnico@visitasleiteiras.com` | `123456` |
| Gestor | `gestor@visitasleiteiras.com` | `123456` |

---

# Resumo dos arquivos de configuracao

| Arquivo | Para que serve |
|---|---|
| `render.yaml` | Configura API + banco no Render automaticamente |
| `vercel.json` | Configura o deploy do portal na Vercel |
| `apps/mobile/app.config.ts` | Configuracao do app Expo (projectId, apiUrl, updates) |
| `apps/mobile/eas.json` | Configuracao do EAS Build e EAS Update |
| `apps/mobile/.env.example` | Variaveis de ambiente para desenvolvimento local |
| `apps/api/.env.example` | Variaveis de ambiente da API para desenvolvimento local |
| `.github/workflows/mobile-expo-update.yml` | Workflow que publica o mobile automaticamente |

---

# Duvidas frequentes

**O Render vai cobrar alguma coisa?**
Nao para o plano gratuito. O banco PostgreSQL gratuito do Render tem limite de 1 GB, suficiente para testes.

**O app para de funcionar apos um tempo?**
No plano gratuito do Render, o servico "dorme" apos 15 minutos sem uso e demora ~30 segundos para acordar na proxima requisicao. Isso e normal em ambiente de teste.

**Posso usar o mesmo repositorio para varios deploys?**
Sim. Cada push na branch `main` republica automaticamente o Render, a Vercel e o Expo (se tiver mudancas no mobile).

**Como atualizar a URL da API no mobile depois do deploy?**
Atualize a variable `EXPO_PUBLIC_API_URL` no GitHub (Settings > Actions > Variables) e rode novamente o workflow **Mobile - Publicar no Expo**.
