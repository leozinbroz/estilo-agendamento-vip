import { useState, useEffect } from 'react';
import { useBarberShop } from '@/contexts/BarberShopContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Calendar } from '@/components/ui/calendar';
import { Calendar as CalendarIcon, Clock, Scissors, Phone, Edit, Trash2, CheckCircle, AlertCircle, X, MessageCircle, Pencil, Bell } from 'lucide-react';
import { Select as SimpleSelect, SelectTrigger as SimpleSelectTrigger, SelectValue as SimpleSelectValue, SelectContent as SimpleSelectContent, SelectItem as SimpleSelectItem } from '@/components/ui/select';

// Formato de valor em moeda BR
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

// Função para gerar todos os horários possíveis do dia
function generateTimeOptions(start: string, end: string) {
  const [startHour, startMinute] = start.split(':').map(Number);
  const [endHour, endMinute] = end.split(':').map(Number);
  const startTime = startHour * 60 + startMinute;
  const endTime = endHour * 60 + endMinute;
  const options: string[] = [];
  for (let time = startTime; time < endTime; time += 30) {
    const hour = Math.floor(time / 60);
    const minute = time % 60;
    options.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
  }
  return options;
}

const ScheduledClients = () => {
  const { appointments, clients, services, config, deleteAppointment, updateAppointment, getAvailableTimeSlots } = useBarberShop();
  const { toast } = useToast();
  const [deleteAppointmentId, setDeleteAppointmentId] = useState<string | null>(null);
  
  // Estado para edição de agendamento
  const [editingAppointment, setEditingAppointment] = useState<any | null>(null);
  const [editNotes, setEditNotes] = useState('');
  const [editClientName, setEditClientName] = useState('');
  const [editClientPhone, setEditClientPhone] = useState('');
  const [editServiceId, setEditServiceId] = useState('');
  const [editDate, setEditDate] = useState<Date | undefined>(undefined);
  const [editTime, setEditTime] = useState('');
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [allTimeOptions, setAllTimeOptions] = useState<string[]>([]);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'concluido' | 'nao_compareceu' | 'cancelado'>('all');

  // Gerar todas as opções de horário uma única vez
  useEffect(() => {
    const options = generateTimeOptions(config.openingTime, config.closingTime);
    setAllTimeOptions(options);
  }, [config.openingTime, config.closingTime]);

  // Atualizar horários disponíveis quando a data ou serviço mudam na edição
  useEffect(() => {
    if (editingAppointment && editDate && editServiceId) {
      const slots = getAvailableTimeSlots(editDate, editServiceId, editingAppointment.id);
      setAvailableTimes(slots);
      
      // Se o horário atual não estiver disponível, adicione-o à lista
      const appointmentTime = new Date(editingAppointment.date);
      const hours = String(appointmentTime.getHours()).padStart(2, '0');
      const minutes = String(appointmentTime.getMinutes()).padStart(2, '0');
      const currentTime = `${hours}:${minutes}`;
      
      if (!slots.includes(currentTime)) {
        setAvailableTimes([...slots, currentTime].sort());
      }
    } else {
      setAvailableTimes([]);
    }
  }, [editDate, editServiceId, editingAppointment, getAvailableTimeSlots]);

  // Filtragem por data
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfterTomorrow = new Date(today);
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);

  const todayAppointments = appointments.filter(app => {
    const appDate = new Date(app.date);
    appDate.setHours(0, 0, 0, 0);
    return appDate.getTime() === today.getTime();
  });

  const tomorrowAppointments = appointments.filter(app => {
    const appDate = new Date(app.date);
    appDate.setHours(0, 0, 0, 0);
    return appDate.getTime() === tomorrow.getTime();
  });

  const upcomingAppointments = appointments.filter(app => {
    const appDate = new Date(app.date);
    appDate.setHours(0, 0, 0, 0);
    return appDate.getTime() >= today.getTime();
  });

  // Ordenar por data/hora
  const sortByDateTime = (appA: any, appB: any) => {
    return new Date(appA.date).getTime() - new Date(appB.date).getTime();
  };

  // Debug para verificar o config
  useEffect(() => {
    console.log('Config atual:', config);
  }, [config]);

  // Enviar mensagem de WhatsApp
  const sendWhatsApp = async (appointment: any) => {
    const client = clients.find(c => c.id === appointment.clientId);
    const service = services.find(s => s.id === appointment.serviceId);
    
    if (!client || !service) return;
    
    const appointmentDate = new Date(appointment.date);
    const formattedDate = appointmentDate.toLocaleDateString('pt-BR');
    const formattedTime = appointmentDate.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    
    // Formatar número de telefone para WhatsApp (remover caracteres não numéricos e adicionar +55)
    const phone = client.phone.replace(/\D/g, '');
    const formattedPhone = phone.startsWith('55') ? `+${phone}` : `+55${phone}`;
    
    // Montar a mensagem usando o template padrão
    const message = config.automation?.mensagemPadrao
      ?.replace('{cliente}', client.name)
      .replace('{barbearia}', config.name)
      .replace('{data}', formattedDate)
      .replace('{horario}', formattedTime)
      .replace('{hora}', `*${formattedTime}*`)
      .replace('{servico}', service.name)
      .replace('{endereco}', `${config.address}, ${config.city}`);
    
    try {
      // Debug para verificar a automação
      console.log('Configuração de automação:', config.automation);
      
      // Verificar se a automação está configurada
      if (!config.automation?.enabled || !config.automation?.apiUrl || !config.automation?.apiKey) {
        console.log('Automação não configurada, usando WhatsApp Web');
        // Se não estiver configurada, abrir WhatsApp Web
        const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
        return;
      }

      console.log('Tentando enviar mensagem via API');
      // Garantir que a URL da API seja HTTPS e construir a URL corretamente
      // Agora usando o endpoint serverless local
      const localApiUrl = `/api/send-whatsapp?recipient=${formattedPhone}&apikey=${config.automation.apiKey}&text=${encodeURIComponent(message)}`;
      
      console.log('URL da API (serverless):', localApiUrl);
      console.log('Parâmetros:', {
        recipient: formattedPhone,
        apikey: config.automation.apiKey,
        text: message
      });
      
      try {
        const response = await fetch(localApiUrl, {
          method: 'GET',
          headers: {
            'Accept': '*/*',
            'Content-Type': 'application/json'
          },
          cache: 'no-cache'
        });

        console.log('Status da resposta:', response.status);
        console.log('Headers da resposta:', Object.fromEntries(response.headers.entries()));

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Erro na resposta:', errorText);
          throw new Error(`Erro na API: ${response.status} - ${errorText}`);
        }

        try {
          const data = await response.json();
          console.log('Resposta da API:', data);
          
          if (data.error) {
            throw new Error(data.error);
          }

          toast({
            title: "Mensagem enviada",
            description: "A mensagem foi enviada com sucesso para o cliente."
          });
        } catch (jsonError) {
          console.error('Erro ao processar resposta JSON:', jsonError);
          // Se não conseguir processar o JSON, mas a resposta foi ok, consideramos sucesso
          if (response.ok) {
            toast({
              title: "Mensagem enviada",
              description: "A mensagem foi enviada com sucesso para o cliente."
            });
          } else {
            throw jsonError;
          }
        }
      } catch (error) {
        console.error('Erro ao enviar mensagem:', error);
        toast({
          title: "Erro ao enviar",
          description: "Não foi possível enviar a mensagem. Tentando abrir WhatsApp Web...",
          variant: "destructive"
        });
        
        // Em caso de erro, tentar abrir WhatsApp Web
        const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      toast({
        title: "Erro ao enviar",
        description: "Não foi possível enviar a mensagem. Tentando abrir WhatsApp Web...",
        variant: "destructive"
      });
      
      // Em caso de erro, tentar abrir WhatsApp Web
      const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
    }
  };

  // Função para confirmar a exclusão de um agendamento
  const handleDeleteAppointment = async (id: string) => {
    try {
      await deleteAppointment(id);
      toast({
        title: "Agendamento excluído",
        description: "O agendamento foi excluído com sucesso."
      });
      setDeleteAppointmentId(null);
    } catch (error) {
      console.error('Erro ao excluir agendamento:', error);
      toast({
        title: "Erro ao excluir",
        description: "Ocorreu um erro ao excluir o agendamento. Tente novamente.",
        variant: "destructive"
      });
    }
  };
  
  // Formatar número de telefone
  const formatPhoneNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    let formatted = cleaned;
    
    if (cleaned.length > 0) {
      if (cleaned.length <= 2) {
        formatted = `(${cleaned}`;
      } else if (cleaned.length <= 7) {
        formatted = `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`;
      } else {
        formatted = `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7, 11)}`;
      }
    }
    
    return formatted;
  };
  
  // Função para abrir o modal de edição
  const openEditModal = (appointment: any) => {
    const client = clients.find(c => c.id === appointment.clientId);
    
    if (!client) return;
    
    setEditingAppointment(appointment);
    setEditNotes(appointment.notes || '');
    setEditClientName(client.name);
    setEditClientPhone(client.phone || '');
    setEditServiceId(appointment.serviceId);
    setEditDate(new Date(appointment.date));
    
    // Definir o horário formatado
    const appointmentTime = new Date(appointment.date);
    const hours = String(appointmentTime.getHours()).padStart(2, '0');
    const minutes = String(appointmentTime.getMinutes()).padStart(2, '0');
    setEditTime(`${hours}:${minutes}`);
  };
  
  // Função para salvar a edição de um agendamento
  const handleSaveEdit = async () => {
    if (!editingAppointment || !editDate || !editTime || !editClientName || !editClientPhone) return;
    
    try {
      // Verificar se o horário selecionado é passado
      const [hours, minutes] = editTime.split(':').map(Number);
      const updatedDate = new Date(editDate);
      updatedDate.setHours(hours, minutes, 0, 0);
      
      const now = new Date();
      if (updatedDate < now) {
        toast({
          title: "Erro ao atualizar",
          description: "Não é possível agendar em horários passados.",
          variant: "destructive"
        });
        return;
      }

      // Verificar se o horário está disponível
      const availableSlots = getAvailableTimeSlots(editDate, editServiceId, editingAppointment.id);
      const selectedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      
      if (!availableSlots.includes(selectedTime) && selectedTime !== editTime) {
        toast({
          title: "Erro ao atualizar",
          description: "Este horário não está disponível.",
          variant: "destructive"
        });
        return;
      }
      
      // Encontrar o cliente pelo telefone
      let clientId = editingAppointment.clientId;
      const existingClient = clients.find(c => c.id === clientId);
      
      if (existingClient) {
        if (existingClient.name !== editClientName || existingClient.phone !== editClientPhone) {
          // Se o nome ou telefone mudou, atualizar o cliente
          // Note: Assumindo que o context tem uma função updateClient
          // Por enquanto, vamos apenas manter o ID do cliente
        }
      }
      
      // Atualizar o agendamento
      const updatedAppointment = {
        ...editingAppointment,
        serviceId: editServiceId,
        date: updatedDate,
        notes: editNotes
      };
      
      await updateAppointment(updatedAppointment);
      setEditingAppointment(null);
      
      toast({
        title: "Agendamento atualizado",
        description: "As informações foram atualizadas com sucesso."
      });
    } catch (error) {
      console.error("Erro ao atualizar agendamento:", error);
      toast({
        title: "Erro ao atualizar",
        description: "Ocorreu um erro ao atualizar o agendamento.",
        variant: "destructive"
      });
    }
  };

  // Desabilitar datas passadas no calendário
  const isDateDisabled = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  // Função para atualizar o status do agendamento
  const handleStatusChange = async (appointmentId: string, newStatus: string) => {
    try {
      const appointment = appointments.find(app => app.id === appointmentId);
      if (!appointment) return;

      const updatedAppointment = {
        ...appointment,
        status: newStatus,
        data_conclusao: newStatus === 'concluido' ? new Date().toISOString() : null
      };

      await updateAppointment(updatedAppointment);
      setUpdatingStatus(null);

      toast({
        title: "Status atualizado",
        description: `Status do agendamento atualizado para ${newStatus}.`
      });
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar o status do agendamento.",
        variant: "destructive"
      });
    }
  };

  // Função para obter a cor do status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'concluido':
        return 'bg-green-500/20 text-green-500';
      case 'cancelado':
        return 'bg-red-500/20 text-red-500';
      case 'nao_compareceu':
        return 'bg-orange-500/20 text-orange-500';
      default:
        return 'bg-gray-500/20 text-gray-500';
    }
  };

  // Função para traduzir o status
  const translateStatus = (status: string) => {
    switch (status) {
      case 'concluido':
        return 'Concluído';
      case 'cancelado':
        return 'Cancelado';
      case 'nao_compareceu':
        return 'Não Compareceu';
      default:
        return 'Pendente';
    }
  };

  // Função para filtrar por status
  const filterByStatus = (apps: any[]) => {
    if (statusFilter === 'all') return apps;
    return apps.filter(app => app.status === statusFilter);
  };

  // Renderizar um agendamento
  const renderAppointment = (app: any) => {
    const client = clients.find(c => c.id === app.clientId);
    const service = services.find(s => s.id === app.serviceId);
    const appointmentDate = new Date(app.date);
    
    return (
      <Card key={app.id} className="bg-barber-dark border-gray-700">
        <CardHeader className="p-4">
          <div className="flex justify-between items-center">
            <CardTitle className="text-barber-gold text-lg">
              {client?.name || 'Cliente não encontrado'}
            </CardTitle>
            <Select
              value={app.status || 'pendente'}
              onValueChange={(value) => handleStatusChange(app.id, value)}
              onOpenChange={(open) => open ? setUpdatingStatus(app.id) : setUpdatingStatus(null)}
            >
              <SelectTrigger className={`w-[130px] ${getStatusColor(app.status || 'pendente')} border-0 text-xs rounded-full px-2 py-0.5 h-6`}>
                <SelectValue>
                  {translateStatus(app.status || 'pendente')}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-barber-blue text-barber-light border-gray-700 w-[130px] min-w-[130px] max-w-[130px]">
                <SelectItem value="concluido" className="text-green-500 text-xs cursor-pointer hover:bg-green-500/10 [&>svg]:hidden [&>span:first-child]:hidden !pl-2 !pr-2 !py-1">
                  Concluído
                </SelectItem>
                <SelectItem value="nao_compareceu" className="text-orange-500 text-xs cursor-pointer hover:bg-orange-500/10 [&>svg]:hidden [&>span:first-child]:hidden !pl-2 !pr-2 !py-1">
                  Não Compareceu
                </SelectItem>
                <SelectItem value="cancelado" className="text-red-500 text-xs cursor-pointer hover:bg-red-500/10 [&>svg]:hidden [&>span:first-child]:hidden !pl-2 !pr-2 !py-1">
                  Cancelado
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="space-y-2">
            <div className="flex items-center text-barber-light">
              <Clock className="h-4 w-4 mr-2" />
              <span>
                {appointmentDate.toLocaleDateString('pt-BR')} às{' '}
                {appointmentDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <div className="flex items-center text-barber-light">
              <Scissors className="h-4 w-4 mr-2" />
              <span>{service?.name || 'Serviço não encontrado'}</span>
            </div>
            <div className="flex items-center text-barber-light">
              <Phone className="h-4 w-4 mr-2" />
              <span>{formatPhoneNumber(client?.phone || '')}</span>
            </div>
          </div>
          <div className="flex justify-between items-center mt-4">
            <Button
              size="sm"
              variant="outline"
              onClick={() => sendWhatsApp(app)}
              className="text-barber-gold border-barber-gold hover:bg-barber-gold/20 flex items-center gap-2"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              <span>Notificar</span>
            </Button>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => openEditModal(app)}
                className="text-barber-gold border-barber-gold hover:bg-barber-gold/20 w-10"
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setDeleteAppointmentId(app.id)}
                className="text-red-500 border-red-500 hover:bg-red-500/20 w-10"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  useEffect(() => {
    const now = new Date();
    const agendamentosParaConcluir = appointments.filter(app => {
      const appDate = new Date(app.date);
      return (app.status === 'pendente' || app.status === 'confirmado') && appDate < now;
    });
    if (agendamentosParaConcluir.length > 0) {
      agendamentosParaConcluir.forEach(async (app) => {
        await updateAppointment({
          ...app,
          status: 'concluido',
          data_conclusao: new Date().toISOString()
        });
      });
    }
  }, [appointments, updateAppointment]);

  return (
    <div>
      {/* Filtro de status em formato de select */}
      <div className="mb-4 flex justify-end">
        <SimpleSelect value={statusFilter} onValueChange={value => setStatusFilter(value as 'all' | 'concluido' | 'nao_compareceu' | 'cancelado')}>
          <SimpleSelectTrigger className="w-[170px] bg-barber-dark text-barber-light border-gray-700 text-xs">
            <SimpleSelectValue>
              {statusFilter === 'all' && 'Todos'}
              {statusFilter === 'concluido' && 'Concluídos'}
              {statusFilter === 'nao_compareceu' && 'Não Compareceu'}
              {statusFilter === 'cancelado' && 'Cancelados'}
            </SimpleSelectValue>
          </SimpleSelectTrigger>
          <SimpleSelectContent className="bg-barber-dark text-barber-light border-gray-700 w-[170px]">
            <SimpleSelectItem value="all">Todos</SimpleSelectItem>
            <SimpleSelectItem value="concluido">Concluídos</SimpleSelectItem>
            <SimpleSelectItem value="nao_compareceu">Não Compareceu</SimpleSelectItem>
            <SimpleSelectItem value="cancelado">Cancelados</SimpleSelectItem>
          </SimpleSelectContent>
        </SimpleSelect>
      </div>
      <Tabs defaultValue="today" className="w-full">
        <TabsList className="grid grid-cols-3 bg-barber-blue">
          <TabsTrigger value="today" className="text-barber-light data-[state=active]:text-barber-gold data-[state=active]:shadow-none">
            Hoje ({todayAppointments.length})
          </TabsTrigger>
          <TabsTrigger value="tomorrow" className="text-barber-light data-[state=active]:text-barber-gold data-[state=active]:shadow-none">
            Amanhã ({tomorrowAppointments.length})
          </TabsTrigger>
          <TabsTrigger value="all" className="text-barber-light data-[state=active]:text-barber-gold data-[state=active]:shadow-none">
            Todos ({upcomingAppointments.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="today">
          <Card className="bg-barber-blue border-gray-700">
            <CardHeader>
              <CardTitle className="text-barber-gold">Agendamentos de Hoje</CardTitle>
            </CardHeader>
            <CardContent>
              {todayAppointments.length === 0 ? (
                <p className="text-barber-light text-center py-8">Nenhum agendamento para hoje.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filterByStatus(todayAppointments).sort(sortByDateTime).map(renderAppointment)}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="tomorrow">
          <Card className="bg-barber-blue border-gray-700">
            <CardHeader>
              <CardTitle className="text-barber-gold">Agendamentos de Amanhã</CardTitle>
            </CardHeader>
            <CardContent>
              {tomorrowAppointments.length === 0 ? (
                <p className="text-barber-light text-center py-8">Nenhum agendamento para amanhã.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filterByStatus(tomorrowAppointments).sort(sortByDateTime).map(renderAppointment)}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="all">
          <Card className="bg-barber-blue border-gray-700">
            <CardHeader>
              <CardTitle className="text-barber-gold">Todos os Agendamentos</CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingAppointments.length === 0 ? (
                <p className="text-barber-light text-center py-8">Nenhum agendamento futuro.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filterByStatus(upcomingAppointments).sort(sortByDateTime).map(renderAppointment)}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Dialog de confirmação de exclusão */}
      <AlertDialog 
        open={!!deleteAppointmentId} 
        onOpenChange={(open) => !open && setDeleteAppointmentId(null)}
      >
        <AlertDialogContent className="bg-barber-blue text-barber-light border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-barber-gold">Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription className="text-barber-light">
              Tem certeza que deseja excluir este agendamento? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-barber-dark text-barber-light hover:bg-gray-700 border-gray-700">Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deleteAppointmentId && handleDeleteAppointment(deleteAppointmentId)}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Dialog para editar agendamento */}
      <AlertDialog
        open={!!editingAppointment}
        onOpenChange={(open) => !open && setEditingAppointment(null)}
      >
        <AlertDialogContent className="bg-barber-blue text-barber-light border-gray-700 max-h-[90vh] overflow-y-auto">
          <AlertDialogHeader>
            <div className="flex justify-between items-center">
              <AlertDialogTitle className="text-barber-gold">Editar Agendamento</AlertDialogTitle>
              <button 
                onClick={() => setEditingAppointment(null)}
                className="text-barber-light hover:text-barber-gold transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <AlertDialogDescription className="text-barber-light">
              Altere as informações do agendamento conforme necessário.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="space-y-4 py-2 px-2">
            {editingAppointment && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Cliente</label>
                  <Input 
                    value={editClientName}
                    onChange={(e) => setEditClientName(e.target.value)}
                    className="bg-barber-dark text-barber-light border-gray-700"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Telefone</label>
                  <Input 
                    value={editClientPhone}
                    onChange={(e) => setEditClientPhone(formatPhoneNumber(e.target.value))}
                    className="bg-barber-dark text-barber-light border-gray-700"
                    maxLength={16}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Serviço</label>
                  <Select 
                    value={editServiceId} 
                    onValueChange={setEditServiceId}
                  >
                    <SelectTrigger className="bg-barber-dark text-barber-light border-gray-700">
                      <SelectValue placeholder="Selecione um serviço" />
                    </SelectTrigger>
                    <SelectContent className="bg-barber-dark text-barber-light border-gray-700">
                      {services.map(service => (
                        <SelectItem key={service.id} value={service.id}>
                          {service.name} - {formatCurrency(service.price)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Data</label>
                  <div className="rounded-lg overflow-hidden bg-barber-dark p-1">
                    <Calendar
                      mode="single"
                      selected={editDate}
                      onSelect={setEditDate}
                      disabled={isDateDisabled}
                      className="text-barber-light pointer-events-auto"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Horário</label>
                  <Select
                    value={editTime}
                    onValueChange={setEditTime}
                  >
                    <SelectTrigger className="bg-barber-dark text-barber-light border-gray-700">
                      <SelectValue placeholder="Selecione um horário" />
                    </SelectTrigger>
                    <SelectContent className="bg-barber-dark text-barber-light border-gray-700 max-h-[200px]">
                      {editDate && editServiceId && allTimeOptions.map(time => {
                        // Verifica se horário já passou
                        let isPast = false;
                        const today = new Date();
                        const isToday = editDate.getDate() === today.getDate() &&
                                      editDate.getMonth() === today.getMonth() &&
                                      editDate.getFullYear() === today.getFullYear();
                        
                        if (isToday) {
                          const [h, m] = time.split(':').map(Number);
                          if (h < today.getHours() || (h === today.getHours() && m <= today.getMinutes())) {
                            isPast = true;
                          }
                        }

                        // Verifica se o horário está disponível
                        const isAvailable = availableTimes.includes(time) && !isPast;
                        // Verifica se o horário está ocupado (não disponível e não passado)
                        const isOcupado = !availableTimes.includes(time) && !isPast;

                        return (
                          <SelectItem key={time} value={time} disabled={isOcupado || isPast}>
                            <span className="flex items-center gap-2">
                              {time}
                              {isAvailable && (
                                <span className="text-green-500 text-xs font-semibold bg-green-500/10 rounded px-2 py-0.5">Disponível</span>
                              )}
                              {isOcupado && (
                                <span className="text-red-500 text-xs font-semibold bg-red-500/10 rounded px-2 py-0.5">Ocupado</span>
                              )}
                              {isPast && (
                                <span className="text-gray-400 text-xs font-semibold bg-gray-400/10 rounded px-2 py-0.5">Inativo</span>
                              )}
                            </span>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Observações</label>
                  <Textarea 
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    placeholder="Adicione observações sobre este agendamento"
                    className="bg-barber-dark text-barber-light border-gray-700"
                  />
                </div>
              </>
            )}
          </div>
          
          <AlertDialogFooter className="mt-2">
            <AlertDialogCancel className="bg-barber-dark text-barber-light hover:bg-gray-700 border-gray-700">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleSaveEdit}
              className="bg-barber-gold text-barber-dark hover:bg-amber-600"
              disabled={!editClientName || !editClientPhone || !editServiceId || !editDate || !editTime}
            >
              Salvar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ScheduledClients;
