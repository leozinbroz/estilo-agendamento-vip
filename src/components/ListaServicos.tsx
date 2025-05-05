import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { Servico } from '../types/supabase'

export function ListaServicos() {
  const [servicos, setServicos] = useState<Servico[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Carrega os serviços inicialmente
    carregarServicos()

    // Inscreve para atualizações em tempo real
    const channel = supabase
      .channel('servicos_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'servicos'
        },
        () => {
          carregarServicos()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  async function carregarServicos() {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('servicos')
        .select('*')
        .order('nome')

      if (error) {
        throw error
      }

      console.log('Serviços carregados:', data)
      setServicos(data || [])
    } catch (err: any) {
      console.error('Erro ao carregar serviços:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="p-4">Carregando serviços...</div>
  }

  if (error) {
    return <div className="p-4 text-red-600">Erro: {error}</div>
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Serviços Cadastrados</h2>
      
      {servicos.length === 0 ? (
        <p>Nenhum serviço cadastrado.</p>
      ) : (
        <div className="space-y-4">
          {servicos.map((servico) => (
            <div
              key={servico.id}
              className="border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <h3 className="font-semibold">{servico.nome}</h3>
              <div className="mt-2 text-sm text-gray-600">
                <p>Duração: {servico.duracao} minutos</p>
                <p>Preço: R$ {servico.preco.toFixed(2)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
} 