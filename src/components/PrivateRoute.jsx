import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import { LoadingScreen } from "./ui/LoadingScreen";
import { auth, db } from "@/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";

const PrivateRoute = ({ userRole, requiredRole, children }) => {
  const [isVerifying, setIsVerifying] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    console.log("🔄 Iniciando verificación de ruta privada...");
    console.log(`👤 Rol de usuario actual: ${userRole}`);
    console.log(`🎯 Rol requerido: ${requiredRole}`);

    const verifyUserRole = async () => {
      if (!auth.currentUser) {
        console.log("❌ Usuario no autenticado, redirigiendo a registro");
        navigate("/register", { replace: true });
        return;
      }

      const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
      if (userDoc.exists()) {
        const role = userDoc.data().role;
        if (role !== requiredRole) {
          console.log("🚫 Acceso denegado - Redirigiendo según rol");
          navigate(`/${role}`, { replace: true });
        } else {
          setIsVerifying(false);
        }
      } else {
        console.log(
          "❌ Usuario no encontrado en Firestore, redirigiendo a registro"
        );
        navigate("/register", { replace: true });
      }
    };

    verifyUserRole();
  }, [userRole, navigate, requiredRole]);

  if (isVerifying) {
    console.log("⌛ Mostrando pantalla de carga...");
    return <LoadingScreen />;
  }

  return children;
};

PrivateRoute.propTypes = {
  userRole: PropTypes.string,
  requiredRole: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
};

export default PrivateRoute;
