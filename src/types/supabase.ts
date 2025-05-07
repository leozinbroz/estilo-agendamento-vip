export type Cliente = {
  id: number
  nome: string
  telefone: string
  email?: string
  created_at: string
}

export type Servico = {
  id: number
  nome: string
  duracao: number
  preco: number
  created_at: string
}

export type StatusAgendamento = 'pendente' | 'confirmado' | 'cancelado'

export type Agendamento = {
  id: number
  cliente_id: number
  servico_id: number
  data: string
  horario: string
  status: StatusAgendamento
  created_at: string
  clientes?: Cliente
  servicos?: Servico
}

export type AgendamentoCompleto = Agendamento & {
  clientes: Cliente
  servicos: Servico
}

export type Automacao = {
  id: string
  barbearia_id: string
  enabled: boolean
  api_url: string | null
  api_key: string | null
  whatsapp_number: string | null
  lembrete_mensagem: string | null
  lembrete_tempo: '2min' | '30min' | '1h' | '2h' | null
  created_at: string
  updated_at: string
} 