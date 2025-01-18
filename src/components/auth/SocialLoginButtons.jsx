import { auth, db } from "@/firebaseConfig";
import {
  GithubAuthProvider,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { doc, getDoc, setDoc, Timestamp, updateDoc } from "firebase/firestore";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { Github } from "lucide-react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import { defaultRoutes } from "@/routes/index";

const SocialLoginButtons = ({ setUiState }) => {
  const navigate = useNavigate();

  const handleSocialSignIn = async (provider, providerName) => {
    try {
      setUiState((prev) => ({ ...prev, loading: true }));

      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const userDoc = await getDoc(doc(db, "users", user.uid));
      let userData;

      if (!userDoc.exists()) {
        // Crear nuevo usuario en Firestore con rol "student"
        userData = {
          email: user.email,
          name: user.displayName || `Usuario de ${providerName}`,
          role: "student", // Rol por defecto
          memberSince: Timestamp.fromDate(new Date()),
          photoURL: user.photoURL || null,
          provider: providerName.toLowerCase(),
          ...(providerName === "GitHub" && {
            githubUsername: result.additionalUserInfo?.username || null,
          }),
          // Agregar campos relacionados con la contraseña
          passwordLastChanged: null,
          requiresPasswordChange: false,
          passwordExpiresAt: null,
        };

        await setDoc(doc(db, "users", user.uid), userData);
        navigate(defaultRoutes.student, { replace: true });
      } else {
        // Usuario existente
        userData = userDoc.data();
        await updateDoc(doc(db, "users", user.uid), {
          lastLogin: Timestamp.fromDate(new Date()),
        });

        // Usar el rol existente para la redirección
        navigate(defaultRoutes[userData.role] || "/null", { replace: true });
      }
    } catch (error) {
      console.error("Detalles del error:", error);
      handleAuthError(error, setUiState);
    } finally {
      setUiState((prev) => ({ ...prev, loading: false }));
    }
  };

  const handleGoogleSignIn = () =>
    handleSocialSignIn(new GoogleAuthProvider(), "Google");

  const handleGithubSignIn = () => {
    const provider = new GithubAuthProvider();
    provider.addScope("user");
    return handleSocialSignIn(provider, "GitHub");
  };

  // Función auxiliar para manejar errores de autenticación
  const handleAuthError = (error, setUiState) => {
    console.error("Error de autenticación:", error);
    let errorMessage = "Error al iniciar sesión";

    if (error.code === "auth/popup-closed-by-user") {
      setUiState((prev) => ({
        ...prev,
        error: "",
        loading: false,
      }));
      toast.error("Autenticación cancelada");
      return;
    } else if (error.code === "auth/account-exists-with-different-credential") {
      errorMessage =
        "Ya existe una cuenta con este email usando otro método de inicio de sesión";
    } else if (error.code === "auth/popup-blocked") {
      errorMessage = "Ventana bloqueada por el navegador";
    } else {
      toast.error(`Error desconocido: ${error.message}`);
    }

    toast.error(errorMessage);
    setUiState((prev) => ({
      ...prev,
      error: errorMessage,
      loading: false,
    }));
  };

  return (
    <>
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-zinc-800"></div>
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-black rounded-md px-2 text-zinc-400">
            o usar otro método
          </span>
        </div>
      </div>
      <div className="space-y-2 md:space-y-4">
        <Button
          onClick={handleGoogleSignIn}
          type="button"
          variant="outline"
          className="w-full shadow-sm shadow-black bg-black font-semibold text-white hover:bg-white hover:bg-opacity-50 hover:text-black transition-colors duration-300"
        >
          <img
            src="https://www.google.com/favicon.ico"
            className="mr-2 h-4 w-4"
            alt="Google"
          />
          Continuar con Google
        </Button>

        <Button
          onClick={handleGithubSignIn}
          type="button"
          variant="outline"
          className="w-full shadow-sm shadow-black bg-black font-semibold text-white hover:bg-white hover:bg-opacity-50 hover:text-black transition-colors duration-300"
        >
          <Github className="mr-2 h-4 w-4" />
          Continuar con GitHub
        </Button>
      </div>
    </>
  );
};

SocialLoginButtons.propTypes = {
  setUiState: PropTypes.func.isRequired,
};

export default SocialLoginButtons;
