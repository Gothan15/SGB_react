import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { Navigate, useNavigate } from "react-router-dom";
import { LoadingScreen } from "./ui/LoadingScreen";
import { auth } from "@/firebaseConfig";

const PrivateRoute = ({ userRole, requiredRole, children }) => {
  const [isVerifying, setIsVerifying] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVerifying(false);

      if (!auth.currentUser) {
        navigate("/register", { replace: true });
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [userRole, navigate]);

  if (isVerifying) {
    return <LoadingScreen />;
  }

  if (!auth.currentUser) {
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
