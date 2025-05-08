import { useState, useEffect } from 'react';
import { useBarberShop, Service, BarberShopConfig } from '@/contexts/BarberShopContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X, Plus, Pencil, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

// Máscara para formato de telefone
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

// Gerar opções de horário
const generateTimeOptions = () => {
  const options = [];
  for (let h = 6; h <= 22; h++) {
    for (let m = 0; m < 60; m += 30) {
      const hour = h.toString().padStart(2, '0');
      const minute = m.toString().padStart(2, '0');
      options.push(`${hour}:${minute}`);
    }
  }
  return options;
};

const timeOptions = generateTimeOptions();

const Settings = () => {
  const { config, updateConfig, services, addService, updateService, deleteService } = useBarberShop();
  const { toast } = useToast();
  
  // Estado para a configuração da barbearia
  const [barberConfig, setBarberConfig] = useState<BarberShopConfig>({
    id: config.id || '',
    name: config.name || '',
    address: config.address || '',
    city: config.city || '',
    whatsapp: config.whatsapp || '',
    openingTime: config.openingTime || '09:00',
    closingTime: config.closingTime || '19:00',
    automation: {
      enabled: config.automation?.enabled || false,
      apiUrl: config.automation?.apiUrl || '',
      apiKey: config.automation?.apiKey || '',
      mensagemPadrao: config.automation?.mensagemPadrao || ''
    }
  });
  
  // Atualizar o estado local quando as configurações mudarem
  useEffect(() => {
    setBarberConfig({
      id: config.id || '',
      name: config.name || '',
      address: config.address || '',
      city: config.city || '',
      whatsapp: config.whatsapp || '',
      openingTime: config.openingTime || '09:00',
      closingTime: config.closingTime || '19:00',
      automation: {
        enabled: config.automation?.enabled || false,
        apiUrl: config.automation?.apiUrl || '',
        apiKey: config.automation?.apiKey || '',
        mensagemPadrao: config.automation?.mensagemPadrao || ''
      }
    });
  }, [config]);
  
  // Estado para edição/adição de serviço
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [newService, setNewService] = useState<Omit<Service, 'id'>>({
    name: '',
    price: 0,
    duration: 30
  });
  
  // Estado para confirmação de exclusão de serviço
  const [deleteServiceId, setDeleteServiceId] = useState<string | null>(null);
  
  // Atualizar configuração da barbearia
  const handleConfigSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateConfig(barberConfig);
    toast({
      title: "Configurações salvas",
      description: "As configurações da barbearia foram atualizadas com sucesso."
    });
  };
  
  // Atualizar campo de configuração
  const updateConfigField = (field: string, value: string) => {
    if (field === 'openingTime' || field === 'closingTime') {
      setBarberConfig({
        ...barberConfig,
        [field]: value
      });
    } else if (field === 'whatsapp') {
      setBarberConfig({
        ...barberConfig,
        [field]: formatPhoneNumber(value)
      });
    } else {
      setBarberConfig({
        ...barberConfig,
        [field]: value
      });
    }
  };
  
  // Adicionar novo serviço
  const handleAddService = async () => {
    if (!newService.name || newService.price <= 0 || newService.duration <= 0) {
      toast({
        title: "Dados inválidos",
        description: "Preencha todos os campos corretamente.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      // Insere no Supabase
      const { data, error } = await supabase
        .from('servicos')
        .insert([
          {
            nome: newService.name,
            preco: newService.price,
            duracao: newService.duration,
            created_at: new Date().toISOString()
          }
        ])
        .select()
        .single()

      if (error) throw error

      // Atualiza o contexto local
      addService(newService)
      
      // Limpa o formulário
      setNewService({
        name: '',
        price: 0,
        duration: 30
      });
      
      toast({
        title: "Serviço adicionado",
        description: `O serviço ${newService.name} foi adicionado com sucesso.`
      });
    } catch (error) {
      console.error('Erro ao adicionar serviço:', error)
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o serviço. Tente novamente.",
        variant: "destructive"
      });
    }
  };
  
  // Atualizar serviço existente
  const handleUpdateService = () => {
    if (!editingService) return;
    
    if (!editingService.name || editingService.price <= 0 || editingService.duration <= 0) {
      toast({
        title: "Dados inválidos",
        description: "Preencha todos os campos corretamente.",
        variant: "destructive"
      });
      return;
    }
    
    updateService(editingService);
    setEditingService(null);
    
    toast({
      title: "Serviço atualizado",
      description: `O serviço ${editingService.name} foi atualizado com sucesso.`
    });
  };
  
  // Confirmar exclusão de serviço
  const handleConfirmDelete = () => {
    if (!deleteServiceId) return;
    
    deleteService(deleteServiceId);
    setDeleteServiceId(null);
    
    toast({
      title: "Serviço excluído",
      description: "O serviço foi excluído com sucesso."
    });
  };
  
  return (
    <Tabs defaultValue="general" className="w-full">
      <TabsList className="grid grid-cols-3 bg-barber-blue">
        <TabsTrigger 
          value="general" 
          className="text-barber-light data-[state=active]:text-barber-gold data-[state=active]:shadow-none"
        >
          Geral
        </TabsTrigger>
        <TabsTrigger 
          value="services" 
          className="text-barber-light data-[state=active]:text-barber-gold data-[state=active]:shadow-none"
        >
          Serviços
        </TabsTrigger>
        <TabsTrigger 
          value="automation" 
          className="text-barber-light data-[state=active]:text-barber-gold data-[state=active]:shadow-none"
        >
          Automação
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="general">
        <Card className="bg-barber-blue border-gray-700">
          <CardHeader>
            <CardTitle className="text-barber-gold">Configurações da Barbearia</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleConfigSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-barber-light">Nome da Barbearia</label>
                <Input
                  value={barberConfig.name}
                  onChange={(e) => updateConfigField('name', e.target.value)}
                  placeholder="Nome da barbearia"
                  className="bg-barber-dark text-barber-light border-gray-700"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-barber-light">Endereço</label>
                <Input
                  value={barberConfig.address}
                  onChange={(e) => updateConfigField('address', e.target.value)}
                  placeholder="Endereço"
                  className="bg-barber-dark text-barber-light border-gray-700"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-barber-light">Cidade/UF</label>
                <Input
                  value={barberConfig.city}
                  onChange={(e) => updateConfigField('city', e.target.value)}
                  placeholder="Cidade, UF"
                  className="bg-barber-dark text-barber-light border-gray-700"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-barber-light">WhatsApp</label>
                <Input
                  value={barberConfig.whatsapp}
                  onChange={(e) => updateConfigField('whatsapp', e.target.value)}
                  placeholder="(00) 00000-0000"
                  maxLength={16}
                  className="bg-barber-dark text-barber-light border-gray-700"
                  required
                />
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center text-barber-light">
                  <Clock className="h-5 w-5 mr-2" />
                  <label className="font-medium">Horário de Funcionamento</label>
                </div>
                
                <div className="grid grid-cols-2 gap-4 bg-barber-dark p-3 rounded-md border border-gray-700">
                  <div className="space-y-2">
                    <label className="text-barber-light text-sm">Horário de Abertura</label>
                    <Select 
                      value={barberConfig.openingTime}
                      onValueChange={(value) => updateConfigField('openingTime', value)}
                    >
                      <SelectTrigger className="bg-barber-blue text-barber-light border-gray-700">
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent className="bg-barber-blue text-barber-light border-gray-700 max-h-56">
                        {timeOptions.map((time) => (
                          <SelectItem key={`start-${time}`} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-barber-light text-sm">H. de Encerramento</label>
                    <Select 
                      value={barberConfig.closingTime}
                      onValueChange={(value) => updateConfigField('closingTime', value)}
                    >
                      <SelectTrigger className="bg-barber-blue text-barber-light border-gray-700">
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent className="bg-barber-blue text-barber-light border-gray-700 max-h-56">
                        {timeOptions.map((time) => (
                          <SelectItem key={`end-${time}`} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="col-span-2 pt-1 text-center text-xs text-barber-gold">
                    {barberConfig.openingTime && barberConfig.closingTime && (
                      <p>A barbearia abrirá das {barberConfig.openingTime} às {barberConfig.closingTime}</p>
                    )}
                  </div>
                </div>
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-barber-gold hover:bg-amber-600 text-barber-dark"
              >
                Salvar Configurações
              </Button>
            </form>
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="services">
        <Card className="bg-barber-blue border-gray-700">
          <CardHeader>
            <CardTitle className="text-barber-gold">Gerenciar Serviços</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Lista de serviços existentes */}
              <div className="space-y-3">
                {services.map(service => (
                  <div 
                    key={service.id} 
                    className="bg-barber-dark p-3 rounded-lg flex items-center justify-between border border-gray-700"
                  >
                    <div>
                      <h3 className="font-medium text-barber-light">{service.name}</h3>
                      <div className="flex text-sm space-x-4">
                        <span className="text-barber-gold">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(service.price)}
                        </span>
                        <span className="text-barber-light">
                          {service.duration} min
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => setEditingService({...service})}
                        className="text-barber-gold border-barber-gold hover:bg-barber-gold/20"
                      >
                        <Pencil size={16} />
                      </Button>
                      
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => setDeleteServiceId(service.id)}
                        className="text-red-500 border-red-500 hover:bg-red-500/20"
                      >
                        <X size={16} />
                      </Button>
                    </div>
                  </div>
                ))}
                
                {services.length === 0 && (
                  <p className="text-center py-4 text-barber-light">
                    Nenhum serviço cadastrado.
                  </p>
                )}
              </div>
              
              {/* Formulário para adicionar novo serviço */}
              <Card className="bg-barber-dark border-gray-700">
                <CardHeader className="py-3">
                  <CardTitle className="text-barber-light text-sm flex items-center">
                    <Plus size={16} className="mr-2 text-barber-gold" />
                    Adicionar Novo Serviço
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-xs text-barber-light">Nome do Serviço</label>
                      <Input
                        value={newService.name}
                        onChange={(e) => setNewService({...newService, name: e.target.value})}
                        placeholder="Ex: Corte Masculino"
                        className="bg-barber-blue text-barber-light border-gray-700 h-8 text-sm"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-xs text-barber-light">Preço (R$)</label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={newService.price}
                          onChange={(e) => setNewService({...newService, price: parseFloat(e.target.value) || 0})}
                          placeholder="0,00"
                          className="bg-barber-blue text-barber-light border-gray-700 h-8 text-sm"
                        />
                      </div>
                      
                      <div className="space-y-1">
                        <label className="text-xs text-barber-light">Duração (min)</label>
                        <Input
                          type="number"
                          min="0"
                          step="5"
                          value={newService.duration}
                          onChange={(e) => setNewService({...newService, duration: parseInt(e.target.value) || 0})}
                          placeholder="30"
                          className="bg-barber-blue text-barber-light border-gray-700 h-8 text-sm"
                        />
                      </div>
                    </div>
                    
                    <Button 
                      onClick={handleAddService} 
                      className="w-full bg-barber-gold hover:bg-amber-600 text-barber-dark h-8 mt-2"
                    >
                      Adicionar Serviço
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="automation">
        <Card className="bg-barber-blue border-gray-700">
          <CardHeader>
            <CardTitle className="text-barber-gold">Configurações de Automação</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-barber-light">Status da Automação</label>
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="outline" 
                    className={`${barberConfig.automation?.enabled ? 'bg-barber-gold text-barber-dark' : 'bg-barber-dark text-barber-light'} border-gray-700 hover:bg-barber-gold/20`}
                    onClick={() => {
                      setBarberConfig({
                        ...barberConfig,
                        automation: {
                          ...barberConfig.automation!,
                          enabled: !barberConfig.automation?.enabled
                        }
                      });
                    }}
                  >
                    {barberConfig.automation?.enabled ? 'Automação Ativada' : 'Ativar Automação'}
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="bg-barber-dark p-3 rounded-lg border border-gray-700">
                  <h3 className="font-medium text-barber-light mb-2">URL da Api</h3>
                  <p className="text-sm text-barber-light mb-2">
                    URL base da API
                  </p>
                  <Input
                    id="apiUrl"
                    value={barberConfig.automation?.apiUrl || ''}
                    onChange={(e) => {
                      setBarberConfig({
                        ...barberConfig,
                        automation: {
                          ...barberConfig.automation!,
                          apiUrl: e.target.value
                        }
                      });
                    }}
                    placeholder="https://sua-api.com"
                  />
                </div>

                <div className="bg-barber-dark p-3 rounded-lg border border-gray-700">
                  <h3 className="font-medium text-barber-light mb-2">KEY da Api</h3>
                  <p className="text-sm text-barber-light mb-2">
                    Sua chave de acesso à API
                  </p>
                  <Input
                    id="apiKey"
                    type="password"
                    value={barberConfig.automation?.apiKey || ''}
                    onChange={(e) => {
                      setBarberConfig({
                        ...barberConfig,
                        automation: {
                          ...barberConfig.automation!,
                          apiKey: e.target.value
                        }
                      });
                    }}
                    placeholder="Sua chave da API"
                  />
                </div>
              </div>
              
              <Button 
                onClick={async () => {
                  try {
                    await updateConfig(barberConfig);
                    toast({
                      title: "Configurações salvas",
                      description: "As configurações de automação foram atualizadas com sucesso."
                    });
                  } catch (error) {
                    console.error('Erro ao salvar configurações:', error);
                    toast({
                      title: "Erro ao salvar",
                      description: "Não foi possível salvar as configurações de automação.",
                      variant: "destructive"
                    });
                  }
                }}
                className="w-full bg-barber-gold hover:bg-amber-600 text-barber-dark"
              >
                Salvar Configurações de Automação
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      
      {/* Dialog para editar serviço */}
      <AlertDialog 
        open={!!editingService} 
        onOpenChange={(open) => !open && setEditingService(null)}
      >
        <AlertDialogContent className="bg-barber-blue text-barber-light border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-barber-gold">Editar Serviço</AlertDialogTitle>
          </AlertDialogHeader>
          
          {editingService && (
            <div className="space-y-3 py-2">
              <div className="space-y-1">
                <label className="text-sm text-barber-light">Nome do Serviço</label>
                <Input
                  value={editingService.name}
                  onChange={(e) => setEditingService({...editingService, name: e.target.value})}
                  className="bg-barber-dark text-barber-light border-gray-700"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-sm text-barber-light">Preço (R$)</label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={editingService.price}
                    onChange={(e) => setEditingService({...editingService, price: parseFloat(e.target.value) || 0})}
                    className="bg-barber-dark text-barber-light border-gray-700"
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="text-sm text-barber-light">Duração (min)</label>
                  <Input
                    type="number"
                    min="0"
                    step="5"
                    value={editingService.duration}
                    onChange={(e) => setEditingService({...editingService, duration: parseInt(e.target.value) || 0})}
                    className="bg-barber-dark text-barber-light border-gray-700"
                  />
                </div>
              </div>
            </div>
          )}
          
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-barber-dark text-barber-light hover:bg-gray-700 border-gray-700">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleUpdateService}
              className="bg-barber-gold text-barber-dark hover:bg-amber-600"
            >
              Salvar Alterações
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Dialog para confirmar exclusão */}
      <AlertDialog 
        open={!!deleteServiceId} 
        onOpenChange={(open) => !open && setDeleteServiceId(null)}
      >
        <AlertDialogContent className="bg-barber-blue text-barber-light border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-barber-gold">Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription className="text-barber-light">
              Tem certeza que deseja excluir este serviço? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-barber-dark text-barber-light hover:bg-gray-700 border-gray-700">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Tabs>
  );
};

export default Settings;
