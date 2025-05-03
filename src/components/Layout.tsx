import { useState, useEffect, useRef } from 'react';
import { useBarberShop } from '@/contexts/BarberShopContext';
import { useLocation, Link } from 'react-router-dom';
import { 
  Menu, 
  LayoutDashboard, 
  Calendar, 
  Users, 
  Settings, 
  Clock,
  X 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { config } = useBarberShop();
  const { toast } = useToast();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  // Atualizar estado isMobile quando a janela for redimensionada
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 1024) {
        // Não forçar o estado do sidebar em desktop, apenas definir inicialmente
        if (sidebarOpen === undefined) {
          setSidebarOpen(true);
        }
      } else {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Verificar tamanho inicial

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Fechar sidebar ao navegar em dispositivos móveis ou ao clicar em um item de menu
  useEffect(() => {
    // Fechar sempre ao navegar, independente do tamanho da tela
    setSidebarOpen(false);
  }, [location.pathname]);

  // Fechar sidebar ao clicar fora dele (em ambos mobile e desktop)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        sidebarRef.current && 
        !sidebarRef.current.contains(event.target as Node) &&
        menuButtonRef.current && 
        !menuButtonRef.current.contains(event.target as Node) &&
        sidebarOpen
      ) {
        setSidebarOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [sidebarOpen]);

  // Navegação
  const navigationItems = [
    {
      name: 'Dashboard',
      path: '/',
      icon: <LayoutDashboard className="h-5 w-5" />
    },
    {
      name: 'Agendar',
      path: '/schedule',
      icon: <Calendar className="h-5 w-5" />
    },
    {
      name: 'Clientes Agendados',
      path: '/scheduled',
      icon: <Clock className="h-5 w-5" />
    },
    {
      name: 'Meus Clientes',
      path: '/clients',
      icon: <Users className="h-5 w-5" />
    },
    {
      name: 'Configuração',
      path: '/settings',
      icon: <Settings className="h-5 w-5" />
    }
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-barber-dark">
      {/* Overlay escuro quando o menu está aberto em dispositivos móveis */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside 
        ref={sidebarRef}
        className={cn(
          "fixed lg:relative z-30 flex flex-col w-64 h-full transition-transform duration-300 ease-in-out bg-barber-blue border-r border-gray-700",
          sidebarOpen 
            ? "transform translate-x-0" 
            : "transform -translate-x-full lg:translate-x-full"
        )}
      >
        {/* Cabeçalho da Sidebar */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          {sidebarOpen ? (
            <h1 className="text-barber-gold font-bold text-lg truncate">
              {config.name}
            </h1>
          ) : (
            <div className="w-8 h-8 rounded-full bg-barber-gold flex items-center justify-center text-barber-dark font-bold">
              {config.name.charAt(0)}
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(false)}
            className="text-gray-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Links de navegação */}
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-2 px-2">
            {navigationItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={cn(
                    "flex items-center p-2 rounded-lg",
                    location.pathname === item.path
                      ? "bg-barber-gold text-barber-dark font-medium"
                      : "text-barber-light hover:bg-gray-700",
                    !sidebarOpen && "justify-center"
                  )}
                >
                  {item.icon}
                  {sidebarOpen && <span className="ml-3">{item.name}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Rodapé da sidebar */}
        {sidebarOpen && (
          <div className="p-4 border-t border-gray-700">
            <div className="text-xs text-barber-light">
              <p>{config.address}</p>
              <p>{config.city}</p>
              <button 
                className="text-barber-gold mt-2 flex items-center" 
                onClick={() => {
                  navigator.clipboard.writeText(config.whatsapp);
                  toast({
                    title: "WhatsApp copiado!",
                    description: `${config.whatsapp} copiado para a área de transferência.`
                  });
                }}
              >
                <span className="underline">WhatsApp</span>
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* Conteúdo principal */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Cabeçalho do conteúdo */}
        <header className="bg-barber-dark shadow-md z-10">
          <div className="px-4 py-3 flex justify-between items-center">
            <Button
              ref={menuButtonRef}
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-barber-light"
            >
              <Menu className="h-6 w-6" />
            </Button>
            <h1 className="text-barber-gold text-lg font-semibold">
              {navigationItems.find(item => item.path === location.pathname)?.name || "Estilo Barbearia"}
            </h1>
            <div className="w-6"></div>
          </div>
        </header>

        {/* Área de conteúdo principal com rolagem */}
        <main className="flex-1 overflow-y-auto bg-barber-dark p-4">
          {children}
        </main>
      </div>
    </div>
  );
}
