
import { useState, useEffect } from 'react';
import { useBarberShop } from '@/contexts/BarberShopContext';
import { useToast } from '@/hooks/use-toast';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';

const Schedule = () => {
  const { 
    services, 
    addAppointment, 
    getAvailableTimeSlots,
    addClient,
    findClientByPhone 
  } = useBarberShop();
  const { toast } = useToast();

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [selectedService, setSelectedService] = useState<string>('');
  const [clientName, setClientName] = useState<string>('');
  const [clientPhone, setClientPhone] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Atualizar horários disponíveis quando a data ou serviço mudam
  useEffect(() => {
    if (selectedDate && selectedService) {
      const slots = getAvailableTimeSlots(selectedDate, selectedService);
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
  const handlePhoneChange = (value: string) => {
    const formatted = formatPhoneNumber(value);
    setClientPhone(formatted);
    
    // Se o número tiver pelo menos 14 caracteres (formato completo), buscar cliente
    if (formatted.replace(/\D/g, '').length >= 11) {
      const client = findClientByPhone(formatted);
      if (client) {
        setClientName(client.name);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
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
      
      // Adicionar ou obter cliente existente
      const client = addClient({
        name: clientName,
        phone: clientPhone
      });
      
      // Criar agendamento
      addAppointment({
        clientId: client.id,
        serviceId: selectedService,
        date: appointmentDate,
        notes: notes
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
      console.error("Erro ao agendar:", error);
      toast({
        title: "Erro ao agendar",
        description: "Ocorreu um erro ao realizar o agendamento.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Desabilitar datas passadas no calendário
  const isDateDisabled = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  return (
    <div className="h-full pb-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card className="bg-barber-blue border-gray-700 h-full">
          <CardHeader>
            <CardTitle className="text-barber-gold">Escolha a Data</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg overflow-hidden bg-barber-dark p-1">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={isDateDisabled}
                className="text-barber-light pointer-events-auto"
              />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-barber-blue border-gray-700 h-full">
          <CardHeader>
            <CardTitle className="text-barber-gold">Dados do Agendamento</CardTitle>
          </CardHeader>
          <CardContent className="h-full">
            <form onSubmit={handleSubmit} className="space-y-4 flex flex-col h-full">
              <ScrollArea className="flex-grow pr-2">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-barber-light">Nome do Cliente</label>
                    <Input
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="Nome"
                      className="bg-barber-dark text-barber-light border-gray-700"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-barber-light">Telefone</label>
                    <Input
                      value={clientPhone}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      placeholder="(00) 00000-0000"
                      maxLength={16}
                      className="bg-barber-dark text-barber-light border-gray-700"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-barber-light">Serviço</label>
                    <Select 
                      value={selectedService} 
                      onValueChange={setSelectedService}
                    >
                      <SelectTrigger className="bg-barber-dark text-barber-light border-gray-700">
                        <SelectValue placeholder="Selecione um serviço" />
                      </SelectTrigger>
                      <SelectContent className="bg-barber-dark text-barber-light border-gray-700">
                        {services.map(service => (
                          <SelectItem key={service.id} value={service.id}>{service.name} - {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(service.price)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-barber-light">Horário</label>
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
                            : "Selecione um horário"
                        } />
                      </SelectTrigger>
                      <SelectContent className="bg-barber-dark text-barber-light border-gray-700">
                        {availableTimes.map(time => (
                          <SelectItem key={time} value={time}>{time}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-barber-light">Observações</label>
                    <Textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Observações (opcional)"
                      className="bg-barber-dark text-barber-light border-gray-700 min-h-24"
                    />
                  </div>
                </div>
              </ScrollArea>
              
              <Button 
                type="submit" 
                className="w-full bg-barber-gold hover:bg-amber-600 text-barber-dark mt-4 sticky bottom-0"
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
