import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { auth, db } from "@/firebaseConfig";
import { signOut } from "firebase/auth";
import { deleteDoc, doc } from "firebase/firestore";

import { useCallback } from "react";

import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { LogOut } from "lucide-react";

const LogOutDialog = () => {
  const navigate = useNavigate();
  const handleLogout = useCallback(async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      // Eliminar el browserSessionId del localStorage
      localStorage.removeItem("browserSessionId");

      // Primero eliminar el registro de sesión activa
      const sessionRef = doc(db, "activeSessions", user.uid);
      await deleteDoc(sessionRef);

      // Luego cerrar la sesión
      await signOut(auth);
      toast.success("Sesión cerrada exitosamente");
      navigate("/register", { replace: true });
    } catch (error) {
      toast.error("Error al cerrar sesión");
      console.error("Error al cerrar sesión:", error);
    }
  }, [navigate]);
  return (
    <AlertDialog>
      <AlertDialogTrigger className=" w-auto">
        <Button className="w-full   justify-start">
          <LogOut className="mr-2 h-4 w-4" />
          Cerrar Sesión
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            ¿Estás seguro que deseas cerrar tu sesión actual?
          </AlertDialogTitle>
          <AlertDialogDescription>
            Tu sesión se cerrará, tendrás que volver a iniciar sesión para
            acceder a tu cuenta.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleLogout}
            className="hover:bg-gradient-to-l hover:border-black hover:font-semibold from-red-700 transition-colors duration-200 to-black   w-full"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sí, cerrar sesión
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default LogOutDialog;
