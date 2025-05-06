import { useState } from 'react';
import { Button } from './ui/button';
import { sendWhatsAppMessage } from '../config/whatsapp';
import { toast } from 'sonner';

interface WhatsAppNotificationButtonProps {
  clientName: string;
  clientPhone: string;
  appointmentDate: string;
  appointmentTime: string;
}

export function WhatsAppNotificationButton({
  clientName,
  clientPhone,
  appointmentDate,
  appointmentTime
}: WhatsAppNotificationButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSendNotification = async () => {
    try {
      setIsLoading(true);
      
      const message = `Olá ${clientName}! 
Lembrete do seu agendamento:
📅 Data: ${appointmentDate}
⏰ Horário: ${appointmentTime}

Agradecemos a confirmação!`;

      const result = await sendWhatsAppMessage(clientPhone, message);
      
      if (result.success) {
        toast.success('Notificação enviada com sucesso!');
      } else {
        toast.error('Erro ao enviar notificação');
      }
    } catch (error) {
      toast.error('Erro ao enviar notificação');
      console.error('Erro ao enviar notificação:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleSendNotification}
      disabled={isLoading}
      variant="outline"
      className="flex items-center gap-2"
    >
      {isLoading ? (
        <>
          <span className="animate-spin">⏳</span>
          Enviando...
        </>
      ) : (
        <>
          <span>📱</span>
          Notificar
        </>
      )}
    </Button>
  );
} 