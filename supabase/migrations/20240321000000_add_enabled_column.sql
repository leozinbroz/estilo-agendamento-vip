-- Adicionar coluna enabled na tabela automacao
ALTER TABLE automacao ADD COLUMN IF NOT EXISTS enabled BOOLEAN DEFAULT false;

-- Atualizar registros existentes para ter enabled = true
UPDATE automacao SET enabled = true WHERE enabled IS NULL; 