import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import AddUserForm from "./add-user-form";
import { toast } from "sonner";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/firebaseConfig";
import PropTypes from "prop-types";

const AddUserDialog = ({ onSuccess }) => {
  const handleAddUser = async (data) => {
    try {
      console.log("Datos recibidos en handleAddUser:", data); // Para debugging

      if (!data.name || !data.email || !data.password || !data.role) {
        const missingFields = [];
        if (!data.name) missingFields.push("nombre");
        if (!data.email) missingFields.push("email");
        if (!data.password) missingFields.push("contraseña");
        if (!data.role) missingFields.push("rol");

        throw new Error(
          `Campos requeridos faltantes: ${missingFields.join(", ")}`
        );
      }

      const cleanedData = {
        name: data.name.trim(),
        email: data.email.trim(),
        password: data.password,
        role: data.role,
      };

      const createUser = httpsCallable(functions, "createUser");
      const result = await createUser(cleanedData);

      if (result.data.success) {
        toast.success("Usuario agregado exitosamente");
        onSuccess({
          id: result.data.user.id,
          name: result.data.user.name,
          email: result.data.user.email,
          role: result.data.user.role,
        });
      } else {
        //throw new Error(result.data.message || "Error al crear usuario");
      }
    } catch (error) {
      console.error("Error detallado:", error);
      //toast.error(error.message || "Error al crear usuario");
    }
  };

  return (
    <Dialog>
      <DialogTrigger className="absolute right-[65px]" asChild>
        <Button size="sm">
          <UserPlus className="h-4 w-4" />
          Agregar Nuevo Usuario
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Agregar Nuevo Usuario</DialogTitle>
          <DialogDescription>
            Añade un nuevo usuario al sistema.
          </DialogDescription>
        </DialogHeader>
        <AddUserForm onSave={handleAddUser} />
      </DialogContent>
    </Dialog>
  );
};
AddUserDialog.propTypes = {
  onSuccess: PropTypes.func.isRequired,
};

export default AddUserDialog;
