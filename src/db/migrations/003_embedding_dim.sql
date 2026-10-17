-- Embeddings can come from different providers (OpenAI text-embedding-3-small is
-- 1536-dim, NVIDIA nv-embedqa/nemotron models are 2048-dim). Store an
-- unconstrained vector so any provider works; the knowledge base is re-embedded
-- on every boot, so all rows always share the currently configured dimension.
TRUNCATE knowledge_chunks;

ALTER TABLE knowledge_chunks
  ALTER COLUMN embedding TYPE vector;
