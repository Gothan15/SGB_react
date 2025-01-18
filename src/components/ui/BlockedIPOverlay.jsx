import { functions } from "@/firebaseConfig";
import { httpsCallable } from "firebase/functions";
import { Calendar } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const BlockedIPOverlay = () => {
  const navigate = useNavigate();
  const [remainingSeconds, setRemainingSeconds] = useState(null);

  const formatTime = (totalSeconds) => {
    if (!totalSeconds) return "";
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    const checkIP = async () => {
      try {
        const ipResponse = await fetch("https://api.ipify.org?format=json");
        const { ip } = await ipResponse.json();

        const checkIpAttempts = httpsCallable(functions, "checkIpAttempts");
        const { data } = await checkIpAttempts({ ip });

        if (data.blocked) {
          const seconds = Math.ceil(data.remainingTime / 1000);
          setRemainingSeconds(seconds);
        }
      } catch (error) {
        console.error("Error checking IP:", error);
      }
    };

    checkIP();
  }, []);

  useEffect(() => {
    if (!remainingSeconds) return;

    const timer = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate("/register");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [remainingSeconds, navigate]);

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

          {remainingSeconds > 0 && (
            <p className="text-red-400 font-semibold text-lg">
              Tiempo restante: {formatTime(remainingSeconds)}
            </p>
          )}

          <p className="text-gray-400 text-sm">
            Por favor, intente nuevamente más tarde o contacte al administrador
            si cree que esto es un error.
          </p>
        </div>
      </div>
    </div>
  );
};

export default BlockedIPOverlay;
