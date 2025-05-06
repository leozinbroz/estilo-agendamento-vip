import { useEffect, useRef } from 'react';

export const useScrollIntoView = () => {
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    const handleFocus = () => {
      if (inputRef.current) {
        // Adiciona um pequeno delay para garantir que o teclado esteja visível
        setTimeout(() => {
          inputRef.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
        }, 100);
      }
    };

    const currentInput = inputRef.current;
    if (currentInput) {
      currentInput.addEventListener('focus', handleFocus);
    }

    return () => {
      if (currentInput) {
        currentInput.removeEventListener('focus', handleFocus);
      }
    };
  }, []);

  return inputRef;
}; 