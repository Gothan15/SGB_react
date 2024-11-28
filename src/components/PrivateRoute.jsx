import PropTypes from "prop-types";
import { Navigate } from "react-router-dom";

const PrivateRoute = ({ userRole, requiredRole, children }) => {
  if (userRole === null) {
    // Aún no conocemos el rol del usuario, esperar
    return null; // Opcionalmente, mostrar un componente de carga
  } else if (userRole !== requiredRole) {
    // El usuario no tiene el rol requerido, redirigir según su rol
    return <Navigate to={`/${userRole}`} replace />;
  }

  // El usuario tiene acceso, renderizar el componente
  return children;
};
PrivateRoute.propTypes = {
  userRole: PropTypes.string,
  requiredRole: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
};
export default PrivateRoute;
