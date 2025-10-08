-- CreateTable
CREATE TABLE "AiMetric" (
    "id" TEXT NOT NULL,
    "ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "operation" TEXT NOT NULL,
    "latencyMs" INTEGER NOT NULL,
    "success" BOOLEAN NOT NULL,
    "errorType" TEXT,
    "retries" INTEGER NOT NULL DEFAULT 0,
    "tokensIn" INTEGER,
    "tokensOut" INTEGER,
    "costUsd" DECIMAL(10,6) NOT NULL DEFAULT 0,
    "meta" JSONB,

    CONSTRAINT "AiMetric_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AiMetric_ts_idx" ON "AiMetric"("ts");

-- CreateIndex
CREATE INDEX "AiMetric_provider_model_idx" ON "AiMetric"("provider", "model");

-- CreateIndex
CREATE INDEX "AiMetric_success_idx" ON "AiMetric"("success");

-- CreateIndex
CREATE INDEX "AiMetric_operation_idx" ON "AiMetric"("operation");
