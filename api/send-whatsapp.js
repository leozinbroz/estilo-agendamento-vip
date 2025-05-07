export default async function handler(req, res) {
  const { recipient, apikey, text } = req.query;
  if (!recipient || !apikey || !text) {
    res.status(400).json({ error: 'Parâmetros obrigatórios ausentes.' });
    return;
  }
  const url = `https://api.textmebot.com/send.php?recipient=${recipient}&apikey=${apikey}&text=${encodeURIComponent(text)}`;
  try {
    const response = await fetch(url);
    const data = await response.text();
    res.status(200).send(data);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao enviar mensagem' });
  }
} 