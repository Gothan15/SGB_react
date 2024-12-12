import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { auth, db } from "@/firebaseConfig";
import { signOut } from "firebase/auth";
import { deleteDoc, doc } from "firebase/firestore";
import { LogOut } from "lucide-react";
import { useCallback } from "react";
//import { FaPowerOff } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const LogoutDrawer = () => {
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
    <Drawer>
      <DrawerTrigger asChild>
        {/* <Button
          variant="outline"
          className="border-0 absolute  right-[15px]  shadow-md shadow-black font-semibold hover:border-2 text-black hover:border-black hover:bg-white hover:bg-opacity-100 transition-colors duration-300 bg-white bg-opacity-70"
        >
          <FaPowerOff className="mr-2 h-4 w-4" />
          Cerrar Sesión
        </Button> */}
        <Button variant="outline" className="w-full justify-start">
          <LogOut className="mr-2 h-4 w-4" />
          Cerrar Sesión
        </Button>
      </DrawerTrigger>
      <DrawerContent className="border-black bg-opacity-50 p-8 shadow-black shadow-lg backdrop:blur-sm bg-[#000000]">
        <div className="">
          <DrawerHeader className="text-center">
            <DrawerTitle className="text-2xl text-white font-bold">
              Confirmar Cierre de Sesión
            </DrawerTitle>
            <DrawerDescription className="mt-2 text-gray-200">
              ¿Estás seguro que deseas cerrar tu sesión actual?
            </DrawerDescription>
          </DrawerHeader>
          <div className="p-4 pb-0">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <LogOut className="h-6 w-6 text-yellow-500" />
              <span className="text-lg text-white  font-semibold">
                Tu sesión se cerrará
              </span>
            </div>
            <p className="text-center text-sm text-gray-100">
              Tendrás que volver a iniciar sesión para acceder a tu cuenta.
            </p>
          </div>
          <DrawerFooter>
            <Button
              onClick={handleLogout}
              variant="destructive"
              className="hover:bg-gradient-to-l hover:border-black hover:font-semibold from-red-700 transition-colors duration-200 to-black   w-full"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sí, cerrar sesión
            </Button>
            <DrawerClose asChild>
              <Button variant="outline" className="w-full">
                Cancelar
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default LogoutDrawer;
