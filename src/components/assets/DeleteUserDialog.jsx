import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import PropTypes from "prop-types";
import { useState } from "react";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/firebaseConfig";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const DeleteUserDialog = ({ isOpen, onClose, onConfirm, userData }) => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const confirmUserFn = httpsCallable(functions, "confirmUser");
      const { data: result } = await confirmUserFn({ email });

      if (result?.confirmed) {
        await onConfirm();
        toast.success("Usuario eliminado exitosamente");
        onClose();
      } else {
        toast.error(result?.error || "Email inválido");
      }
    } catch (error) {
      toast.error("Error al verificar email");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              Esta acción no se puede deshacer. Se eliminará permanentemente el
              usuario {userData?.name} ({userData?.email}) del sistema.
            </p>
            <p className="font-medium text-yellow-600">
              Por favor, confirma tu email para continuar.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="email"
            placeholder="Confirma tu email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full"
          />

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
            <Button
              type="submit"
              disabled={isLoading}
              className="hover:bg-gradient-to-l hover:border-black hover:font-semibold from-red-700 transition-colors duration-200 to-black"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verificando...
                </>
              ) : (
                "Eliminar Usuario"
              )}
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
};

DeleteUserDialog.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  userData: PropTypes.shape({
    name: PropTypes.string,
    email: PropTypes.string,
  }),
};

export default DeleteUserDialog;
