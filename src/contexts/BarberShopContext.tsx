import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabaseClient';

// Tipos para os dados do contexto
export interface Service {
  id: string;
  name: string;
  price: number;
  duration: number; // em minutos
}

export interface Client {
  id: string;
  name: string;
  phone: string;
}

export interface Appointment {
  id: string;
  clientId: string;
  serviceId: string;
  date: Date;
  status: string;
  data_conclusao?: string;
  notes?: string;
}

export interface BarberShopConfig {
  name: string;
  address: string;
  city: string;
  whatsapp: string;
  workingHours: {
    start: string; // formato "09:00"
    end: string; // formato "19:00"
  };
}

interface BarberShopContextType {
  config: BarberShopConfig;
  services: Service[];
  clients: Client[];
  appointments: Appointment[];
  updateConfig: (newConfig: BarberShopConfig) => void;
  addService: (service: Omit<Service, "id">) => void;
  updateService: (service: Service) => void;
  deleteService: (id: string) => void;
  addClient: (client: Omit<Client, "id">) => Promise<Client>;
  findClientByPhone: (phone: string) => Promise<Client | undefined>;
  addAppointment: (appointment: Omit<Appointment, "id">) => void;
  updateAppointment: (appointment: Appointment) => void;
  deleteAppointment: (id: string) => void;
  getAvailableTimeSlots: (date: Date, serviceId: string, excludeAppointmentId?: string) => string[];
}

// Valores padrão para o contexto
const defaultConfig: BarberShopConfig = {
  name: "Estilo Barbearia VIP",
  address: "Rua Exemplo, 123",
  city: "São Paulo, SP",
  whatsapp: "5511999999999",
  workingHours: {
    start: "09:00",
    end: "19:00"
  }
};

// Mock de serviços iniciais
const initialServices: Service[] = [
  { id: "1", name: "Corte Masculino", price: 35, duration: 30 },
  { id: "2", name: "Barba", price: 25, duration: 20 },
  { id: "3", name: "Corte + Barba", price: 55, duration: 50 },
];

const BarberShopContext = createContext<BarberShopContextType | undefined>(undefined);

export const useBarberShop = () => {
  const context = useContext(BarberShopContext);
  if (!context) {
    throw new Error("useBarberShop deve ser usado dentro de um BarberShopProvider");
  }
  return context;
};

// Função alternativa para gerar UUID (substitui crypto.randomUUID)
function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export const BarberShopProvider = ({ children }: { children: ReactNode }) => {
  const [config, setConfig] = useState<BarberShopConfig>(defaultConfig);
  const [services, setServices] = useState<Service[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  // Carrega serviços do Supabase
  useEffect(() => {
    async function loadServices() {
      try {
        const { data, error } = await supabase
          .from('servicos')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Converte os dados do Supabase para o formato do contexto
        const formattedServices = data.map(servico => ({
          id: servico.id.toString(),
          name: servico.nome,
          price: servico.preco,
          duration: servico.duracao
        }));

        setServices(formattedServices);
      } catch (error) {
        console.error('Erro ao carregar serviços:', error);
      } finally {
        setLoading(false);
      }
    }

    loadServices();
  }, []);

  // Carrega clientes do Supabase
  useEffect(() => {
    async function loadClients() {
      try {
        const { data, error } = await supabase
          .from('clientes')
          .select('*')
          .order('nome');

        if (error) throw error;

        // Converte os dados do Supabase para o formato do contexto
        const formattedClients = data.map(cliente => ({
          id: cliente.id.toString(),
          name: cliente.nome,
          phone: cliente.telefone
        }));

        setClients(formattedClients);
      } catch (error) {
        console.error('Erro ao carregar clientes:', error);
      }
    }

    loadClients();
  }, []);

  // Carrega agendamentos do Supabase
  useEffect(() => {
    async function loadAppointments() {
      try {
        const { data, error } = await supabase
          .from('agendamentos')
          .select(`
            *,
            clientes:cliente_id(nome, telefone),
            servicos:servico_id(nome, preco, duracao)
          `)
          .order('data', { ascending: true })
          .order('horario', { ascending: true });

        if (error) throw error;

        // Converte os dados do Supabase para o formato do contexto
        const formattedAppointments = data.map(agendamento => ({
          id: agendamento.id.toString(),
          clientId: agendamento.cliente_id.toString(),
          serviceId: agendamento.servico_id.toString(),
          date: new Date(`${agendamento.data}T${agendamento.horario}`),
          status: agendamento.status || 'pendente',
          data_conclusao: agendamento.data_conclusao,
          notes: agendamento.observacoes
        }));

        console.log('Agendamentos carregados:', formattedAppointments); // Debug
        setAppointments(formattedAppointments);
      } catch (error) {
        console.error('Erro ao carregar agendamentos:', error);
      } finally {
        setLoading(false);
      }
    }

    loadAppointments();
  }, []);

  // Carrega configurações do Supabase
  useEffect(() => {
    async function loadConfig() {
      try {
        const { data, error } = await supabase
          .from('configuracoes')
          .select('*')
          .limit(1);

        if (error) throw error;

        if (data && data.length > 0) {
          const configData = data[0];
          const newConfig = {
            name: configData.nome || defaultConfig.name,
            address: configData.endereco || defaultConfig.address,
            city: configData.cidade || defaultConfig.city,
            whatsapp: configData.whatsapp || defaultConfig.whatsapp,
            workingHours: {
              start: configData.horario_inicio || defaultConfig.workingHours.start,
              end: configData.horario_fim || defaultConfig.workingHours.end
            }
          };
          setConfig(newConfig);
        } else {
          // Se não houver configurações no banco, usa as configurações padrão
          setConfig(defaultConfig);
        }
      } catch (error) {
        console.error('Erro ao carregar configurações:', error);
        // Em caso de erro, usa as configurações padrão
        setConfig(defaultConfig);
      }
    }

    loadConfig();
  }, []);

  // Funções de gerenciamento
  const updateConfig = async (newConfig: BarberShopConfig) => {
    try {
      // Primeiro, deletar todas as configurações existentes
      const { error: deleteError } = await supabase
        .from('configuracoes')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Deleta todos os registros

      if (deleteError) throw deleteError;

      // Depois, inserir a nova configuração
      const { error: insertError } = await supabase
        .from('configuracoes')
        .insert({
          nome: newConfig.name,
          endereco: newConfig.address,
          cidade: newConfig.city,
          whatsapp: newConfig.whatsapp,
          horario_inicio: newConfig.workingHours.start,
          horario_fim: newConfig.workingHours.end
        });

      if (insertError) throw insertError;

      setConfig(newConfig);
    } catch (error) {
      console.error('Erro ao atualizar configurações:', error);
      throw error;
    }
  };

  const addService = async (service: Omit<Service, "id">) => {
    try {
      const { data, error } = await supabase
        .from('servicos')
        .insert([
          {
            nome: service.name,
            preco: service.price,
            duracao: service.duration
          }
        ])
        .select()
        .single();

      if (error) throw error;

      const newService = {
        ...service,
        id: data.id.toString()
      };
      setServices([...services, newService]);
    } catch (error) {
      console.error('Erro ao adicionar serviço:', error);
      throw error;
    }
  };

  const updateService = async (updatedService: Service) => {
    try {
      const { error } = await supabase
        .from('servicos')
        .update({
          nome: updatedService.name,
          preco: updatedService.price,
          duracao: updatedService.duration
        })
        .eq('id', updatedService.id);

      if (error) throw error;

      setServices(services.map(service => 
        service.id === updatedService.id ? updatedService : service
      ));
    } catch (error) {
      console.error('Erro ao atualizar serviço:', error);
      throw error;
    }
  };

  const deleteService = async (id: string) => {
    try {
      const { error } = await supabase
        .from('servicos')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setServices(services.filter(service => service.id !== id));
    } catch (error) {
      console.error('Erro ao deletar serviço:', error);
      throw error;
    }
  };

  const addClient = async (client: Omit<Client, "id">): Promise<Client> => {
    try {
      // Salvar telefone apenas com números
      const cleanPhone = client.phone.replace(/\D/g, '');
      
      // Primeiro, verificar se o cliente já existe no estado local
      const existingLocalClient = clients.find(c => c.phone.replace(/\D/g, '') === cleanPhone);
      if (existingLocalClient) {
        return existingLocalClient;
      }

      // Se não existir localmente, verificar no Supabase
      const { data: existingClient, error: searchError } = await supabase
        .from('clientes')
        .select('*')
        .eq('telefone', cleanPhone)
        .maybeSingle();

      if (searchError && searchError.code !== 'PGRST116') {
        console.error('Erro ao buscar cliente existente:', searchError);
        throw searchError;
      }

      if (existingClient) {
        const formattedClient = {
          id: existingClient.id.toString(),
          name: existingClient.nome,
          phone: existingClient.telefone
        };
        
        // Atualizar o estado local
        setClients(prevClients => {
          if (!prevClients.find(c => c.id === formattedClient.id)) {
            return [...prevClients, formattedClient];
          }
          return prevClients;
        });
        
        return formattedClient;
      }

      // Se não existir, criar novo cliente
      const { data: newClient, error: insertError } = await supabase
        .from('clientes')
        .insert([
          {
            nome: client.name,
            telefone: cleanPhone
          }
        ])
        .select()
        .single();

      if (insertError) {
        console.error('Erro ao criar novo cliente:', insertError);
        throw insertError;
      }

      const formattedClient = {
        id: newClient.id.toString(),
        name: newClient.nome,
        phone: newClient.telefone
      };

      // Atualizar o estado local
      setClients(prevClients => [...prevClients, formattedClient]);
      return formattedClient;
    } catch (error) {
      console.error('Erro ao adicionar cliente:', error);
      throw error;
    }
  };

  const findClientByPhone = async (phone: string): Promise<Client | undefined> => {
    try {
      // Limpar o telefone para buscar apenas por números
      const cleanPhone = phone.replace(/\D/g, '');
      
      // Primeiro, tenta encontrar o cliente no estado local
      const localClient = clients.find(c => c.phone.replace(/\D/g, '') === cleanPhone);
      if (localClient) return localClient;

      // Se não encontrar localmente, busca no Supabase
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .eq('telefone', cleanPhone)
        .maybeSingle();

      if (error) {
        console.error('Erro ao buscar cliente:', error);
        return undefined;
      }

      if (!data) return undefined;

      const client = {
        id: data.id.toString(),
        name: data.nome,
        phone: data.telefone
      };

      // Atualiza o estado local com o cliente encontrado
      setClients(prevClients => {
        if (!prevClients.find(c => c.id === client.id)) {
          return [...prevClients, client];
        }
        return prevClients;
      });

      return client;
    } catch (error) {
      console.error('Erro ao buscar cliente:', error);
      return undefined;
    }
  };

  const addAppointment = async (appointment: Omit<Appointment, "id">) => {
    try {
      const { data, error } = await supabase
        .from('agendamentos')
        .insert([
          {
            cliente_id: parseInt(appointment.clientId),
            servico_id: parseInt(appointment.serviceId),
            data: appointment.date.toISOString().split('T')[0],
            horario: appointment.date.toTimeString().split(' ')[0].substring(0, 5),
            status: 'pendente'
          }
        ])
        .select()
        .single();

      if (error) throw error;

      const newAppointment = {
        ...appointment,
        id: data.id.toString(),
        status: 'pendente'
      };
      setAppointments([...appointments, newAppointment]);
    } catch (error) {
      console.error('Erro ao adicionar agendamento:', error);
      throw error;
    }
  };

  const updateAppointment = async (updatedAppointment: Appointment) => {
    try {
      console.log('Atualizando agendamento:', updatedAppointment); // Debug
      
      const { error } = await supabase
        .from('agendamentos')
        .update({
          cliente_id: parseInt(updatedAppointment.clientId),
          servico_id: parseInt(updatedAppointment.serviceId),
          data: updatedAppointment.date.toISOString().split('T')[0],
          horario: updatedAppointment.date.toTimeString().split(' ')[0].substring(0, 5),
          status: updatedAppointment.status,
          data_conclusao: updatedAppointment.data_conclusao,
          observacoes: updatedAppointment.notes
        })
        .eq('id', updatedAppointment.id);

      if (error) throw error;

      // Atualiza o estado local
      setAppointments(prevAppointments => 
        prevAppointments.map(appointment => 
          appointment.id === updatedAppointment.id ? updatedAppointment : appointment
        )
      );
    } catch (error) {
      console.error('Erro ao atualizar agendamento:', error);
      throw error;
    }
  };

  const deleteAppointment = async (id: string) => {
    try {
      // Deleta no Supabase
      const { error } = await supabase
        .from('agendamentos')
        .delete()
        .eq('id', parseInt(id));

      if (error) throw error;

      // Atualiza o contexto local
      setAppointments(appointments.filter(appointment => appointment.id !== id));
    } catch (error) {
      console.error('Erro ao deletar agendamento:', error);
      throw error;
    }
  };

  // Função para obter horários disponíveis
  const getAvailableTimeSlots = (date: Date, serviceId: string, excludeAppointmentId?: string): string[] => {
    const selectedDate = new Date(date);
    selectedDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Se a data é anterior a hoje, não há horários disponíveis
    if (selectedDate < today) {
      return [];
    }
    
    const selectedService = services.find(service => service.id === serviceId);
    if (!selectedService) return [];
    
    const serviceDuration = selectedService.duration;
    
    // Gerar slots de horário com base no horário de funcionamento
    const [startHour, startMinute] = config.workingHours.start.split(':').map(Number);
    const [endHour, endMinute] = config.workingHours.end.split(':').map(Number);
    
    const startTime = startHour * 60 + startMinute;
    const endTime = endHour * 60 + endMinute;
    
    const timeSlots: string[] = [];
    
    // Gerar slots de 30 minutos
    for (let time = startTime; time + serviceDuration <= endTime; time += 30) {
      const hour = Math.floor(time / 60);
      const minute = time % 60;
      timeSlots.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
    }
    
    // Remover slots que se sobrepõem com agendamentos existentes
    const dayAppointments = appointments.filter(app => {
      // Excluir o agendamento que está sendo editado (se fornecido)
      if (excludeAppointmentId && app.id === excludeAppointmentId) {
        return false;
      }
      
      const appDate = new Date(app.date);
      appDate.setHours(0, 0, 0, 0);
      return appDate.getTime() === selectedDate.getTime();
    });
    
    const bookedSlots = new Set<string>();
    
    dayAppointments.forEach(app => {
      const appDate = new Date(app.date);
      const appHour = appDate.getHours();
      const appMinute = appDate.getMinutes();
      const appTime = appHour * 60 + appMinute;
      
      // Encontrar o serviço deste agendamento
      const appService = services.find(service => service.id === app.serviceId);
      if (!appService) return;
      
      // Bloquear todos os slots que se sobrepõem à duração do serviço
      for (let i = 0; i < appService.duration; i += 30) {
        const blockedTime = appTime + i;
        const blockedHour = Math.floor(blockedTime / 60);
        const blockedMinute = blockedTime % 60;
        const timeStr = `${blockedHour.toString().padStart(2, '0')}:${blockedMinute.toString().padStart(2, '0')}`;
        bookedSlots.add(timeStr);
      }
    });
    
    // Filtrar slots ocupados
    const availableSlots = timeSlots.filter(slot => {
      // Verificar se o slot está ocupado
      if (bookedSlots.has(slot)) return false;
      
      // Verificar se o slot se sobrepõe com algum agendamento existente
      const [slotHour, slotMinute] = slot.split(':').map(Number);
      const slotTime = slotHour * 60 + slotMinute;
      
      for (const app of dayAppointments) {
        const appDate = new Date(app.date);
        const appHour = appDate.getHours();
        const appMinute = appDate.getMinutes();
        const appTime = appHour * 60 + appMinute;
        
        const appService = services.find(service => service.id === app.serviceId);
        if (!appService) continue;
        
        // Verificar se o slot se sobrepõe com o agendamento
        if (slotTime >= appTime && slotTime < appTime + appService.duration) {
          return false;
        }
      }
      
      return true;
    });
    
    // Se a data for hoje, remover horários passados
    if (selectedDate.getTime() === today.getTime()) {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentTime = currentHour * 60 + currentMinute;
      
      return availableSlots.filter(slot => {
        const [slotHour, slotMinute] = slot.split(':').map(Number);
        const slotTime = slotHour * 60 + slotMinute;
        return slotTime > currentTime;
      });
    }
    
    return availableSlots;
  };

  const value = {
    config,
    services,
    clients,
    appointments,
    updateConfig,
    addService,
    updateService,
    deleteService,
    addClient,
    findClientByPhone,
    addAppointment,
    updateAppointment,
    deleteAppointment,
    getAvailableTimeSlots,
  };

  return (
    <BarberShopContext.Provider value={value}>
      {children}
    </BarberShopContext.Provider>
  );
};
