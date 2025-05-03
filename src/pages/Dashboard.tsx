
import { useEffect, useState } from 'react';
import { useBarberShop } from '@/contexts/BarberShopContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarIcon, UsersIcon, ClockIcon, ArrowUpIcon } from 'lucide-react';

// Formato de valor em moeda BR
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const Dashboard = () => {
  const { appointments, services, clients } = useBarberShop();
  const [metrics, setMetrics] = useState({
    todayAppointments: 0,
    totalClients: 0,
    nextAppointment: '',
    mostBookedService: '',
    averageTicket: 0,
    totalServices: 0,
  });

  useEffect(() => {
    // Filtra agendamentos de hoje
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayAppts = appointments.filter(app => {
      const appDate = new Date(app.date);
      appDate.setHours(0, 0, 0, 0);
      return appDate.getTime() === today.getTime();
    });

    // Encontrar próximo agendamento
    const currentTime = new Date();
    const upcomingAppts = appointments.filter(app => new Date(app.date) > currentTime)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    let nextApptStr = 'Nenhum agendamento';
    if (upcomingAppts.length > 0) {
      const nextAppt = upcomingAppts[0];
      const nextDate = new Date(nextAppt.date);
      nextApptStr = nextDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      
      // Se não for hoje, adicionar data
      const nextApptDay = new Date(nextAppt.date);
      nextApptDay.setHours(0, 0, 0, 0);
      if (nextApptDay.getTime() !== today.getTime()) {
        nextApptStr += ` - ${nextDate.toLocaleDateString('pt-BR')}`;
      }
    }

    // Contagem de serviços
    const serviceCounts: Record<string, number> = {};
    appointments.forEach(app => {
      serviceCounts[app.serviceId] = (serviceCounts[app.serviceId] || 0) + 1;
    });

    // Serviço mais agendado
    let mostBookedId = '';
    let maxCount = 0;
    for (const [id, count] of Object.entries(serviceCounts)) {
      if (count > maxCount) {
        mostBookedId = id;
        maxCount = count;
      }
    }

    const mostBookedService = services.find(s => s.id === mostBookedId)?.name || 'Nenhum';

    // Calcular ticket médio
    let totalValue = 0;
    appointments.forEach(app => {
      const service = services.find(s => s.id === app.serviceId);
      if (service) {
        totalValue += service.price;
      }
    });
    const averageTicket = appointments.length > 0 ? totalValue / appointments.length : 0;

    setMetrics({
      todayAppointments: todayAppts.length,
      totalClients: clients.length,
      nextAppointment: nextApptStr,
      mostBookedService,
      averageTicket,
      totalServices: services.length,
    });
  }, [appointments, services, clients]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Total de agendamentos hoje */}
        <Card className="bg-barber-blue text-barber-light border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-barber-light flex items-center">
              <CalendarIcon className="mr-2 h-4 w-4 text-barber-gold" />
              Agendamentos Hoje
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.todayAppointments}</div>
          </CardContent>
        </Card>

        {/* Total de clientes */}
        <Card className="bg-barber-blue text-barber-light border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-barber-light flex items-center">
              <UsersIcon className="mr-2 h-4 w-4 text-barber-gold" />
              Total de Clientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalClients}</div>
          </CardContent>
        </Card>

        {/* Próximo horário */}
        <Card className="bg-barber-blue text-barber-light border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-barber-light flex items-center">
              <ClockIcon className="mr-2 h-4 w-4 text-barber-gold" />
              Próximo Horário
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.nextAppointment}</div>
          </CardContent>
        </Card>

        {/* Serviço mais agendado */}
        <Card className="bg-barber-blue text-barber-light border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-barber-light flex items-center">
              <ArrowUpIcon className="mr-2 h-4 w-4 text-barber-gold" />
              Serviço Mais Agendado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold truncate">{metrics.mostBookedService}</div>
          </CardContent>
        </Card>

        {/* Ticket médio */}
        <Card className="bg-barber-blue text-barber-light border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-barber-light flex items-center">
              <CalendarIcon className="mr-2 h-4 w-4 text-barber-gold" />
              Ticket Médio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.averageTicket)}</div>
          </CardContent>
        </Card>

        {/* Total de serviços */}
        <Card className="bg-barber-blue text-barber-light border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-barber-light flex items-center">
              <CalendarIcon className="mr-2 h-4 w-4 text-barber-gold" />
              Total de Serviços
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalServices}</div>
          </CardContent>
        </Card>
      </div>

      {/* Agendamentos de hoje */}
      <Card className="bg-barber-blue text-barber-light border-gray-700">
        <CardHeader>
          <CardTitle className="text-barber-gold">Agendamentos de Hoje</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {appointments.filter(app => {
              const appDate = new Date(app.date);
              const today = new Date();
              return (
                appDate.getDate() === today.getDate() &&
                appDate.getMonth() === today.getMonth() &&
                appDate.getFullYear() === today.getFullYear()
              );
            }).length === 0 ? (
              <p className="text-barber-light">Nenhum agendamento para hoje.</p>
            ) : (
              appointments
                .filter(app => {
                  const appDate = new Date(app.date);
                  const today = new Date();
                  return (
                    appDate.getDate() === today.getDate() &&
                    appDate.getMonth() === today.getMonth() &&
                    appDate.getFullYear() === today.getFullYear()
                  );
                })
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                .map(app => {
                  const client = clients.find(c => c.id === app.clientId);
                  const service = services.find(s => s.id === app.serviceId);
                  const appDate = new Date(app.date);
                  return (
                    <div key={app.id} className="flex justify-between items-center p-3 rounded-lg bg-barber-dark">
                      <div>
                        <div className="font-semibold">{client?.name || 'Cliente desconhecido'}</div>
                        <div className="text-sm text-barber-light">{service?.name || 'Serviço desconhecido'}</div>
                      </div>
                      <div className="text-barber-gold">
                        {appDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
