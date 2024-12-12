import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "../ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import validatePassword from "../auth/validatePassword";
import {
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "firebase/auth";
import { auth, db, PASSWORD_CONFIG } from "@/firebaseConfig";
import { doc, getDoc, setDoc, updateDoc, Timestamp } from "firebase/firestore";
import { Loader2 } from "lucide-react";

function ChangePasswordDialog({ isOpen, onOpenChange, triggerButton }) {
  const [isLoading, setIsLoading] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isLoadingPassword, setIsLoadingPassword] = useState(false);
  const [passwordValidation, setPasswordValidation] = useState({
    strength: 0,
    checks: {},
    message: "",
    color: "",
  });

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setIsLoadingPassword(true);

    try {
      const user = auth.currentUser;
      if (!user) throw new Error("No hay usuario autenticado");

      if (!passwordForm.currentPassword) {
        throw new Error("Debes ingresar tu contraseña actual");
      }

      // Reautenticar al usuario con manejo específico de errores
      try {
        const credential = EmailAuthProvider.credential(
          user.email,
          passwordForm.currentPassword
        );
        await reauthenticateWithCredential(user, credential);
      } catch (authError) {
        console.error("Error de reautenticación:", authError);
        if (authError.code === "auth/invalid-credential") {
          throw new Error("La contraseña actual es incorrecta");
        }
        throw new Error("Error al verificar la contraseña actual");
      }

      // Validaciones de la nueva contraseña
      if (!passwordForm.newPassword) {
        throw new Error("Debes ingresar una nueva contraseña");
      }

      if (passwordForm.currentPassword === passwordForm.newPassword) {
        throw new Error("La nueva contraseña debe ser diferente a la actual");
      }

      // Resto de las validaciones...
      const validation = validatePassword(passwordForm.newPassword);
      if (validation.strength < 4) {
        throw new Error(
          "La contraseña no cumple con los requisitos mínimos de seguridad"
        );
      }

      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        throw new Error("Las contraseñas no coinciden");
      }

      // Verificar historial de contraseñas
      const historyDoc = await getDoc(doc(db, "passwordHistory", user.uid));
      const passwordHistory = historyDoc.data()?.passwords || [];

      const isPasswordInHistory = passwordHistory.some(
        (p) => p.hash === passwordForm.newPassword
      );
      if (isPasswordInHistory) {
        setIsLoading(false);
        throw new Error("No puedes reutilizar una contraseña anterior");
      }

      // Actualizar la contraseña
      await updatePassword(user, passwordForm.newPassword);

      const now = new Date();

      // Actualizar historial de contraseñas
      let updatedHistory = [
        {
          hash: passwordForm.newPassword,
          createdAt: Timestamp.fromDate(now),
        },
        ...passwordHistory,
      ];

      if (updatedHistory.length > PASSWORD_CONFIG.MIN_HISTORY) {
        updatedHistory = updatedHistory.slice(0, PASSWORD_CONFIG.MIN_HISTORY);
      }

      await setDoc(doc(db, "passwordHistory", user.uid), {
        passwords: updatedHistory,
      });

      // Actualizar información del usuario
      await updateDoc(doc(db, "users", user.uid), {
        passwordLastChanged: Timestamp.fromDate(now),
        passwordExpiresAt: Timestamp.fromDate(
          new Date(
            now.getTime() + PASSWORD_CONFIG.MAX_AGE_DAYS * 24 * 60 * 60 * 1000
          )
        ),
      });

      // Notificar éxito
      toast.success("Contraseña actualizada exitosamente");
      onOpenChange(false);
      setIsLoading(false);
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      setIsLoading(false);
      console.error("Error detallado:", error);
      toast.error(error.message || "Error al cambiar la contraseña");
    } finally {
      setIsLoadingPassword(false);
    }
  };

  const handlePasswordInputChange = (e) => {
    const newPassword = e.target.value;
    setPasswordForm((prev) => ({
      ...prev,
      newPassword: newPassword,
    }));

    // Validar la nueva contraseña
    const validation = validatePassword(newPassword);
    setPasswordValidation(validation);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      {triggerButton && <DialogTrigger asChild>{triggerButton}</DialogTrigger>}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cambiar Contraseña</DialogTitle>
          <DialogDescription>Actualiza tu contraseña</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <Input
            type="password"
            placeholder="Contraseña actual"
            value={passwordForm.currentPassword}
            onChange={(e) =>
              setPasswordForm((prev) => ({
                ...prev,
                currentPassword: e.target.value,
              }))
            }
          />
          <Input
            type="password"
            placeholder="Nueva contraseña"
            value={passwordForm.newPassword}
            onChange={handlePasswordInputChange}
          />
          {passwordForm.newPassword && (
            <div className="mt-2">
              <p className={`text-sm ${passwordValidation.color}`}>
                Fortaleza: {passwordValidation.message}
              </p>
              <div className="text-xs space-y-1 mt-1 text-gray-700">
                {!passwordValidation.checks.length && (
                  <p>• Mínimo 8 caracteres</p>
                )}
                {!passwordValidation.checks.hasUpper && (
                  <p>• Al menos una mayúscula</p>
                )}
                {!passwordValidation.checks.hasLower && (
                  <p>• Al menos una minúscula</p>
                )}
                {!passwordValidation.checks.hasNumber && (
                  <p>• Al menos un número</p>
                )}
                {!passwordValidation.checks.hasSpecial && (
                  <p>• Al menos un carácter especial</p>
                )}
              </div>
            </div>
          )}
          <Input
            type="password"
            placeholder="Confirmar nueva contraseña"
            value={passwordForm.confirmPassword}
            onChange={(e) =>
              setPasswordForm((prev) => ({
                ...prev,
                confirmPassword: e.target.value,
              }))
            }
          />
          <Button type="submit" disabled={isLoadingPassword || isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Cambiando contraseña...
              </>
            ) : (
              "Cambiar contraseña"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default ChangePasswordDialog;
