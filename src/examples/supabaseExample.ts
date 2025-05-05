import { supabase } from '../lib/supabaseClient'
import { Cliente, Servico, Agendamento, AgendamentoCompleto, StatusAgendamento } from '../types/supabase'

// Operações para Clientes
export async function buscarClientes(): Promise<Cliente[]> {
  try {
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .order('nome')
    
    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Erro ao buscar clientes:', error)
    return []
  }
}

export async function criarCliente(nome: string, telefone: string, email?: string): Promise<Cliente | null> {
  try {
    const { data, error } = await supabase
      .from('clientes')
      .insert([{ nome, telefone, email }])
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Erro ao criar cliente:', error)
    return null
  }
}

export async function atualizarCliente(
  id: number, 
  dados: Partial<Omit<Cliente, 'id' | 'created_at'>>
): Promise<Cliente | null> {
  try {
    const { data, error } = await supabase
      .from('clientes')
      .update(dados)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Erro ao atualizar cliente:', error)
    return null
  }
}

export async function deletarCliente(id: number): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('clientes')
      .delete()
      .eq('id', id)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Erro ao deletar cliente:', error)
    return false
  }
}

// Operações para Serviços
export async function buscarServicos(): Promise<Servico[]> {
  try {
    const { data, error } = await supabase
      .from('servicos')
      .select('*')
      .order('nome')
    
    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Erro ao buscar serviços:', error)
    return []
  }
}

export async function criarServico(nome: string, duracao: number, preco: number): Promise<Servico | null> {
  try {
    // Validação dos dados
    if (!nome || !duracao || !preco) {
      throw new Error('Todos os campos são obrigatórios')
    }

    // Garante que os tipos estejam corretos
    const dadosServico = {
      nome: String(nome),
      duracao: Number(duracao),
      preco: Number(preco)
    }

    console.log('Tentando criar serviço com dados:', dadosServico)

    const { data, error } = await supabase
      .from('servicos')
      .insert([dadosServico])
      .select()
      .single()

    if (error) {
      console.error('Erro detalhado do Supabase:', error)
      throw error
    }

    console.log('Serviço criado com sucesso:', data)
    return data
  } catch (error) {
    console.error('Erro ao criar serviço:', error)
    throw error
  }
}

export async function atualizarServico(
  id: number, 
  dados: Partial<Omit<Servico, 'id' | 'created_at'>>
): Promise<Servico | null> {
  try {
    const { data, error } = await supabase
      .from('servicos')
      .update(dados)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Erro ao atualizar serviço:', error)
    return null
  }
}

export async function deletarServico(id: number): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('servicos')
      .delete()
      .eq('id', id)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Erro ao deletar serviço:', error)
    return false
  }
}

// Operações para Agendamentos
export async function buscarAgendamentos(): Promise<AgendamentoCompleto[]> {
  try {
    const { data, error } = await supabase
      .from('agendamentos')
      .select(`
        *,
        clientes:cliente_id(nome, telefone, email),
        servicos:servico_id(nome, duracao, preco)
      `)
      .order('data')
      .order('horario')
    
    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Erro ao buscar agendamentos:', error)
    return []
  }
}

export async function criarAgendamento(
  cliente_id: number,
  servico_id: number,
  data: string,
  horario: string,
  status: StatusAgendamento = 'pendente'
): Promise<AgendamentoCompleto | null> {
  try {
    const { data: agendamento, error } = await supabase
      .from('agendamentos')
      .insert([{ cliente_id, servico_id, data, horario, status }])
      .select(`
        *,
        clientes:cliente_id(nome, telefone, email),
        servicos:servico_id(nome, duracao, preco)
      `)
      .single()

    if (error) throw error
    return agendamento
  } catch (error) {
    console.error('Erro ao criar agendamento:', error)
    return null
  }
}

export async function atualizarAgendamento(
  id: number,
  dados: Partial<Omit<Agendamento, 'id' | 'created_at' | 'clientes' | 'servicos'>>
): Promise<AgendamentoCompleto | null> {
  try {
    const { data, error } = await supabase
      .from('agendamentos')
      .update(dados)
      .eq('id', id)
      .select(`
        *,
        clientes:cliente_id(nome, telefone, email),
        servicos:servico_id(nome, duracao, preco)
      `)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Erro ao atualizar agendamento:', error)
    return null
  }
}

export async function deletarAgendamento(id: number): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('agendamentos')
      .delete()
      .eq('id', id)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Erro ao deletar agendamento:', error)
    return false
  }
} 