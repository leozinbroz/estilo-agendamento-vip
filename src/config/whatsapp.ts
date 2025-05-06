export const WHATSAPP_CONFIG = {
  API_URL: 'https://api.callmebot.com/whatsapp.php',
  API_KEY: '7299717', // Sua chave API
  PHONE_PREFIX: '55' // Prefixo do Brasil
};

export const formatPhoneNumber = (phone: string) => {
  // Remove caracteres não numéricos
  const numbers = phone.replace(/\D/g, '');
  // Adiciona o prefixo se não existir
  return numbers.startsWith('55') ? numbers : `55${numbers}`;
};

export const sendWhatsAppMessage = async (phone: string, message: string) => {
  try {
    const formattedPhone = formatPhoneNumber(phone);
    const encodedMessage = encodeURIComponent(message);
    const url = `${WHATSAPP_CONFIG.API_URL}?phone=${formattedPhone}&text=${encodedMessage}&apikey=${WHATSAPP_CONFIG.API_KEY}`;
    
    const response = await fetch(url);
    const data = await response.text();
    
    return {
      success: true,
      message: 'Mensagem enviada com sucesso!',
      data
    };
  } catch (error) {
    return {
      success: false,
      message: 'Erro ao enviar mensagem',
      error
    };
  }
}; 