import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ExclamationTriangleIcon } from "@radix-ui/react-icons";
import { AlertCircle } from "lucide-react";
import PropTypes from "prop-types";

const ReauthDialog = ({ isOpen, onReauthenticate }) => {
  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent className="border-transparent bg-gray-900 bg-opacity-90 backdrop-blur">
        <AlertDialogHeader>
          <div className="text-white flex items-center gap-2">
            <ExclamationTriangleIcon className="h-6 w-6 text-red-500" />
            <AlertDialogTitle>Sesión Expirada</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="pt-4">
            <div className=" flex items-center gap-2 text-red-500">
              <AlertCircle className="h-4 w-4 " />
              <span className="font-sans">
                Tu sesión ha expirado por motivos de seguridad.
              </span>
            </div>
            <p className="mt-2 text-gray-200">
              Por favor, inicia sesión nuevamente para continuar usando la
              aplicación.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="sm:justify-center">
          <AlertDialogAction
            onClick={onReauthenticate}
            className="hover:bg-gradient-to-l hover:border-black hover:font-semibold from-red-700 transition-colors duration-200 to-black   w-full"
          >
            Iniciar Sesión
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

ReauthDialog.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onReauthenticate: PropTypes.func.isRequired,
};

export default ReauthDialog;
