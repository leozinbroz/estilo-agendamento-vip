import { useEffect, useState } from 'react';
import { useBarberShop } from '@/contexts/BarberShopContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarIcon, UsersIcon, ClockIcon, ArrowUpIcon } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';

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

  // Placeholders para os dados dos gráficos
  const agendamentosPorDia = [
    { dia: 'Seg', agendamentos: 0 },
    { dia: 'Ter', agendamentos: 0 },
    { dia: 'Qua', agendamentos: 0 },
    { dia: 'Qui', agendamentos: 0 },
    { dia: 'Sex', agendamentos: 0 },
    { dia: 'Sáb', agendamentos: 0 },
    { dia: 'Dom', agendamentos: 0 },
  ];
  const faturamentoMes = 0;
  const faturamentoMesAnterior = 0;
  const ticketMedio = 0;
  const clientesFrequentes = [
    { nome: 'Cliente 1', agendamentos: 0 },
    { nome: 'Cliente 2', agendamentos: 0 },
  ];
  const servicosPopulares = [
    { name: 'Corte', value: 0 },
    { name: 'Barba', value: 0 },
  ];
  const horariosPopulares = [
    { horario: '09:00', agendamentos: 0 },
    { horario: '10:00', agendamentos: 0 },
  ];

  // Calcular valor total previsto hoje (fora do useEffect)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayAppointments = appointments.filter(app => {
    const appDate = new Date(app.date);
    appDate.setHours(0, 0, 0, 0);
    return appDate.getTime() === today.getTime();
  });
  let valorTotalPrevistoHoje = 0;
  todayAppointments.forEach(app => {
    const service = services.find(s => s.id === app.serviceId);
    if (service) valorTotalPrevistoHoje += service.price;
  });

  // Filtro de período
  const [selectedMonth, setSelectedMonth] = useState((new Date().getMonth() + 1).toString());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const meses = [
    { value: '1', label: 'Janeiro' },
    { value: '2', label: 'Fevereiro' },
    { value: '3', label: 'Março' },
    { value: '4', label: 'Abril' },
    { value: '5', label: 'Maio' },
    { value: '6', label: 'Junho' },
    { value: '7', label: 'Julho' },
    { value: '8', label: 'Agosto' },
    { value: '9', label: 'Setembro' },
    { value: '10', label: 'Outubro' },
    { value: '11', label: 'Novembro' },
    { value: '12', label: 'Dezembro' },
  ];
  const anos = Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - i).toString());

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
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="grid grid-cols-2 bg-barber-blue mb-6">
        <TabsTrigger value="overview" className="text-barber-light data-[state=active]:text-barber-gold data-[state=active]:shadow-none">
          Visão Geral
        </TabsTrigger>
        <TabsTrigger value="reports" className="text-barber-light data-[state=active]:text-barber-gold data-[state=active]:shadow-none">
          Relatórios Detalhados
        </TabsTrigger>
      </TabsList>
      <TabsContent value="overview">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Agendamentos Hoje */}
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
            {/* Próximo Horário */}
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
            {/* Valor Total Previsto Hoje */}
            <Card className="bg-barber-blue text-barber-light border-gray-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-barber-light flex items-center">
                  <CalendarIcon className="mr-2 h-4 w-4 text-barber-gold" />
                  Valor Total Previsto Hoje
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(valorTotalPrevistoHoje)}</div>
              </CardContent>
            </Card>
            {/* Ticket Médio */}
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
            {/* Total de Serviços Oferecidos */}
            <Card className="bg-barber-blue text-barber-light border-gray-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-barber-light flex items-center">
                  <CalendarIcon className="mr-2 h-4 w-4 text-barber-gold" />
                  Total de Serviços Oferecidos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.totalServices}</div>
              </CardContent>
            </Card>
            {/* Serviço Mais Agendado */}
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
          </div>
        </div>
      </TabsContent>
      <TabsContent value="reports">
        <div className="space-y-6">
          {/* Filtros de período */}
          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="bg-barber-blue text-barber-light border-gray-700 w-full sm:w-40">
                <SelectValue placeholder="Mês" />
              </SelectTrigger>
              <SelectContent className="bg-barber-blue text-barber-light border-gray-700">
                {meses.map(m => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="bg-barber-blue text-barber-light border-gray-700 w-full sm:w-32">
                <SelectValue placeholder="Ano" />
              </SelectTrigger>
              <SelectContent className="bg-barber-blue text-barber-light border-gray-700">
                {anos.map(a => (
                  <SelectItem key={a} value={a}>{a}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Total de Clientes */}
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
            {/* Faturamento do Mês */}
            <Card className="bg-barber-blue border-gray-700">
              <CardHeader>
                <CardTitle className="text-barber-gold">Faturamento do Mês</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">R$ {faturamentoMes.toLocaleString('pt-BR')}</div>
              </CardContent>
            </Card>
            {/* Faturamento Mês Anterior */}
            <Card className="bg-barber-blue border-gray-700">
              <CardHeader>
                <CardTitle className="text-barber-gold">Faturamento Mês Anterior</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">R$ {faturamentoMesAnterior.toLocaleString('pt-BR')}</div>
              </CardContent>
            </Card>
          </div>
          {/* Gráficos responsivos com rolagem horizontal no mobile */}
          <div className="space-y-6">
            {/* Gráfico de Agendamentos por Dia da Semana */}
            <Card className="bg-barber-blue border-gray-700">
              <CardHeader>
                <CardTitle className="text-barber-gold">Agendamentos por Dia da Semana</CardTitle>
              </CardHeader>
              <div className="overflow-x-auto w-full">
                <div className="min-w-[500px] max-w-full">
                  <CardContent style={{ height: 300 }}>
                    <ResponsiveContainer width={500} height={300}>
                      <BarChart data={agendamentosPorDia}>
                        <XAxis dataKey="dia" stroke="#FFD700" />
                        <YAxis stroke="#fff" />
                        <Tooltip />
                        <Bar dataKey="agendamentos" fill="#FFD700" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </div>
              </div>
            </Card>
            {/* Gráfico de Serviços Mais Populares */}
            <Card className="bg-barber-blue border-gray-700">
              <CardHeader>
                <CardTitle className="text-barber-gold">Serviços Mais Populares</CardTitle>
              </CardHeader>
              <div className="overflow-x-auto w-full">
                <div className="min-w-[500px] max-w-full">
                  <CardContent style={{ height: 300 }}>
                    <ResponsiveContainer width={500} height={300}>
                      <PieChart>
                        <Pie data={servicosPopulares} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} fill="#FFD700">
                          {servicosPopulares.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#FFD700' : '#333'} />
                          ))}
                        </Pie>
                        <Legend />
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </div>
              </div>
            </Card>
            {/* Gráfico de Horários Mais Procurados */}
            <Card className="bg-barber-blue border-gray-700">
              <CardHeader>
                <CardTitle className="text-barber-gold">Horários Mais Procurados</CardTitle>
              </CardHeader>
              <div className="overflow-x-auto w-full">
                <div className="min-w-[500px] max-w-full">
                  <CardContent style={{ height: 300 }}>
                    <ResponsiveContainer width={500} height={300}>
                      <BarChart data={horariosPopulares}>
                        <XAxis dataKey="horario" stroke="#FFD700" />
                        <YAxis stroke="#fff" />
                        <Tooltip />
                        <Bar dataKey="agendamentos" fill="#FFD700" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
};

export default Dashboard;
