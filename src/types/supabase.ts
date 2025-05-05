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