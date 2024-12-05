import { useEffect, useState } from "react";
import LoadinSpinner from "../LoadinSpinner";
import { auth, db } from "@/firebaseConfig";
import {
  doc,
  onSnapshot,
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import ProfileEditForm from "../dialogs/profile-edit-form";
import { toast } from "sonner";

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
  const [showEditProfile, setShowEditProfile] = useState(false);

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

  const saveNotification = async (title, message, type) => {
    try {
      const notificationsRef = collection(
        db,
        "users",
        auth.currentUser.uid,
        "notifications"
      );
      await addDoc(notificationsRef, {
        title,
        message,
        type,
        read: false,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error al guardar la notificación:", error);
    }
  };

  const handleSuccess = async (message) => {
    console.log(message);
    toast.success(message);

    // Guardar la notificación cuando se actualiza el perfil
    await saveNotification(
      "Perfil Actualizado",
      "Tu información de perfil ha sido actualizada correctamente",
      "success"
    );
  };

  if (loading || !userInfo) {
    return (
      <Card className="border-transparent bg-transparent absolute left-[860px] top-[380px] min-h-screen">
        <CardContent>
          <LoadinSpinner />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-white to-gray-200 bg-opacity-100 shadow-black shadow-lg backdrop-blur-sm bg-white">
      <CardHeader>
        <CardTitle>Información de la Cuenta</CardTitle>
        <CardDescription>Tus detalles de usuario.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <Avatar>
              <AvatarImage
                src={userProfile?.photoURL || userInfo?.photoURL}
                alt="Avatar"
              />
              <AvatarFallback>
                {userProfile?.name?.charAt(0) ||
                  userInfo?.displayName?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <p>
                <strong>Nombre:</strong>{" "}
                {userProfile?.name ||
                  userInfo?.displayName ||
                  "No especificado"}
              </p>
              <p>
                <strong>Email:</strong> {userInfo?.email}
              </p>
              <p>
                <strong>Teléfono:</strong>{" "}
                {formatPhoneNumber(userProfile?.phone)}
              </p>
              <p>
                <strong>Miembro desde:</strong>{" "}
                {userInfo?.metadata?.creationTime
                  ? new Date(
                      userInfo.metadata.creationTime
                    ).toLocaleDateString()
                  : "No disponible"}
              </p>
            </div>
          </div>
          <Dialog open={showEditProfile} onOpenChange={setShowEditProfile}>
            <DialogTrigger asChild>
              <Button className="mt-4 bg-opacity-90 text-black transition-colors duration-200 hover:text-white shadow-black shadow-lg bg-white">
                Editar Perfil
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Editar Perfil</DialogTitle>
                <DialogDescription>
                  Actualiza tu información personal
                </DialogDescription>
              </DialogHeader>
              <ProfileEditForm
                user={userInfo}
                onSuccess={handleSuccess}
                onClose={() => setShowEditProfile(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
}

export default AccountInfo;
