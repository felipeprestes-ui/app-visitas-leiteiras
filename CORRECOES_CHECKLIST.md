# CHECKLIST DE CORRECOES - Portal Web + App

## ✅ CORRIGIDO NO PORTAL WEB (apps/web/src/lib/supabase.ts)

### 1. Nova Visita — erro "animals column"
- **Causa**: upsertVisit enviava campo `animals` que nao existe no Supabase
- **Correcao**: Mapeado corretamente para `mudas`, `animaisAcasalados` e `client_name`

### 2. Nova Venda — erro "null id"
- **Causa**: monthly_sales exige `id` mas nao estava gerando automatico no POST
- **Correcao**: Adicionado geracao de UUID automatico no upsertSale

### 3. Tecnico nao edita/salva
- **Causa**: Campo `areas` (array) enviado mas nao existe na tabela User do Supabase
- **Correcao**: Removido `areas` do payload e normalizado area para 3 digitos

### 4. Area duplicada (012 vs 12)
- **Correcao**: Normalizacao padStart(3,'0') aplicada em todas as operacoes

### 5. Nome cliente vazio
- **Correcao**: mapSupabaseToVisit agora le `client_name` diretamente do Supabase

---

## 📋 AINDA PRECISA FAZER (requer intervencao do usuario)

### Web — Meta doses NOVOS
- Inserir metas na tabela `monthly_sales` via SQL Editor:

```sql
-- Meta total = 34.517 doses novos (soma dos meses)
-- Distribuicao por mes (equipe toda):
INSERT INTO monthly_sales (id, month, dosesNovos, dosesAtivos, meta, faturamentoNovos, faturamentoAtivos, technicianName, updatedBy)
VALUES
  (gen_random_uuid(), '2025-09', 0, 0, 3381, 0, 0, 'EQUIPE', 'gestor'),
  (gen_random_uuid(), '2025-10', 0, 0, 3063, 0, 0, 'EQUIPE', 'gestor'),
  (gen_random_uuid(), '2025-11', 0, 0, 2946, 0, 0, 'EQUIPE', 'gestor'),
  (gen_random_uuid(), '2025-12', 0, 0, 2097, 0, 0, 'EQUIPE', 'gestor'),
  (gen_random_uuid(), '2026-01', 0, 0, 2610, 0, 0, 'EQUIPE', 'gestor'),
  (gen_random_uuid(), '2026-02', 0, 0, 2712, 0, 0, 'EQUIPE', 'gestor'),
  (gen_random_uuid(), '2026-03', 0, 0, 1503, 0, 0, 'EQUIPE', 'gestor'),
  (gen_random_uuid(), '2026-04', 0, 0, 2650, 0, 0, 'EQUIPE', 'gestor'),
  (gen_random_uuid(), '2026-05', 0, 0, 3100, 0, 0, 'EQUIPE', 'gestor'),
  (gen_random_uuid(), '2026-06', 0, 0, 3123, 0, 0, 'EQUIPE', 'gestor'),
  (gen_random_uuid(), '2026-07', 0, 0, 3232, 0, 0, 'EQUIPE', 'gestor'),
  (gen_random_uuid(), '2026-08', 0, 0, 4100, 0, 0, 'EQUIPE', 'gestor');
```

Para metas por tecnico, divida os valores por 5 (nro de tecnicos ativos).

### Web — PDF com graficos
- Requer implementacao adicional (jsPDF+html2canvas)

### App Mobile
- Correcoes sync erros + mostrar tecnico + filtro mes atual
- Necessario gerar nova APK (standalone/App.js ja corrigido)

---

## 🚀 COMO DEPLOYAR O PORTAL WEB

1. Va em https://github.com/felipeprestes-ui/app-visitas-leiteiras
2. Clique em `.github/workflows/deploy-web.yml`
3. Clique no botao verde "Run workflow" (ou faca qualquer commit na raiz)
4. Aguarde o build completar (~2 min)
5. Acesse: https://felipeprestes-ui.github.io/app-visitas-leiteiras/login

---

## 🚀 COMO SUBIR A APK NOVA (quando estiver pronta)

1. Va em https://github.com/felipeprestes-ui/app-visitas-leiteiras
2. Clique em "Add file" → "Upload files"
3. Selecione o arquivo `standalone/App.js` corrigido
4. Commit: "Correcoes app mobile - sync e display"
5. Va em "Actions" → workflow "Build APK"
6. Baixe a APK gerada
7. Envie para os tecnicos via WhatsApp/Slack

---

## 🗄️ SQL PARA CORRIGIR COLUNAS NO SUPABASE (ja aplicado)

```sql
-- Ja aplicado anteriormente:
ALTER TABLE "Visit" ALTER COLUMN "consultant" DROP NOT NULL;
ALTER TABLE "Visit" ALTER COLUMN "mudas" DROP NOT NULL;

-- Trigger para preencher consultant automaticamente:
CREATE OR REPLACE FUNCTION set_default_consultant()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW."consultant" IS NULL OR NEW."consultant" = '' THEN
    NEW."consultant" = COALESCE(NEW."techName", 'Nao informado');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_default_consultant ON "Visit";
CREATE TRIGGER trigger_set_default_consultant
BEFORE INSERT ON "Visit"
FOR EACH ROW
EXECUTE FUNCTION set_default_consultant();
```
