import PropTypes from "prop-types";
import { Navigate } from "react-router-dom";

const PrivateRoute = ({ userRole, requiredRole, children }) => {
  console.log("Verificando acceso para el rol:", userRole); // Console log agregado
  if (userRole === null) {
    // Aún no conocemos el rol del usuario, esperar
    return <Navigate to="/register" />; // Opcionalmente, mostrar un componente de carga
  } else if (userRole !== requiredRole) {
    console.log(`Acceso denegado. Se requiere rol: ${requiredRole}`); // Console log agregado
    // El usuario no tiene el rol requerido, redirigir según su rol
    return <Navigate to={`/${userRole}`} replace />;
  }
  console.log("Acceso concedido."); // Console log agregado
  // El usuario tiene acceso, renderizar el componente
  return children;
};
PrivateRoute.propTypes = {
  userRole: PropTypes.string,
  requiredRole: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
};
export default PrivateRoute;
