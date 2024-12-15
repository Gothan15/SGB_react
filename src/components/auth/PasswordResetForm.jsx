import { useState } from "react";
import { auth } from "@/firebaseConfig";
import { sendPasswordResetEmail } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Mail } from "lucide-react";

const PasswordResetForm = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success("Correo de restablecimiento enviado");
      navigate("/register");
    } catch (error) {
      let errorMessage;
      switch (error.code) {
        case "auth/user-not-found":
          errorMessage = "No existe un usuario con este correo";
          break;
        case "auth/invalid-email":
          errorMessage = "El correo electrónico no es válido";
          break;
        default:
          errorMessage = "Ocurrió un error al enviar el correo";
          break;
      }
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-center bg-cover">
      <div className="w-full max-w-md mx-[750px]  p-8 space-y-8 rounded-md bg-[#000000] bg-opacity-50 shadow-black shadow-lg backdrop-blur-sm">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold">Restablecer Contraseña</h1>
          <p className="text-sm text-gray-400">
            Ingresa tu correo electrónico para restablecer tu contraseña
          </p>
        </div>
        <form onSubmit={handlePasswordReset} className="grid gap-3 space-y-4">
          <div className="relative text-2xl focus:outline-none focus:ring-0">
            <Input
              type="email"
              id="email"
              className="w-full py-2.3 px-0 text-2xl text-white bg-transparent border-0 border-b-2 border-gray-300 appearance-none focus:outline-none focus:ring-0 focus:text-white focus:border-yellow-600 peer"
              placeholder=""
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <label
              htmlFor="email"
              className="absolute text-gray-400 duration-300 transform translate-y-[-58px] scale-75 origin-[0] peer-focus:translate-y-[-58px] peer-focus:text-yellow-600 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-[-32px] peer-focus:scale-75 font-sans antialiased font-semibold text-xl"
            >
              Correo
            </label>
            <Mail className="absolute text-white right-[5px] top-[5px] transform text-2xl" />
          </div>
          <Button
            type="submit"
            className="w-full shadow-sm shadow-black hover:border-2 hover:border-white bg-white font-semibold text-black hover:bg-[#5d6770] hover:bg-opacity-50 hover:text-white transition-colors duration-300 flex items-center justify-center gap-2"
            disabled={loading}
          >
            {loading ? "Enviando..." : "Enviar correo de restablecimiento"}
          </Button>
        </form>
        <div className="text-center mt-4">
          <span
            onClick={() => navigate("/register")}
            className="text-yellow-500 hover:underline text-center font-bold cursor-pointer"
          >
            Volver al inicio de sesión
          </span>
        </div>
      </div>
    </div>
  );
};

export default PasswordResetForm;
