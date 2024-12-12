import { getAuth } from "firebase/auth";

const VerificarAdmin = () => {
  const auth = getAuth();
  auth.currentUser
    .getIdTokenResult()
    .then((idTokenResult) => {
      // Acceder a los claims personalizados
      if (idTokenResult.claims.admin) {
        console.log("El usuario tiene el rol de administrador.");
      } else {
        console.log("El usuario NO tiene el rol de administrador.");
      }
    })
    .catch((error) => {
      console.error("Error al obtener los claims personalizados:", error);
    });
  return null;
};

export default VerificarAdmin;
