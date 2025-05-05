import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://qucntloyixdpgnzxbdik.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1Y250bG95aXhkcGduenhiZGlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU1Mzk5MTYsImV4cCI6MjA2MTExNTkxNn0.LRP71EjcDmj3yy96N7VCxePG1xPAEjrK6_1uYIf5_K0'

console.log('Configurando Supabase com URL:', supabaseUrl)

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Teste inicial de conexão
console.log('Testando conexão com Supabase...')
supabase
  .from('servicos')
  .select('*')
  .then(({ data, error }) => {
    if (error) {
      console.error('❌ Erro na conexão:', error)
    } else {
      console.log('✅ Conexão estabelecida! Serviços:', data)
    }
  }) 