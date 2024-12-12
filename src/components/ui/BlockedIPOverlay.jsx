import { useState, useEffect } from "react";
import { Calendar } from "lucide-react";
import PropTypes from "prop-types";

const BlockedIPOverlay = ({ remainingTime, onExpiration }) => {
  const [timeLeft, setTimeLeft] = useState(
    Math.max(remainingTime - new Date().getTime(), 0)
  );

  const formatTime = (milliseconds) => {
    const totalSeconds = Math.ceil(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours} horas ${minutes} minutos ${seconds} segundos`;
  };

  // Calcular el porcentaje para el círculo de progreso

  useEffect(() => {
    if (timeLeft <= 0) {
      onExpiration(); // Llamar a la función de limpieza
      window.location.reload();
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        const newTime = Math.max(prev - 1000, 0);
        if (newTime <= 0) {
          clearInterval(interval);
          onExpiration(); // Llamar a la función de limpieza
          window.location.reload();
        }
        return newTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft, onExpiration]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-gray-900 p-8 rounded-lg max-w-md text-center space-y-6 border border-red-500">
        <div className="flex justify-center mb-4">
          <Calendar className="h-16 w-16 text-red-500 animate-pulse" />
        </div>

        <h2 className="text-2xl font-bold text-red-500">IP Bloqueada</h2>

        <div className="space-y-4">
          <p className="text-white text-lg">
            Por motivos de seguridad, su IP ha sido bloqueada temporalmente
            debido a múltiples intentos fallidos de inicio de sesión.
          </p>

          <div className="text-yellow-500 font-mono text-xl">
            Tiempo restante: {formatTime(timeLeft)}
          </div>

          <p className="text-gray-400 text-sm">
            Por favor, intente nuevamente más tarde o contacte al administrador
            si cree que esto es un error.
          </p>
        </div>
      </div>
    </div>
  );
};

BlockedIPOverlay.propTypes = {
  remainingTime: PropTypes.number.isRequired,
  onExpiration: PropTypes.func.isRequired,
};

export default BlockedIPOverlay;
