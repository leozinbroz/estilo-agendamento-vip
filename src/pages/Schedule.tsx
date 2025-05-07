import { useState, useEffect, useRef } from 'react';
import { useBarberShop } from '@/contexts/BarberShopContext';
import { useToast } from '@/hooks/use-toast';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ptBR } from 'date-fns/locale';
import { User, Phone, Scissors, MessageCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

const Schedule = () => {
  const { 
    services, 
    addAppointment, 
    getAvailableTimeSlots,
    addClient,
    findClientByPhone,
    config,
    appointments
  } = useBarberShop();
  const { toast } = useToast();

  // Log para verificar os serviços disponíveis
  useEffect(() => {
    console.log('Serviços disponíveis:', services);
  }, [services]);

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [selectedService, setSelectedService] = useState<string>('');
  const [clientName, setClientName] = useState<string>('');
  const [clientPhone, setClientPhone] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isServiceSelectOpen, setIsServiceSelectOpen] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [notesModalOpen, setNotesModalOpen] = useState(false);

  const notesRef = useRef<HTMLTextAreaElement>(null);

  // Monitorar estado do botão
  useEffect(() => {
    console.log('Estado do botão:', {
      selectedDate,
      selectedTime,
      selectedService,
      clientName,
      clientPhone,
      isLoading
    });
  }, [selectedDate, selectedTime, selectedService, clientName, clientPhone, isLoading]);

  // Atualizar horários disponíveis quando a data ou serviço mudam
  useEffect(() => {
    console.log('Serviço selecionado atual:', selectedService);
    if (selectedDate && selectedService) {
      const slots = getAvailableTimeSlots(selectedDate, selectedService);
      console.log('Horários disponíveis:', slots);
      setAvailableTimes(slots);
      setSelectedTime(''); // Resetar o horário selecionado
    } else {
      setAvailableTimes([]);
    }
  }, [selectedDate, selectedService, getAvailableTimeSlots]);

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

  // Verificar cliente pelo telefone
  const handlePhoneChange = async (value: string) => {
    const formatted = formatPhoneNumber(value);
    setClientPhone(formatted);
    
    // Se o número tiver pelo menos 11 dígitos, buscar cliente
    const cleanPhone = formatted.replace(/\D/g, '');
    if (cleanPhone.length >= 11) {
      try {
        const client = await findClientByPhone(cleanPhone);
        if (client) {
          setClientName(client.name);
        }
        // Não definir clientName como vazio se já tiver um valor
      } catch (error) {
        console.error('Erro ao buscar cliente:', error);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedDate || !selectedTime || !selectedService || !clientName || !clientPhone) {
      toast({
        title: "Erro no agendamento",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Criar o objeto de data combinando data e hora
      const appointmentDate = new Date(selectedDate);
      const [hours, minutes] = selectedTime.split(':').map(Number);
      appointmentDate.setHours(hours, minutes, 0, 0);
      
      // Verificar se o horário selecionado é passado
      const now = new Date();
      if (appointmentDate < now) {
        toast({
          title: "Erro no agendamento",
          description: "Não é possível agendar em horários passados.",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }
      
      // Adicionar ou obter cliente existente
      const client = await addClient({
        name: clientName,
        phone: clientPhone
      });
      
      // Verificar se o cliente foi criado ou encontrado corretamente
      if (!client) {
        throw new Error("Não foi possível criar ou encontrar o cliente");
      }
      
      // Criar agendamento
      await addAppointment({
        clientId: client.id,
        serviceId: selectedService,
        date: appointmentDate,
        status: 'pendente'
      });
      
      toast({
        title: "Agendamento realizado!",
        description: `Cliente ${clientName} agendado para ${selectedDate.toLocaleDateString('pt-BR')} às ${selectedTime}.`,
      });
      
      // Resetar formulário
      setClientName('');
      setClientPhone('');
      setSelectedService('');
      setNotes('');
      setSelectedTime('');
      
    } catch (error) {
      console.error('Erro ao criar agendamento:', error);
      toast({
        title: "Erro no agendamento",
        description: "Ocorreu um erro ao criar o agendamento. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleServiceSelect = (value: string) => {
    console.log('Selecionando serviço:', value);
    setSelectedService(value);
    setIsServiceSelectOpen(false);
  };

  // Desabilitar datas passadas no calendário
  const isDateDisabled = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
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

  return (
    <div className="bg-barber-dark w-full">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-barber-blue border-gray-700">
          <CardHeader>
            <CardTitle className="text-barber-gold">Escolha a Data</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg overflow-hidden bg-barber-dark p-1">
              <Calendar
                mode="single"
                selected={selectedDate || new Date()}
                onSelect={setSelectedDate}
                disabled={isDateDisabled}
                locale={ptBR}
                className="text-barber-light pointer-events-auto"
              />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-barber-blue border-gray-700">
          <CardHeader>
            <CardTitle className="text-barber-gold">Dados do Agendamento</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-barber-gold w-5 h-5" />
                <Input
                  value={clientName || ''}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Nome do Cliente"
                  className="bg-barber-dark text-barber-light border-gray-700 pl-10"
                />
              </div>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-barber-gold w-5 h-5" />
                <Input
                  value={clientPhone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  placeholder="Telefone (00) 00000-0000"
                  maxLength={16}
                  className="bg-barber-dark text-barber-light border-gray-700 pl-10"
                />
              </div>
              
              <div className="relative">
                <Scissors className="absolute left-3 top-1/2 -translate-y-1/2 text-barber-gold w-5 h-5 z-10" />
                <div 
                  className="bg-barber-dark text-barber-light border border-gray-700 rounded-md p-2 cursor-pointer pl-10 relative"
                  onClick={() => setIsServiceSelectOpen(!isServiceSelectOpen)}
                >
                  {selectedService ? (
                    <div className="flex justify-between items-center">
                      <span>
                        {services.find(s => s.id === selectedService)?.name || 'Selecione um serviço'}
                      </span>
                      <span className="text-barber-gold">
                        {selectedService && services.find(s => s.id === selectedService)?.price && 
                          new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
                            .format(services.find(s => s.id === selectedService)?.price || 0)
                        }
                      </span>
                    </div>
                  ) : (
                    <span className="text-gray-400">Selecione um serviço</span>
                  )}
                </div>
                
                {isServiceSelectOpen && (
                  <div className="absolute w-full mt-2 bg-barber-dark border border-gray-700 rounded-md max-h-60 overflow-auto z-50">
                    {services.length > 0 ? (
                      services.map(service => (
                        <div
                          key={service.id}
                          className={`p-2 cursor-pointer hover:bg-barber-blue ${
                            selectedService === service.id ? 'bg-barber-blue' : ''
                          }`}
                          onClick={() => handleServiceSelect(service.id)}
                        >
                          <div className="flex justify-between items-center">
                            <span>{service.name}</span>
                            <span className="text-barber-gold">
                              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(service.price)}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-2 text-center text-barber-light">
                        Nenhum serviço disponível
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <Select 
                value={selectedTime} 
                onValueChange={setSelectedTime}
                disabled={!selectedService || !selectedDate || availableTimes.length === 0}
              >
                <SelectTrigger className="bg-barber-dark text-barber-light border-gray-700">
                  <SelectValue placeholder={
                    !selectedService
                      ? "Selecione um serviço primeiro"
                      : !selectedDate
                      ? "Selecione uma data primeiro"
                      : availableTimes.length === 0
                      ? "Nenhum horário disponível"
                      : "Horário"
                  } />
                </SelectTrigger>
                <SelectContent className="bg-barber-dark text-barber-light border-gray-700">
                  {selectedService && selectedDate && services.length > 0 && (() => {
                    const service = services.find(s => s.id === selectedService);
                    if (!service) return null;
                    
                    // Gerar todos os horários possíveis
                    const allTimes = generateTimeOptions(config.openingTime, config.closingTime);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const isToday = selectedDate && new Date(selectedDate).setHours(0,0,0,0) === today.getTime();
                    const now = new Date();
                    
                    return allTimes.map(time => {
                      // Verifica se horário já passou
                      let isPast = false;
                      if (isToday) {
                        const [h, m] = time.split(':').map(Number);
                        if (h < now.getHours() || (h === now.getHours() && m <= now.getMinutes())) {
                          isPast = true;
                        }
                      }
                      
                      // Verifica se o horário está disponível
                      const isAvailable = availableTimes.includes(time) && !isPast;
                      // Verifica se o horário está ocupado (não disponível e não passado)
                      const isOcupado = !availableTimes.includes(time) && !isPast;
                      
                      // Verificar se o horário se sobrepõe com algum agendamento existente
                      const [slotHour, slotMinute] = time.split(':').map(Number);
                      const slotTime = slotHour * 60 + slotMinute;
                      
                      let isOverlapping = false;
                      if (!isAvailable && !isPast) {
                        const dayAppointments = appointments.filter(app => {
                          const appDate = new Date(app.date);
                          appDate.setHours(0, 0, 0, 0);
                          return appDate.getTime() === new Date(selectedDate).setHours(0,0,0,0);
                        });
                        
                        for (const app of dayAppointments) {
                          const appDate = new Date(app.date);
                          const appHour = appDate.getHours();
                          const appMinute = appDate.getMinutes();
                          const appTime = appHour * 60 + appMinute;
                          
                          const appService = services.find(s => s.id === app.serviceId);
                          if (!appService) continue;
                          
                          if (slotTime >= appTime && slotTime < appTime + appService.duration) {
                            isOverlapping = true;
                            break;
                          }
                        }
                      }
                      
                      return (
                        <SelectItem 
                          key={time} 
                          value={time} 
                          disabled={isOcupado || isPast || isOverlapping}
                        >
                          <span className="flex items-center gap-2">
                            {time}
                            {isAvailable && (
                              <span className="text-green-500 text-xs font-semibold bg-green-500/10 rounded px-2 py-0.5">Disponível</span>
                            )}
                            {(isOcupado || isOverlapping) && (
                              <span className="text-red-500 text-xs font-semibold bg-red-500/10 rounded px-2 py-0.5">Ocupado</span>
                            )}
                            {isPast && (
                              <span className="text-gray-400 text-xs font-semibold bg-gray-400/10 rounded px-2 py-0.5">Inativo</span>
                            )}
                          </span>
                        </SelectItem>
                      );
                    });
                  })()}
                </SelectContent>
              </Select>
              <Button 
                type="submit" 
                className="w-full bg-barber-gold hover:bg-amber-600 text-barber-dark"
                disabled={isLoading || !selectedDate || !selectedTime || !selectedService || !clientName || !clientPhone}
              >
                {isLoading ? "Agendando..." : "Confirmar Agendamento"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Schedule;
