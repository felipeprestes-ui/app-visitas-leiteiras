# Como testar o app no celular — Expo Snack

Nao precisa instalar nada no computador. Siga os 4 passos abaixo.

---

## 1. Instale o Expo Go no celular

- **Android**: [Google Play — Expo Go](https://play.google.com/store/apps/details?id=host.exp.exponent)
- **iPhone**: [App Store — Expo Go](https://apps.apple.com/app/expo-go/id982107779)

---

## 2. Abra o Snack no navegador

Acesse no navegador do computador:

> **https://snack.expo.dev**

---

## 3. Cole o codigo

1. No Snack, clique no arquivo **App.js** (painel esquerdo)
2. Selecione tudo (`Ctrl+A`) e apague
3. Abra o arquivo `snack/App.js` deste projeto
4. Copie TODO o conteudo (`Ctrl+A` → `Ctrl+C`)
5. Cole no Snack (`Ctrl+V`)
6. Clique em **Save** (ou `Ctrl+S`)

---

## 4. Abra no celular

### Opcao A — QR Code (mais facil)
1. No Snack, clique em **My Device** (canto direito)
2. Um QR Code aparece na tela
3. Abra o app **Expo Go** no celular
4. Escaneie o QR Code com a camera do Expo Go

### Opcao B — URL direta
1. No Snack, copie a URL do navegador (ex: `https://snack.expo.dev/@seu-usuario/abc123`)
2. No celular, abra o Expo Go → "Enter URL manually" → cole a URL

---

## Credenciais de acesso

| Perfil   | E-mail              | Senha  |
|----------|---------------------|--------|
| Tecnico  | tecnico@app.com     | 123456 |
| Gestor   | gestor@app.com      | 123456 |

---

## O que voce pode testar

- **Login** — com as credenciais acima
- **Home** — resumo com contadores de visitas, agendas e clientes
- **Nova visita** — formulario completo com todas as regras:
  - Tipo de cliente: B / C / Conexao Leite / KAM / Lagoa+
  - Servico: todos os 10 tipos
  - Campo "N animais" aparece **somente** para: SireMatch, Coleta Herd, Venda Herd
  - Negocio fechado: toggle sim/nao
  - Validacao dos campos obrigatorios
- **Agenda** — criar e listar agendamentos
- **Clientes** — cadastrar com area, consultor e tipo
- **Visitas** — historico de todas as visitas salvas
- **Logout** — desconectar

---

## Observacoes tecnicas

- Todos os dados ficam salvos **localmente no celular** via AsyncStorage
- Nao precisa de internet para usar (offline-first)
- O Snack usa apenas bibliotecas padrao do Expo (sem dependencias extras)
- Se aparecer erro "Unable to resolve module", recarregue o Snack (`r` no terminal do Snack)
