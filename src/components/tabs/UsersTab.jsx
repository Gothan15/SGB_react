/* eslint-disable no-unused-vars */
import { useOutletContext } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SearchIcon, UserPlus } from "lucide-react";
import LoadinSpinner from "../LoadinSpinner";
import AddUserForm from "../dialogs/add-user-form";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";

const UsersTab = () => {
  const { renderTable, usersTable } = useOutletContext();

  const handleAddUser = async (data) => {
    try {
      // Importar estas funciones al inicio del archivo
      const { createUserWithEmailAndPassword } = await import("firebase/auth");
      const { setDoc, doc, collection, Timestamp } = await import(
        "firebase/firestore"
      );
      const { auth, db } = await import("@/firebaseConfig");

      // Crear el usuario en Authentication
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        data.email,
        data.password
      );

      // Crear el documento del usuario en Firestore
      await setDoc(doc(db, "users", userCredential.user.uid), {
        name: data.name,
        email: data.email,
        role: data.role,
        createdAt: Timestamp.now(),
      });

      // Crear notificación para el nuevo usuario
      await setDoc(
        doc(collection(db, "users", userCredential.user.uid, "notifications")),
        {
          message: "¡Bienvenido al Sistema de Gestión de Biblioteca!",
          type: "welcome",
          createdAt: Timestamp.now(),
          read: false,
        }
      );

      toast.success("Usuario agregado exitosamente");
    } catch (error) {
      console.error("Error al crear usuario:", error);
      toast.error(
        error.code === "auth/email-already-in-use"
          ? "El correo electrónico ya está en uso"
          : "Error al crear usuario"
      );
    }
  };

  if (!usersTable) {
    return (
      <Card className="bg-gradient-to-br from-white to-gray-200 bg-opacity-100 shadow-black shadow-lg backdrop:blur-sm bg-white">
        <CardContent className="flex justify-center items-center min-h-[300px]">
          <LoadinSpinner />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-white to-gray-200 bg-opacity-100 shadow-black shadow-lg backdrop:blur-sm bg-white">
      <CardHeader>
        <CardTitle>Gestión de Usuarios</CardTitle>
        <CardDescription>
          Administra los usuarios del sistema de la biblioteca.
        </CardDescription>
      </CardHeader>
      <Dialog>
        <DialogTrigger className="absolute right-[65px]" asChild>
          <Button variant="outline" size="">
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

      <CardContent>{renderTable(usersTable, "users")}</CardContent>
    </Card>
  );
};

export default UsersTab;
