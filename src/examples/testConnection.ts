import { supabase } from '../lib/supabaseClient'

export async function testConnection() {
  try {
    // Testa a conexão buscando um cliente
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .limit(1)

    if (error) {
      console.error('Erro na conexão:', error)
      return false
    }

    console.log('Conexão com Supabase estabelecida com sucesso!')
    return true
  } catch (error) {
    console.error('Erro ao testar conexão:', error)
    return false
  }
} 