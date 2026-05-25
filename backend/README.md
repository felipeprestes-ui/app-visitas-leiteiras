# App Visitas Leiteiras - Backend API

## Setup

```bash
cd backend
npm install
cp .env.example .env
# Edite .env com suas credenciais do PostgreSQL

npx prisma generate
npx prisma migrate deploy
npm run db:seed   # cria gestor padrao (gestor@visitas.com / gestor123)

npm run dev       # desenvolvimento
npm start         # producao
```

## Endpoints

### Autenticacao
| Metodo | Rota | Descricao | Auth |
|--------|------|-----------|------|
| POST | /auth/login | Login | Nao |
| POST | /auth/register | Registrar tecnico | Gestor |
| GET | /auth/me | Dados do usuario logado | Sim |

### Visitas
| Metodo | Rota | Descricao | Auth |
|--------|------|-----------|------|
| GET | /visits | Listar (gestor=todas, tecnico=suas) | Sim |
| POST | /visits | Criar visita | Sim |
| PUT | /visits/:id | Atualizar visita | Sim |
| DELETE | /visits/:id | Remover visita | Sim |
| POST | /visits/sync | Sincronizacao em lote | Sim |

### Agendas
| Metodo | Rota | Descricao | Auth |
|--------|------|-----------|------|
| GET | /schedules | Listar agendas | Sim |
| POST | /schedules | Criar agenda | Sim |
| PUT | /schedules/:id | Atualizar agenda | Sim |
| DELETE | /schedules/:id | Remover agenda | Sim |
| POST | /schedules/sync | Sincronizacao em lote | Sim |

### Clientes
| Metodo | Rota | Descricao | Auth |
|--------|------|-----------|------|
| GET | /clients | Listar clientes | Sim |
| POST | /clients | Criar cliente | Sim |
| PUT | /clients/:id | Atualizar cliente | Sim |
| POST | /clients/sync | Sincronizacao em lote | Sim |

### Tecnicos
| Metodo | Rota | Descricao | Auth |
|--------|------|-----------|------|
| GET | /techs | Listar tecnicos | Sim |
| POST | /techs | Criar tecnico | Gestor |
| PUT | /techs/:id | Atualizar tecnico | Gestor |

### Dashboard (apenas gestor)
| Metodo | Rota | Descricao |
|--------|------|-----------|
| GET | /dashboard/stats | Estatisticas gerais |
| GET | /dashboard/ranking | Ranking de tecnicos |
| GET | /dashboard/vendas | Dados de vendas/doses |

## Sincronizacao

O endpoint `/visits/sync` (e similares) aceita:
```json
{
  "visits": [ /* array de visitas locais */ ],
  "lastSyncAt": "2024-01-01T00:00:00.000Z"
}
```

Retorna:
```json
{
  "created": 5,
  "updated": 2,
  "errors": [],
  "serverVisits": [ /* visitas atualizadas no servidor */ ],
  "syncedAt": "2024-01-15T10:00:00.000Z"
}
```

## Deploy no Render

1. Conecte o repositorio no Render
2. Configure as variaveis de ambiente (DATABASE_URL, JWT_SECRET)
3. Build command: `npm install && npx prisma generate && npx prisma migrate deploy`
4. Start command: `npm start`
