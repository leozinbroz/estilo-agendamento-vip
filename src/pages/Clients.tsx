import { useState } from 'react';
import { useBarberShop } from '@/contexts/BarberShopContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Trash2, User } from 'lucide-react';
import { deletarCliente } from '@/examples/supabaseExample';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

const Clients = () => {
  const { clients, appointments, services } = useBarberShop();
  const [searchQuery, setSearchQuery] = useState('');
  const [clientToDelete, setClientToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Filtrar clientes com base na pesquisa
  const filteredClients = clients.filter(client => {
    const searchLower = searchQuery.toLowerCase();
    return (
      client.name.toLowerCase().includes(searchLower) || 
      client.phone.includes(searchQuery)
    );
  });

  // Ordenar clientes por nome
  const sortedClients = [...filteredClients].sort((a, b) => 
    a.name.localeCompare(b.name)
  );

  // Obter informações adicionais do cliente
  const getClientInfo = (clientId: string) => {
    const clientAppointments = appointments.filter(app => app.clientId === clientId);
    
    // Total gasto
    let totalSpent = 0;
    clientAppointments.forEach(app => {
      const service = services.find(s => s.id === app.serviceId);
      if (service) {
        totalSpent += service.price;
      }
    });
    
    // Serviço mais utilizado
    const serviceCount: Record<string, number> = {};
    clientAppointments.forEach(app => {
      serviceCount[app.serviceId] = (serviceCount[app.serviceId] || 0) + 1;
    });
    
    let mostUsedServiceId = '';
    let maxCount = 0;
    Object.entries(serviceCount).forEach(([id, count]) => {
      if (count > maxCount) {
        mostUsedServiceId = id;
        maxCount = count;
      }
    });
    
    const mostUsedService = services.find(s => s.id === mostUsedServiceId);
    
    // Última visita
    let lastVisit: Date | null = null;
    if (clientAppointments.length > 0) {
      lastVisit = new Date(Math.max(...clientAppointments.map(app => new Date(app.date).getTime())));
    }
    
    return {
      totalAppointments: clientAppointments.length,
      totalSpent,
      mostUsedService: mostUsedService?.name || 'Nenhum',
      lastVisit
    };
  };

  // Função para deletar cliente
  const handleDeleteClient = async (client) => {
    setDeleting(true);
    await deletarCliente(Number(client.id));
    setDeleting(false);
    setClientToDelete(null);
    window.location.reload(); // Força atualização da lista (pode ser melhorado para atualizar o estado local)
  };

  return (
    <div className="space-y-4">
      <Card className="bg-barber-blue border-gray-700">
        <CardHeader>
          <CardTitle className="text-barber-gold">Meus Clientes ({clients.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nome ou telefone..."
              className="bg-barber-dark text-barber-light border-gray-700"
            />
          </div>
          
          <div className="space-y-3">
            {sortedClients.length === 0 ? (
              <p className="text-center py-8 text-barber-light">
                {searchQuery ? "Nenhum cliente encontrado." : "Nenhum cliente cadastrado."}
              </p>
            ) : (
              sortedClients.map(client => {
                const clientInfo = getClientInfo(client.id);
                return (
                  <div 
                    key={client.id} 
                    className="bg-barber-dark p-4 rounded-lg border border-gray-700"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-barber-light flex items-center gap-2">
                          <User className="w-4 h-4 text-barber-gold" />
                          {client.name}
                        </h3>
                        
                        <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-barber-light">
                          <dt className="opacity-70">Visitas:</dt>
                          <dd>{clientInfo.totalAppointments}</dd>
                          
                          <dt className="opacity-70">Total gasto:</dt>
                          <dd>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(clientInfo.totalSpent)}</dd>
                          
                          <dt className="opacity-70">Preferência:</dt>
                          <dd className="truncate">{clientInfo.mostUsedService}</dd>
                          
                          <dt className="opacity-70">Última visita:</dt>
                          <dd>
                            {clientInfo.lastVisit 
                              ? clientInfo.lastVisit.toLocaleDateString('pt-BR')
                              : 'Nenhuma'}
                          </dd>
                        </dl>
                      </div>
                      
                      <div className="flex flex-col gap-2 items-end">
                        <Button
                          size="icon"
                          variant="destructive"
                          onClick={() => setClientToDelete(client)}
                          className="border-red-500 hover:bg-red-500/20"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
      <Dialog open={!!clientToDelete} onOpenChange={() => setClientToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Cliente</DialogTitle>
          </DialogHeader>
          <p>Tem certeza que deseja excluir o cliente <b>{clientToDelete?.name}</b>? Esta ação não pode ser desfeita.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setClientToDelete(null)} disabled={deleting}>Cancelar</Button>
            <Button variant="destructive" onClick={() => handleDeleteClient(clientToDelete)} disabled={deleting}>
              {deleting ? 'Excluindo...' : 'Excluir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Clients;
