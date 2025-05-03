
import { useState } from 'react';
import { useBarberShop } from '@/contexts/BarberShopContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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

// Formato de valor em moeda BR
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const ScheduledClients = () => {
  const { appointments, clients, services, config, deleteAppointment, updateAppointment } = useBarberShop();
  const { toast } = useToast();
  const [deleteAppointmentId, setDeleteAppointmentId] = useState<string | null>(null);
  
  // Estado para edição de agendamento
  const [editingAppointment, setEditingAppointment] = useState<any | null>(null);
  const [editNotes, setEditNotes] = useState('');

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

  // Enviar mensagem de WhatsApp
  const sendWhatsApp = (appointment: any) => {
    const client = clients.find(c => c.id === appointment.clientId);
    const service = services.find(s => s.id === appointment.serviceId);
    
    if (!client || !service) return;
    
    const appointmentDate = new Date(appointment.date);
    const formattedDate = appointmentDate.toLocaleDateString('pt-BR');
    const formattedTime = appointmentDate.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    
    // Formatar número de telefone para WhatsApp (remover caracteres não numéricos)
    const phone = client.phone.replace(/\D/g, '');
    
    // Montar a mensagem
    const message = `Olá ${client.name}, confirmando seu agendamento na ${config.name} para ${service.name} no dia ${formattedDate} às ${formattedTime}. Endereço: ${config.address}, ${config.city}. Até lá!`;
    
    // Montar URL do WhatsApp
    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    
    // Abrir WhatsApp em nova aba
    window.open(whatsappUrl, '_blank');
  };

  // Função para confirmar a exclusão de um agendamento
  const handleDeleteAppointment = (id: string) => {
    deleteAppointment(id);
    toast({
      title: "Agendamento excluído",
      description: "O agendamento foi excluído com sucesso."
    });
    setDeleteAppointmentId(null);
  };
  
  // Função para salvar a edição de um agendamento
  const handleSaveEdit = () => {
    if (editingAppointment) {
      const updatedAppointment = {
        ...editingAppointment,
        notes: editNotes
      };
      
      updateAppointment(updatedAppointment);
      setEditingAppointment(null);
      
      toast({
        title: "Agendamento atualizado",
        description: "As observações foram atualizadas com sucesso."
      });
    }
  };
  
  // Abrir modal de edição
  const openEditModal = (appointment: any) => {
    setEditingAppointment(appointment);
    setEditNotes(appointment.notes || '');
  };

  // Renderizar um agendamento
  const renderAppointment = (app: any) => {
    const client = clients.find(c => c.id === app.clientId);
    const service = services.find(s => s.id === app.serviceId);
    const appointmentDate = new Date(app.date);
    
    if (!client || !service) return null;
    
    return (
      <div 
        key={app.id} 
        className="bg-barber-dark p-4 rounded-lg mb-3 border border-gray-700"
      >
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-medium text-barber-light text-lg">{client.name}</h3>
            <div className="mt-1 mb-2">
              <span className="text-barber-gold">{service.name}</span>
              <span className="text-barber-light text-xs ml-2">
                {formatCurrency(service.price)}
              </span>
            </div>
            {app.notes && (
              <p className="text-sm mt-2 text-barber-light opacity-70 italic">
                "{app.notes}"
              </p>
            )}
          </div>
          
          <div className="text-right">
            <div className="text-barber-gold font-semibold">
              {appointmentDate.toLocaleTimeString('pt-BR', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </div>
            <div className="text-xs text-barber-light mb-2">
              {appointmentDate.toLocaleDateString('pt-BR')}
            </div>
            
            <div className="flex space-x-2">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => openEditModal(app)}
                className="text-barber-gold border-barber-gold hover:bg-barber-gold/20"
              >
                Editar
              </Button>
              
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => sendWhatsApp(app)}
                className="text-green-500 border-green-500 hover:bg-green-500/20"
              >
                WhatsApp
              </Button>
              
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => setDeleteAppointmentId(app.id)}
                className="text-red-500 border-red-500 hover:bg-red-500/20"
              >
                Excluir
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
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
            <CardContent className="space-y-2">
              {todayAppointments.length === 0 ? (
                <p className="text-barber-light text-center py-8">Nenhum agendamento para hoje.</p>
              ) : (
                todayAppointments.sort(sortByDateTime).map(renderAppointment)
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="tomorrow">
          <Card className="bg-barber-blue border-gray-700">
            <CardHeader>
              <CardTitle className="text-barber-gold">Agendamentos de Amanhã</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {tomorrowAppointments.length === 0 ? (
                <p className="text-barber-light text-center py-8">Nenhum agendamento para amanhã.</p>
              ) : (
                tomorrowAppointments.sort(sortByDateTime).map(renderAppointment)
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="all">
          <Card className="bg-barber-blue border-gray-700">
            <CardHeader>
              <CardTitle className="text-barber-gold">Todos os Agendamentos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {upcomingAppointments.length === 0 ? (
                <p className="text-barber-light text-center py-8">Nenhum agendamento futuro.</p>
              ) : (
                upcomingAppointments.sort(sortByDateTime).map(renderAppointment)
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
        <AlertDialogContent className="bg-barber-blue text-barber-light border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-barber-gold">Editar Agendamento</AlertDialogTitle>
          </AlertDialogHeader>
          
          <div className="space-y-4 py-2">
            {editingAppointment && (
              <>
                <div className="text-sm">
                  <p><span className="font-medium">Cliente:</span> {clients.find(c => c.id === editingAppointment.clientId)?.name}</p>
                  <p><span className="font-medium">Serviço:</span> {services.find(s => s.id === editingAppointment.serviceId)?.name}</p>
                  <p><span className="font-medium">Data/Hora:</span> {
                    new Date(editingAppointment.date).toLocaleDateString('pt-BR') + ' às ' + 
                    new Date(editingAppointment.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                  }</p>
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
          
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-barber-dark text-barber-light hover:bg-gray-700 border-gray-700">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleSaveEdit}
              className="bg-barber-gold text-barber-dark hover:bg-amber-600"
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
