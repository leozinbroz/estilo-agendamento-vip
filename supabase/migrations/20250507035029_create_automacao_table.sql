-- Create automacao table
CREATE TABLE IF NOT EXISTS automacao (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    barbearia_id UUID REFERENCES configuracoes(id) ON DELETE CASCADE,
    api_url TEXT NOT NULL DEFAULT 'https://api.textmebot.com/send.php',
    api_key TEXT NOT NULL DEFAULT 'Ba9nZksmFsnv',
    mensagem_padrao TEXT NOT NULL DEFAULT 'Olá {cliente}! Confirmação de agendamento na {barbearia}:\n\n📅 Data: {data}\n⏰ Horário: {horario}\n✂️ Serviço: {servico}\n📍 Endereço: {endereco}\n\nAguardamos você! 🤙',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_automacao_updated_at
    BEFORE UPDATE ON automacao
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default configuration for existing barber shops
INSERT INTO automacao (barbearia_id, api_url, api_key, mensagem_padrao)
SELECT id, 'https://api.textmebot.com/send.php', 'Ba9nZksmFsnv', 'Olá {cliente}! Confirmação de agendamento na {barbearia}:\n\n📅 Data: {data}\n⏰ Horário: {horario}\n✂️ Serviço: {servico}\n📍 Endereço: {endereco}\n\nAguardamos você! 🤙'
FROM configuracoes
WHERE NOT EXISTS (
    SELECT 1 FROM automacao WHERE automacao.barbearia_id = configuracoes.id
); 