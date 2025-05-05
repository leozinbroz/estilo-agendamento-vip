import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

export function TestService() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [servicos, setServicos] = useState<any[]>([])

  // Função para buscar serviços
  const buscarServicos = async () => {
    try {
      console.log('🔄 Buscando serviços...')
      const { data, error } = await supabase
        .from('servicos')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Erro ao buscar:', error)
        return
      }

      console.log('📋 Serviços encontrados:', data)
      setServicos(data || [])
    } catch (error) {
      console.error('Erro ao buscar serviços:', error)
    }
  }

  // Carrega a lista inicial
  useEffect(() => {
    buscarServicos()
  }, [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      console.log('📝 Iniciando inserção...')
      const { data, error } = await supabase
        .from('servicos')
        .insert([
          {
            nome: 'Teste Fixo',
            duracao: 30,
            preco: 50.00,
            created_at: new Date().toISOString()
          }
        ])
        .select()
        .single()

      if (error) {
        console.error('Erro na inserção:', error)
        throw error
      }

      console.log('✅ Serviço inserido:', data)
      setMessage('✅ Serviço criado com sucesso!')
      
      // Aguarda um momento antes de atualizar a lista
      setTimeout(() => {
        buscarServicos()
      }, 500)

    } catch (error: any) {
      console.error('Erro completo:', error)
      setMessage(`❌ Erro: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Teste de Inserção</h1>
      
      <form onSubmit={handleSubmit} className="mb-8">
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Criando...' : 'Criar Serviço de Teste'}
        </button>

        {message && (
          <p className={`text-sm mt-4 ${message.includes('❌') ? 'text-red-600' : 'text-green-600'}`}>
            {message}
          </p>
        )}
      </form>

      <div className="mt-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Serviços Cadastrados</h2>
          <button
            onClick={buscarServicos}
            className="text-sm bg-gray-200 px-3 py-1 rounded hover:bg-gray-300"
          >
            Atualizar Lista
          </button>
        </div>

        {servicos.length === 0 ? (
          <p className="text-gray-500">Nenhum serviço cadastrado</p>
        ) : (
          <ul className="space-y-2">
            {servicos.map((servico) => (
              <li key={servico.id} className="border p-3 rounded">
                <p><strong>Nome:</strong> {servico.nome}</p>
                <p><strong>Duração:</strong> {servico.duracao} minutos</p>
                <p><strong>Preço:</strong> R$ {servico.preco.toFixed(2)}</p>
                <p className="text-sm text-gray-500">
                  <strong>Criado em:</strong> {new Date(servico.created_at).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
} 