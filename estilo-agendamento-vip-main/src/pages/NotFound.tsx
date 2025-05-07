
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: Usuário tentou acessar uma página inexistente:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="flex flex-col items-center justify-center h-full py-20">
      <h1 className="text-4xl font-bold text-barber-gold mb-4">404</h1>
      <p className="text-xl text-barber-light mb-6">Página não encontrada</p>
      <Button asChild>
        <Link to="/" className="bg-barber-gold hover:bg-amber-600 text-barber-dark">
          Voltar ao Dashboard
        </Link>
      </Button>
    </div>
  );
};

export default NotFound;
