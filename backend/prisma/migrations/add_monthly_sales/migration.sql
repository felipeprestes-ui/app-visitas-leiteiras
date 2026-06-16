-- CreateTable: monthly_sales
-- Executa manualmente no banco PostgreSQL do Render

CREATE TABLE IF NOT EXISTS "monthly_sales" (
    "id"                  TEXT         NOT NULL,
    "month"               TEXT         NOT NULL,
    "dosesNovos"          INTEGER      NOT NULL,
    "dosesAtivos"         INTEGER      NOT NULL,
    "faturamentoNovos"    DOUBLE PRECISION NOT NULL,
    "faturamentoAtivos"   DOUBLE PRECISION NOT NULL,
    "updatedBy"           TEXT         NOT NULL,
    "updatedAt"           TIMESTAMP(3) NOT NULL,
    "createdAt"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "monthly_sales_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: unique constraint on month
CREATE UNIQUE INDEX IF NOT EXISTS "monthly_sales_month_key" ON "monthly_sales"("month");
