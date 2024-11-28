import { useState } from "react";

export function useToast() {
  const [toast, setToast] = useState(null);

  const showToast = ({ title, description }) => {
    setToast({ title, description });
    // Aquí puedes agregar la lógica para mostrar el toast en tu UI
  };

  return { toast, showToast };
}
