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
  X,
  Sun,
  Moon
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
  const [theme, setTheme] = useState('dark');

  // Atualizar estado isMobile quando a janela for redimensionada
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
          setSidebarOpen(true);
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

  // Fechar sidebar ao navegar em dispositivos móveis
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [location.pathname, isMobile]);

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

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

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

  const currentPage = navigationItems.find(item => item.path === location.pathname)?.name || "Estilo Barbearia";

  return (
    <div className="h-screen w-screen bg-barber-dark">
      {/* Header fixo no topo, sempre 100% da largura */}
      <header className={cn(
        "fixed top-0 left-0 w-full h-16 bg-barber-dark shadow-md z-40 flex items-center transition-all duration-300 ease-in-out",
        !isMobile && sidebarOpen ? "lg:ml-64" : ""
      )} style={{ minWidth: 0 }}>
        <div className="px-4 w-full flex justify-between items-center h-16">
          <div className="flex items-center gap-3 h-16">
            {/* Botão de menu só no mobile */}
            {isMobile && (
              <Button
                ref={menuButtonRef}
                variant="ghost"
                size="icon"
                onClick={toggleSidebar}
                className="text-barber-light flex items-center justify-center h-10 w-10 bg-barber-blue/80 rounded-lg hover:bg-barber-gold/80 transition-colors"
                style={{ marginTop: 0, marginBottom: 0 }}
              >
                <Menu className="h-6 w-6" />
              </Button>
            )}
            <h1 className="text-xl font-semibold text-barber-gold flex items-center gap-2 whitespace-nowrap overflow-hidden">
              <span className="truncate">{currentPage}</span>
              <span className="text-barber-light text-sm font-normal flex-shrink-0">/ {config.name}</span>
            </h1>
          </div>
        </div>
      </header>
      
      {/* Sidebar */}
      <aside
        ref={sidebarRef}
        className={cn(
          "fixed top-0 left-0 z-50 flex flex-col w-64 h-full transition-transform duration-300 ease-in-out bg-barber-blue border-r border-gray-700",
          sidebarOpen 
            ? "translate-x-0"
            : "-translate-x-full lg:translate-x-0"
        )}
        style={{ marginTop: 0 }}
      >
        {/* Cabeçalho da Sidebar */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h1 className="text-barber-gold font-bold text-lg truncate">
            {config.name}
          </h1>
          {isMobile && (
            <button
              onClick={toggleSidebar}
              className="text-gray-400 hover:text-white"
            >
              <X size={20} />
            </button>
          )}
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
                      : "text-barber-light hover:bg-gray-700"
                  )}
                >
                  {item.icon}
                  <span className="ml-3">{item.name}</span>
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

      {/* Overlay escuro quando o menu está aberto em dispositivos móveis */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={toggleSidebar}
        />
      )}

      {/* Conteúdo principal */}
      <div
        className={cn(
          "transition-all duration-300 ease-in-out",
          "pt-16",
          sidebarOpen && !isMobile ? "lg:ml-64" : ""
        )}
        style={{ minHeight: '100vh' }}
      >
        <main className="flex-1 overflow-y-auto bg-barber-dark p-4">
          {children}
        </main>
      </div>
    </div>
  );
}
