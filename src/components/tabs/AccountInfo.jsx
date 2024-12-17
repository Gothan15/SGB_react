import { useEffect, useState } from "react";
import LoadinSpinner from "../ui/LoadinSpinner";
import { auth, db } from "@/firebaseConfig";
import { doc, onSnapshot } from "firebase/firestore";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
//   DialogDescription,
// } from "@/components/ui/dialog";
// import { Button } from "@/components/ui/button";
// import ProfileEditForm from "../dialogs/profile-edit-form";
//import { toast } from "sonner";
// import ChangePasswordDialog from "../dialogs/ChangePasswordDialog";
// import SendEmailVerificationDialog from "../dialogs/SendEmailVerificationDialog";

const formatPhoneNumber = (phone, region = "ES") => {
  if (!phone) return "No especificado";

  // Asegurarse que el número sea string y limpiar caracteres no numéricos
  const cleaned = String(phone).replace(/\D/g, "");

  const formats = {
    CU: (num) => {
      if (num.length === 8) {
        return `+53 ${num.slice(0, 4)}-${num.slice(4)}`;
      }
      return `+53 ${num}`;
    },
  };

  try {
    const formatter = formats[region] || formats.CU;
    const formattedNumber = formatter(cleaned);

    return formattedNumber;
  } catch (error) {
    console.error("Error al formatear número:", error);
    return phone; // Devolver el número original si hay error
  }
};

function AccountInfo() {
  const [userInfo, setUserInfo] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  // const [showEditProfile, setShowEditProfile] = useState(false);
  // const [showChangePassword, setShowChangePassword] = useState(false);
  // const [showSendVerification, setShowSendVerification] = useState(false);

  useEffect(() => {
    const fetchUserInfo = async () => {
      if (!auth.currentUser) {
        setLoading(false);
        return;
      }

      try {
        // Suscribirse a cambios en el perfil del usuario
        const unsubscribe = onSnapshot(
          doc(db, "users", auth.currentUser.uid),
          (doc) => {
            setUserProfile(doc.data());
            setUserInfo({
              ...auth.currentUser,
              ...doc.data(),
            });
            setLoading(false);
          }
        );

        return () => unsubscribe();
      } catch (error) {
        console.error("Error al obtener la información del usuario:", error);
        setLoading(false);
      }
    };

    fetchUserInfo();
  }, []);

  // const saveNotification = async (title, message, type) => {
  //   try {
  //     const notificationsRef = collection(
  //       db,
  //       "users",
  //       auth.currentUser.uid,
  //       "notifications"
  //     );
  //     await addDoc(notificationsRef, {
  //       title,
  //       message,
  //       type,
  //       read: false,
  //       createdAt: serverTimestamp(),
  //     });
  //   } catch (error) {
  //     console.error("Error al guardar la notificación:", error);
  //   }
  // };

  // const handleSuccess = async (message) => {
  //   console.log(message);
  //   toast.success(message);

  //   // Guardar la notificación cuando se actualiza el perfil
  //   await saveNotification(
  //     "Perfil Actualizado",
  //     "Tu información de perfil ha sido actualizada correctamente",
  //     "success"
  //   );

  //   // Ya no es necesario manejar la actualización del historial aquí
  // };

  if (loading || !userInfo) {
    return (
      <Card className="border-transparent bg-transparent relative justify-center items-center flex min-h-auto">
        <CardContent>
          <LoadinSpinner />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-white to-gray-200 bg-opacity-100 shadow-black shadow-lg backdrop-blur-sm bg-white w-full max-w-full md:p-6 p-4">
      <CardHeader>
        <CardTitle className="text-lg sm:text-xl">
          Información de la Cuenta
        </CardTitle>
        <CardDescription className="text-sm sm:text-base">
          Tus detalles de usuario.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6">
            <Avatar className="w-16 h-16 md:w-24 md:h-24">
              <AvatarImage
                src={userProfile?.photoURL || userInfo?.photoURL}
                alt="Avatar"
              />
              <AvatarFallback>
                {userProfile?.name?.charAt(0) ||
                  userInfo?.displayName?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-2 text-center md:text-left">
              <p className="text-sm sm:text-base">
                <strong>Nombre:</strong>{" "}
                {userProfile?.name ||
                  userInfo?.displayName ||
                  "No especificado"}
              </p>
              <p className="text-sm sm:text-base">
                <strong>Email:</strong> {userInfo?.email}
              </p>
              <p className="text-sm sm:text-base">
                <strong>Teléfono:</strong>{" "}
                {formatPhoneNumber(userProfile?.phone)}
              </p>
              <p className="text-sm sm:text-base">
                <strong>Miembro desde:</strong>{" "}
                {userInfo?.metadata?.creationTime
                  ? new Date(
                      userInfo.metadata.creationTime
                    ).toLocaleDateString()
                  : "No disponible"}
              </p>
            </div>
          </div>
          <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2">
            {/* Eliminar los botones y diálogos aquí */}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default AccountInfo;
