import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { auth, db, PASSWORD_CONFIG } from "@/firebaseConfig";
import { doc, getDoc, updateDoc, Timestamp, setDoc } from "firebase/firestore";
import { updatePassword } from "firebase/auth";
import validatePassword from "../auth/validatePassword";
import { toast } from "sonner";
import PropTypes from "prop-types";

const ForcePasswordChangeDialog = ({ isOpen, onClose }) => {
  {
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [passwordValidation, setPasswordValidation] = useState({
      strength: 0,
      checks: {},
      message: "",
      color: "",
    });

    const handleNewPasswordChange = (e) => {
      const newPasswordValue = e.target.value;
      setNewPassword(newPasswordValue);

      // Validar la nueva contraseña
      const validation = validatePassword(newPasswordValue);
      setPasswordValidation(validation);
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      setIsLoading(true);

      try {
        const user = auth.currentUser;
        if (!user) throw new Error("No hay usuario autenticado");

        // Verificar que la contraseña cumpla con los requisitos
        const validation = validatePassword(newPassword);
        if (validation.strength < 4) {
          throw new Error("La contraseña no cumple con los requisitos mínimos");
        }

        // Verificar historial de contraseñas
        const historyDoc = await getDoc(doc(db, "passwordHistory", user.uid));
        const passwordHistory = historyDoc.data()?.passwords || [];

        // Verificar que la nueva contraseña no esté en las últimas 24
        const isPasswordInHistory = passwordHistory.some(
          (p) => p.hash === newPassword
        );
        if (isPasswordInHistory) {
          throw new Error("No puedes reutilizar una contraseña anterior");
        }

        // Actualizar contraseña
        await updatePassword(user, newPassword);

        // Actualizar información del usuario
        const now = new Date();
        await updateDoc(doc(db, "users", user.uid), {
          passwordLastChanged: Timestamp.fromDate(now),
          requiresPasswordChange: false,
          passwordExpiresAt: Timestamp.fromDate(
            new Date(
              now.getTime() + PASSWORD_CONFIG.MAX_AGE_DAYS * 24 * 60 * 60 * 1000
            )
          ),
        });

        // Actualizar historial de contraseñas
        let updatedHistory = [
          {
            hash: newPassword,
            createdAt: Timestamp.fromDate(now),
          },
          ...passwordHistory,
        ];

        // Mantener solo las últimas 24 contraseñas
        if (updatedHistory.length > PASSWORD_CONFIG.MIN_HISTORY) {
          updatedHistory = updatedHistory.slice(0, PASSWORD_CONFIG.MIN_HISTORY);
        }

        await setDoc(doc(db, "passwordHistory", user.uid), {
          passwords: updatedHistory,
        });

        toast.success("Contraseña actualizada exitosamente");
        onClose();
      } catch (error) {
        toast.error(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cambio de contraseña requerido</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="password"
              placeholder="Nueva contraseña"
              value={newPassword}
              onChange={handleNewPasswordChange}
            />
            {newPassword && (
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
              placeholder="Confirmar contraseña"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <Button type="submit" disabled={isLoading}>
              Cambiar contraseña
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    );
  }
};

ForcePasswordChangeDialog.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default ForcePasswordChangeDialog;
