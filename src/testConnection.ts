import { supabase } from './lib/supabaseClient'

async function testConnection() {
  console.log('🚀 Iniciando teste direto...')

  try {
    // 1. Testa a conexão
    console.log('\n🔌 Testando conexão...')
    const { data: testData, error: testError } = await supabase
      .from('servicos')
      .select('*')
      .limit(1)

    if (testError) {
      console.error('❌ Erro na conexão:', testError)
      return
    }
    console.log('✅ Conexão estabelecida!')

    // 2. Insere um serviço
    console.log('\n📝 Inserindo serviço...')
    const { data: insertData, error: insertError } = await supabase
      .from('servicos')
      .insert([
        {
          nome: 'Teste Direto',
          duracao: 45,
          preco: 100.00,
          created_at: new Date().toISOString()
        }
      ])
      .select()
      .single()

    if (insertError) {
      console.error('❌ Erro na inserção:', insertError)
      return
    }
    console.log('✅ Serviço inserido:', insertData)

    // 3. Verifica se o serviço foi realmente inserido
    console.log('\n🔍 Verificando inserção...')
    const { data: verifyData, error: verifyError } = await supabase
      .from('servicos')
      .select('*')
      .eq('id', insertData.id)

    if (verifyError) {
      console.error('❌ Erro na verificação:', verifyError)
      return
    }
    console.log('✅ Serviço encontrado:', verifyData)

  } catch (error) {
    console.error('💥 Erro inesperado:', error)
  }
}

// Executa o teste
console.log('Iniciando teste direto...')
testConnection()
  .then(() => console.log('✨ Teste concluído'))
  .catch(error => console.error('💥 Erro no teste:', error)) 