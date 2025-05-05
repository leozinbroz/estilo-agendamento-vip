import { supabase } from './lib/supabaseClient'

async function testPolicies() {
  console.log('🔍 Testando políticas do Supabase...')

  // 1. Verifica a estrutura da tabela
  console.log('\n📊 Verificando estrutura da tabela...')
  const { data: tableInfo, error: tableError } = await supabase
    .from('servicos')
    .select('*')
    .limit(0)
  
  if (tableError) {
    console.error('❌ Erro ao verificar tabela:', tableError)
    return
  }
  console.log('✅ Tabela existe e está acessível')

  // 2. Tenta inserir um serviço simples
  console.log('\n📝 Testando INSERT com dados mínimos...')
  const { data: insertData, error: insertError } = await supabase
    .from('servicos')
    .insert([
      {
        nome: 'Teste Simples',
        duracao: 30,
        preco: 50.00,
        created_at: new Date().toISOString()
      }
    ])
    .select()
  
  if (insertError) {
    console.error('❌ Erro no INSERT:', {
      message: insertError.message,
      code: insertError.code,
      details: insertError.details,
      hint: insertError.hint
    })
  } else {
    console.log('✅ INSERT funcionou:', insertData)
  }

  // 3. Verifica se o serviço foi realmente inserido
  console.log('\n🔍 Verificando se o serviço foi inserido...')
  const { data: verifyData, error: verifyError } = await supabase
    .from('servicos')
    .select('*')
    .eq('nome', 'Teste Simples')
  
  if (verifyError) {
    console.error('❌ Erro na verificação:', verifyError)
  } else {
    console.log('✅ Serviços encontrados:', verifyData)
  }
}

// Executa o teste
console.log('🚀 Iniciando testes...')
testPolicies()
  .then(() => console.log('✨ Testes concluídos'))
  .catch(error => console.error('💥 Erro nos testes:', error)) 