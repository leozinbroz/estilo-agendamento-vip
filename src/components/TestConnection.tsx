import { useEffect, useState } from 'react'
import { testConnection } from '../examples/testConnection'
import { buscarClientes, criarCliente, buscarServicos, criarServico, buscarAgendamentos, criarAgendamento } from '../examples/supabaseExample'
import { TestService } from './TestService'

export function TestConnection() {
  const [status, setStatus] = useState<string>('Testando conexão...')
  const [dados, setDados] = useState<any>(null)

  useEffect(() => {
    async function testarConexao() {
      try {
        // Testa a conexão
        const conectado = await testConnection()
        if (!conectado) {
          setStatus('Erro na conexão com o Supabase')
          return
        }
        setStatus('Conexão estabelecida!')

        // Testa operações básicas
        const clientes = await buscarClientes()
        const servicos = await buscarServicos()
        const agendamentos = await buscarAgendamentos()

        setDados({
          clientes,
          servicos,
          agendamentos
        })
      } catch (error) {
        console.error('Erro no teste:', error)
        setStatus('Erro durante os testes')
      }
    }

    testarConexao()
  }, [])

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Teste de Conexão</h2>
      <p className="mb-4">Status: {status}</p>
      
      <TestService />
      
      {dados && (
        <div className="space-y-4 mt-4">
          <div>
            <h3 className="font-semibold">Clientes ({dados.clientes.length})</h3>
            <pre className="bg-gray-100 p-2 rounded overflow-auto">
              {JSON.stringify(dados.clientes, null, 2)}
            </pre>
          </div>

          <div>
            <h3 className="font-semibold">Serviços ({dados.servicos.length})</h3>
            <pre className="bg-gray-100 p-2 rounded overflow-auto">
              {JSON.stringify(dados.servicos, null, 2)}
            </pre>
          </div>

          <div>
            <h3 className="font-semibold">Agendamentos ({dados.agendamentos.length})</h3>
            <pre className="bg-gray-100 p-2 rounded overflow-auto">
              {JSON.stringify(dados.agendamentos, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
} 