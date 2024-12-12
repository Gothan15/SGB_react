import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { auth, db } from "@/firebaseConfig";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { sendEmailVerification, onAuthStateChanged } from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
  updateDoc,
  collection,
  addDoc,
} from "firebase/firestore";

function SendEmailVerificationDialog({ isOpen, onOpenChange, triggerButton }) {
  const [isSending, setIsSending] = useState(false);
  const [lastSentTime, setLastSentTime] = useState(null);
  const COOLDOWN_TIME = 60 * 1000; // 60 segundos de espera entre envíos

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const verificationDoc = await getDoc(
          doc(db, "emailVerification", user.uid)
        );
        if (verificationDoc.exists()) {
          setLastSentTime(verificationDoc.data().lastSentAt?.toDate());
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const saveVerificationAttempt = async (userId) => {
    try {
      // Actualizar el documento principal de verificación
      await setDoc(
        doc(db, "emailVerification", userId),
        {
          lastSentAt: serverTimestamp(),
          email: auth.currentUser.email,
        },
        { merge: true }
      );

      // Registrar el intento en el historial
      await addDoc(collection(db, "emailVerification", userId, "attempts"), {
        timestamp: serverTimestamp(),
        success: true,
      });

      // Crear notificación
      await addDoc(collection(db, "users", userId, "notifications"), {
        title: "Verificación de Email",
        message:
          "Se ha enviado un correo de verificación a tu dirección de email",
        type: "info",
        read: false,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error al guardar el intento de verificación:", error);
    }
  };

  const sendVerificationEmail = async () => {
    setIsSending(true);

    try {
      const user = auth.currentUser;
      if (!user) throw new Error("No hay usuario autenticado");

      // Verificar el tiempo de espera
      if (lastSentTime) {
        const timeSinceLastSent = Date.now() - lastSentTime.getTime();
        if (timeSinceLastSent < COOLDOWN_TIME) {
          const remainingTime = Math.ceil(
            (COOLDOWN_TIME - timeSinceLastSent) / 1000
          );
          throw new Error(
            `Por favor espera ${remainingTime} segundos antes de intentar nuevamente`
          );
        }
      }

      // Configuración personalizada para el email de verificación
      const actionCodeSettings = {
        url: `${window.location.origin}/student/account`, // URL a la que se redirigirá después de verificar
        handleCodeInApp: true,
      };

      await sendEmailVerification(user, actionCodeSettings);
      await saveVerificationAttempt(user.uid);

      // Actualizar el estado del usuario en Firestore
      await updateDoc(doc(db, "users", user.uid), {
        emailVerificationSent: true,
        lastVerificationEmailSent: serverTimestamp(),
      });

      setLastSentTime(new Date());
      toast.success(
        "Correo de verificación enviado. Por favor revisa tu bandeja de entrada."
      );
      onOpenChange(false);
    } catch (error) {
      console.error("Error al enviar el correo de verificación:", error);
      toast.error(error.message || "Error al enviar el correo de verificación");
    } finally {
      setIsSending(false);
    }
  };

  const canSendEmail =
    !lastSentTime || Date.now() - lastSentTime.getTime() >= COOLDOWN_TIME;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      {triggerButton && <DialogTrigger asChild>{triggerButton}</DialogTrigger>}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enviar Correo de Verificación</DialogTitle>
          <DialogDescription>
            Recibirás un correo con un enlace para verificar tu dirección de
            email.
            {!canSendEmail && lastSentTime && (
              <p className="text-yellow-600 mt-2">
                Podrás enviar otro correo en{" "}
                {Math.ceil(
                  (COOLDOWN_TIME - (Date.now() - lastSentTime.getTime())) / 1000
                )}{" "}
                segundos
              </p>
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Button
            onClick={sendVerificationEmail}
            disabled={isSending || !canSendEmail}
          >
            {isSending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              "Enviar Correo de Verificación"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default SendEmailVerificationDialog;
