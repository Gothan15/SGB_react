import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { Navigate, useNavigate } from "react-router-dom";
import { LoadingScreen } from "./ui/LoadingScreen";
import { auth } from "@/firebaseConfig";

const PrivateRoute = ({ userRole, requiredRole, children }) => {
  const [isVerifying, setIsVerifying] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    console.log("🔄 Iniciando verificación de ruta privada...");
    console.log(`👤 Rol de usuario actual: ${userRole}`);
    console.log(`🎯 Rol requerido: ${requiredRole}`);

    const timer = setTimeout(() => {
      console.log("⏱️ Temporizador de verificación completado");
      setIsVerifying(false);

      if (!auth.currentUser) {
        console.log("❌ Usuario no autenticado, redirigiendo a registro");
        navigate("/register", { replace: true });
      } else {
        console.log("✅ Usuario autenticado:", auth.currentUser.email);
      }
    }, 100);

    return () => {
      console.log("🧹 Limpiando temporizador");
      clearTimeout(timer);
    };
  }, [userRole, navigate, requiredRole]);

  if (isVerifying) {
    console.log("⌛ Mostrando pantalla de carga...");
    return <LoadingScreen />;
  }

  if (!auth.currentUser) {
    console.log("🚫 Acceso denegado - Redirigiendo a registro");
    return <Navigate to="/register" replace />;
  }

  if (userRole !== requiredRole) {
    return <Navigate to={`/${userRole}`} replace />;
  }

  return children;
};

PrivateRoute.propTypes = {
  userRole: PropTypes.string,
  requiredRole: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
};

export default PrivateRoute;
