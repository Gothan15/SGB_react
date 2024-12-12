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
      const createUser = httpsCallable(functions, "createUser");
      const result = await createUser(data);

      if (result.data.success) {
        toast.success("Usuario agregado exitosamente");
        onSuccess({
          id: result.data.user.id,
          name: result.data.user.name,
          email: result.data.user.email,
          role: result.data.user.role,
        });

        // Llamar a la función createCustomRoles para generar un log
        const createCustomRoles = httpsCallable(functions, "createCustomRoles");
        await createCustomRoles({ uid: result.data.user.id });
        console.log("Función createCustomRoles llamada exitosamente");
      } else {
        throw new Error(result.data.message || "Error al crear usuario");
      }
    } catch (error) {
      console.error("Error al crear usuario:", error);
      toast.error(error.message || "Error al crear usuario");
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
