
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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
  addClient: (client: Omit<Client, "id">) => Client;
  findClientByPhone: (phone: string) => Client | undefined;
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

export const BarberShopProvider = ({ children }: { children: ReactNode }) => {
  const [config, setConfig] = useState<BarberShopConfig>(() => {
    const savedConfig = localStorage.getItem('barberShopConfig');
    return savedConfig ? JSON.parse(savedConfig) : defaultConfig;
  });
  
  const [services, setServices] = useState<Service[]>(() => {
    const savedServices = localStorage.getItem('barberShopServices');
    return savedServices ? JSON.parse(savedServices) : initialServices;
  });
  
  const [clients, setClients] = useState<Client[]>(() => {
    const savedClients = localStorage.getItem('barberShopClients');
    return savedClients ? JSON.parse(savedClients) : [];
  });
  
  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    const savedAppointments = localStorage.getItem('barberShopAppointments');
    if (savedAppointments) {
      const parsedAppointments = JSON.parse(savedAppointments);
      return parsedAppointments.map((app: any) => ({
        ...app,
        date: new Date(app.date)
      }));
    }
    return [];
  });

  // Persistir no localStorage quando os dados mudam
  useEffect(() => {
    localStorage.setItem('barberShopConfig', JSON.stringify(config));
  }, [config]);

  useEffect(() => {
    localStorage.setItem('barberShopServices', JSON.stringify(services));
  }, [services]);

  useEffect(() => {
    localStorage.setItem('barberShopClients', JSON.stringify(clients));
  }, [clients]);

  useEffect(() => {
    localStorage.setItem('barberShopAppointments', JSON.stringify(appointments));
  }, [appointments]);

  // Funções de gerenciamento
  const updateConfig = (newConfig: BarberShopConfig) => {
    setConfig(newConfig);
  };

  const addService = (service: Omit<Service, "id">) => {
    const newService = {
      ...service,
      id: crypto.randomUUID()
    };
    setServices([...services, newService]);
  };

  const updateService = (updatedService: Service) => {
    setServices(services.map(service => 
      service.id === updatedService.id ? updatedService : service
    ));
  };

  const deleteService = (id: string) => {
    setServices(services.filter(service => service.id !== id));
  };

  const addClient = (client: Omit<Client, "id">): Client => {
    // Verificar se o cliente já existe pelo telefone
    const existingClient = clients.find(c => c.phone === client.phone);
    if (existingClient) {
      return existingClient;
    }
    
    const newClient = {
      ...client,
      id: crypto.randomUUID()
    };
    setClients([...clients, newClient]);
    return newClient;
  };

  const findClientByPhone = (phone: string): Client | undefined => {
    return clients.find(client => client.phone === phone);
  };

  const addAppointment = (appointment: Omit<Appointment, "id">) => {
    const newAppointment = {
      ...appointment,
      id: crypto.randomUUID()
    };
    setAppointments([...appointments, newAppointment]);
  };

  const updateAppointment = (updatedAppointment: Appointment) => {
    setAppointments(appointments.map(appointment => 
      appointment.id === updatedAppointment.id ? updatedAppointment : appointment
    ));
  };

  const deleteAppointment = (id: string) => {
    setAppointments(appointments.filter(appointment => appointment.id !== id));
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
    const availableSlots = timeSlots.filter(slot => !bookedSlots.has(slot));
    
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
