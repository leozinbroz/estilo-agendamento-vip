-- Criar a tabela de automação
CREATE TABLE IF NOT EXISTS automacao (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    barbearia_id UUID NOT NULL REFERENCES configuracoes(id),
    enabled BOOLEAN DEFAULT false,
    api_url TEXT,
    api_key TEXT,
    whatsapp_number TEXT,
    lembrete_mensagem TEXT,
    lembrete_tempo TEXT CHECK (lembrete_tempo IN ('2min', '30min', '1h', '2h')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Criar índice para busca rápida por barbearia
CREATE INDEX IF NOT EXISTS idx_automacao_barbearia_id ON automacao(barbearia_id);

-- Criar função para atualizar o updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Criar trigger para atualizar o updated_at
CREATE TRIGGER update_automacao_updated_at
    BEFORE UPDATE ON automacao
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Adicionar políticas de segurança
ALTER TABLE automacao ENABLE ROW LEVEL SECURITY;

-- Política para leitura (permitir acesso anônimo)
CREATE POLICY "Permitir leitura para todos"
    ON automacao FOR SELECT
    USING (true);

-- Política para inserção (permitir acesso anônimo)
CREATE POLICY "Permitir inserção para todos"
    ON automacao FOR INSERT
    WITH CHECK (true);

-- Política para atualização (permitir acesso anônimo)
CREATE POLICY "Permitir atualização para todos"
    ON automacao FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- Política para deleção (permitir acesso anônimo)
CREATE POLICY "Permitir deleção para todos"
    ON automacao FOR DELETE
    USING (true); 