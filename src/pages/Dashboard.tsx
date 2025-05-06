import { useEffect, useState } from 'react';
import { useBarberShop } from '@/contexts/BarberShopContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarIcon, UsersIcon, DollarSignIcon, ScissorsIcon } from 'lucide-react';
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
    averageTicket: 0,
    totalServices: 0,
    valorTotalPrevisto: 0,
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

    // Calcular valor total previsto hoje
    let valorTotalPrevisto = 0;
    todayAppts.forEach(app => {
      const service = services.find(s => s.id === app.serviceId);
      if (service) valorTotalPrevisto += service.price;
    });

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
      averageTicket,
      totalServices: services.length,
      valorTotalPrevisto,
    });
  }, [appointments, services, clients]);

  // Função para calcular faturamento do mês
  const calcularFaturamentoMes = (month: number, year: number) => {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    
    return appointments
      .filter(app => {
        const appDate = new Date(app.date);
        return appDate >= startDate && appDate <= endDate;
      })
      .reduce((total, app) => {
        const service = services.find(s => s.id === app.serviceId);
        return total + (service?.price || 0);
      }, 0);
  };

  // Função para calcular agendamentos por dia da semana
  const calcularAgendamentosPorDia = () => {
    const dias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const agendamentosPorDia = dias.map(dia => ({ dia, agendamentos: 0 }));

    appointments.forEach(app => {
      const appDate = new Date(app.date);
      const diaSemana = appDate.getDay();
      agendamentosPorDia[diaSemana].agendamentos++;
    });

    return agendamentosPorDia;
  };

  // Função para calcular serviços mais populares
  const calcularServicosPopulares = () => {
    const servicosCount = services.map(service => ({
      name: service.name,
      value: appointments.filter(app => app.serviceId === service.id).length
    }));

    return servicosCount.sort((a, b) => b.value - a.value);
  };

  // Função para calcular horários mais procurados
  const calcularHorariosPopulares = () => {
    const horarios: Record<string, number> = {};
    
    appointments.forEach(app => {
      const hora = new Date(app.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      horarios[hora] = (horarios[hora] || 0) + 1;
    });

    return Object.entries(horarios)
      .map(([horario, agendamentos]) => ({ horario, agendamentos }))
      .sort((a, b) => b.agendamentos - a.agendamentos)
      .slice(0, 5);
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

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

            {/* Valor Total Previsto */}
            <Card className="bg-barber-blue text-barber-light border-gray-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-barber-light flex items-center">
                  <DollarSignIcon className="mr-2 h-4 w-4 text-barber-gold" />
                  Valor Total Previsto
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(metrics.valorTotalPrevisto)}</div>
              </CardContent>
            </Card>

            {/* Ticket Médio */}
            <Card className="bg-barber-blue text-barber-light border-gray-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-barber-light flex items-center">
                  <DollarSignIcon className="mr-2 h-4 w-4 text-barber-gold" />
                  Ticket Médio
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(metrics.averageTicket)}</div>
              </CardContent>
            </Card>

            {/* Total de Serviços */}
            <Card className="bg-barber-blue text-barber-light border-gray-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-barber-light flex items-center">
                  <ScissorsIcon className="mr-2 h-4 w-4 text-barber-gold" />
                  Total de Serviços
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.totalServices}</div>
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
              <SelectTrigger className="w-[180px] bg-barber-dark text-barber-light border-gray-700">
                <SelectValue placeholder="Selecione o mês" />
              </SelectTrigger>
              <SelectContent className="bg-barber-dark text-barber-light border-gray-700">
                {meses.map(mes => (
                  <SelectItem key={mes.value} value={mes.value} className="text-barber-light">
                    {mes.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-[180px] bg-barber-dark text-barber-light border-gray-700">
                <SelectValue placeholder="Selecione o ano" />
              </SelectTrigger>
              <SelectContent className="bg-barber-dark text-barber-light border-gray-700">
                {anos.map(ano => (
                  <SelectItem key={ano} value={ano} className="text-barber-light">
                    {ano}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Faturamento do Mês */}
            <Card className="bg-barber-blue text-barber-light border-gray-700">
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  Faturamento de {meses[parseInt(selectedMonth) - 1].label}/{selectedYear}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(calcularFaturamentoMes(parseInt(selectedMonth), parseInt(selectedYear)))}
                </div>
              </CardContent>
            </Card>

            {/* Faturamento do Mês Anterior */}
            <Card className="bg-barber-blue text-barber-light border-gray-700">
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  Faturamento de {meses[parseInt(selectedMonth) - 2 < 0 ? 11 : parseInt(selectedMonth) - 2].label}/{parseInt(selectedMonth) === 1 ? parseInt(selectedYear) - 1 : selectedYear}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(calcularFaturamentoMes(
                    parseInt(selectedMonth) === 1 ? 12 : parseInt(selectedMonth) - 1,
                    parseInt(selectedMonth) === 1 ? parseInt(selectedYear) - 1 : parseInt(selectedYear)
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Agendamentos por Dia da Semana */}
          <Card className="bg-barber-blue text-barber-light border-gray-700">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Agendamentos por Dia da Semana</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={calcularAgendamentosPorDia()}>
                    <XAxis dataKey="dia" stroke="#E5E7EB" />
                    <YAxis stroke="#E5E7EB" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1E293B',
                        border: '1px solid #374151',
                        color: '#E5E7EB'
                      }}
                    />
                    <Bar dataKey="agendamentos" fill="#FCD34D" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Serviços Mais Populares */}
          <Card className="bg-barber-blue text-barber-light border-gray-700">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Serviços Mais Populares</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={calcularServicosPopulares()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {calcularServicosPopulares().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1E293B',
                        border: '1px solid #374151',
                        color: '#E5E7EB'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Horários Mais Procurados */}
          <Card className="bg-barber-blue text-barber-light border-gray-700">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Horários Mais Procurados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={calcularHorariosPopulares()}>
                    <XAxis dataKey="horario" stroke="#E5E7EB" />
                    <YAxis stroke="#E5E7EB" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1E293B',
                        border: '1px solid #374151',
                        color: '#E5E7EB'
                      }}
                    />
                    <Bar dataKey="agendamentos" fill="#FCD34D" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>
    </Tabs>
  );
};

export default Dashboard;
