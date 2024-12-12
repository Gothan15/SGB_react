import { useEffect } from "react";
import { auth, db, PASSWORD_NOTIFICATION } from "@/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { toast } from "sonner";

const PasswordExpirationCheck = () => {
  useEffect(() => {
    const checkPasswordExpiration = async () => {
      if (!auth.currentUser) return;

      const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
      if (!userDoc.exists()) return;

      const userData = userDoc.data();
      const passwordExpiresAt = userData.passwordExpiresAt?.toDate();

      if (!passwordExpiresAt) return;

      const now = new Date();
      const daysUntilExpiration = Math.ceil(
        (passwordExpiresAt - now) / (1000 * 60 * 60 * 24)
      );

      if (
        daysUntilExpiration <= PASSWORD_NOTIFICATION.WARN_DAYS_BEFORE &&
        daysUntilExpiration > 0
      ) {
        toast.warning(
          `Tu contraseña expirará en ${daysUntilExpiration} días. Por favor, cámbiala pronto.`,
          {
            duration: 10000,
            action: {
              label: "Cambiar ahora",
              onClick: () =>
                document.getElementById("changePasswordButton")?.click(),
            },
          }
        );
      }
    };

    checkPasswordExpiration();
    const interval = setInterval(
      checkPasswordExpiration,
      PASSWORD_NOTIFICATION.CHECK_INTERVAL
    );

    return () => clearInterval(interval);
  }, []);

  return null;
};

export default PasswordExpirationCheck;
