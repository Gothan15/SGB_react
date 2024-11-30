import { useContext } from "react";
import UserContext from "../UserContext";
import LoadinSpinner from "../LoadinSpinner";

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
  const { userData, uiState, setUiState } = useContext(UserContext);

  if (!userData.userInfo) {
    return (
      <Card className="border-transparent bg-transparent absolute left-[860px] top-[380px] min-h-screen   ">
        <CardContent>
          {/* <p>Cargando información...</p> */}
          <LoadinSpinner />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-opacity-100 shadow-black shadow-lg backdrop-blur-sm bg-white">
      <CardHeader>
        <CardTitle>Información de la Cuenta</CardTitle>
        <CardDescription>Tus detalles de usuario.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <Avatar>
              <AvatarImage src={userData.userInfo.photoURL} alt="Avatar" />
              <AvatarFallback>
                {userData.userInfo.displayName?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <p>
                <strong>Nombre:</strong>{" "}
                {userData.userInfo.name || "No especificado"}
              </p>
              <p>
                <strong>Email:</strong> {userData.userInfo.email}
              </p>
              <p>
                <strong>Teléfono:</strong>{" "}
                {formatPhoneNumber(userData.userProfile?.phone)}
              </p>
              <p>
                <strong>Miembro desde:</strong>{" "}
                {new Date(
                  userData.userInfo.metadata.creationTime
                ).toLocaleDateString()}
              </p>
            </div>
          </div>
          <Dialog
            open={uiState.showEditProfile}
            onOpenChange={(open) =>
              setUiState((prevState) => ({
                ...prevState,
                showEditProfile: open,
              }))
            }
          >
            <DialogTrigger asChild>
              <Button className="mt-4 bg-opacity-90 text-black hover:text-white shadow-black shadow-lg hover:border-2 hover:border-white bg-white">
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
                user={userData.userInfo}
                onSuccess={(message) =>
                  setUiState((prevState) => ({
                    ...prevState,
                    message,
                  }))
                }
                onClose={() =>
                  setUiState((prevState) => ({
                    ...prevState,
                    showEditProfile: false,
                  }))
                }
              />
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
}

export default AccountInfo;

// Si tenías propTypes, elimínalas
// AccountInfo.propTypes = {
//   // ...prop definitions...
// };
