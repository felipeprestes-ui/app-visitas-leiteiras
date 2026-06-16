-- Corrige coluna id da tabela Visit para gerar UUID automaticamente
-- Isso resolve o erro "null value in column id" quando o portal envia sem id

-- Adiciona extensao uuid-ossp se nao existir
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Altera a coluna id para ter DEFAULT gen_random_uuid()
ALTER TABLE "Visit" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

-- Corrige colunas da tabela monthly_sales
ALTER TABLE "monthly_sales" ALTER COLUMN "updatedAt" DROP NOT NULL;
ALTER TABLE "monthly_sales" ALTER COLUMN "updatedAt" SET DEFAULT now();
ALTER TABLE "monthly_sales" ALTER COLUMN "createdAt" DROP NOT NULL;
ALTER TABLE "monthly_sales" ALTER COLUMN "createdAt" SET DEFAULT now();
