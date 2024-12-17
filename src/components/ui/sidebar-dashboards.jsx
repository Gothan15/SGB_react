"use client";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Bell, EllipsisVertical, Trash2, Edit, Lock, Mail } from "lucide-react"; // Importar nuevos iconos

import PropTypes from "prop-types";

import { auth, db } from "@/firebaseConfig";
import {
  collection,
  getDocs,
  writeBatch,
  query,
  where,
  onSnapshot,
  doc,
  getDoc,
  serverTimestamp,
  addDoc,
} from "firebase/firestore";
import { useCallback, useState, useEffect } from "react";
import AvatarUser from "./avatarUser";
import { BookmarkIcon } from "lucide-react";

import LogOutDialog from "../dialogs/LogOutDialog";
import { motion } from "framer-motion"; // Importar framer-motion para animaciones
import ChangePasswordDialog from "../dialogs/ChangePasswordDialog"; // Importar ChangePasswordDialog
import SendEmailVerificationDialog from "../dialogs/SendEmailVerificationDialog";
import ProfileEditForm from "../dialogs/profile-edit-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Tooltip } from "@/components/ui/tooltip"; // Importar componente Tooltip si está disponible
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"; // Importar componentes DropdownMenu de shadcn

const Sidebar = ({
  MenuName,
  isOpen,
  onClose,
  notifications,
  setNotifications,
  userProfile,
  userInfo,
  passwordStatus, // Recibir el estado de la contraseña
}) => {
  const clearNotifications = useCallback(async () => {
    if (!auth.currentUser) return;
    try {
      const notificationsRef = collection(
        db,
        "users",
        auth.currentUser.uid,
        "notifications"
      );
      const snapshot = await getDocs(notificationsRef);

      const batch = writeBatch(db);
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      setNotifications([]);
    } catch (error) {
      console.error("Error al limpiar notificaciones:", error);
    }
  }, [setNotifications]);

  const [futureReadings, setFutureReadings] = useState([]);
  const [userRole, setUserRole] = useState(null);

  // Añadir efecto para obtener el rol del usuario
  useEffect(() => {
    if (!auth.currentUser) return;

    const getUserRole = async () => {
      try {
        const userRef = doc(db, "users", auth.currentUser.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setUserRole(userSnap.data().role);
        }
      } catch (error) {
        console.error("Error al obtener el rol del usuario:", error);
      }
    };

    getUserRole();
  }, []);

  // Modificar el efecto de futuras lecturas para que dependa del rol
  useEffect(() => {
    if (!auth.currentUser || userRole !== "student") return;

    const futureReadingsRef = collection(db, "futureReadings");
    const q = query(
      futureReadingsRef,
      where("userId", "==", auth.currentUser.uid)
    );

    // Usar onSnapshot para escuchar cambios en tiempo real
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const readings = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setFutureReadings(readings);
    });

    // Cleanup listener
    return () => unsubscribe();
  }, [userRole]);

  const [showEditProfile, setShowEditProfile] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isSendVerificationOpen, setIsSendVerificationOpen] = useState(false);

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

    // Ya no es necesario manejar la actualización del historial aquí
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full ">
        <SheetHeader>
          <SheetTitle>{MenuName}</SheetTitle>
        </SheetHeader>
        <div className="py-4 px-2 sm:px-4 flex flex-col h-full">
          {/* Mostrar el cartel si la contraseña está expirada o por expirar */}
          {passwordStatus &&
            (passwordStatus.status === "expired" ||
              passwordStatus.status === "expiring") && (
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className={`mb-4 p-4 rounded-lg shadow-lg ${
                  passwordStatus.status === "expired"
                    ? "bg-red-500"
                    : "bg-yellow-500"
                } text-gray-900`}
              >
                {passwordStatus.status === "expired" ? (
                  <p>
                    Tu contraseña ha expirado. Por favor, cámbiala lo antes
                    posible.
                  </p>
                ) : (
                  <p>
                    Tu contraseña expira en {passwordStatus.daysUntilExpiration}{" "}
                    días. Por favor, cámbiala pronto.
                  </p>
                )}
              </motion.div>
            )}
          {/* AVATAR */}
          <div className="space-y-4 flex-1 overflow-y-auto">
            <div>
              <h3 className="mb-2 font-semibold flex items-center">
                <Bell className="mr-2 h-4 w-4" />
                Notificaciones
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearNotifications}
                  className="hover:bg-red-100 ml-auto"
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </h3>

              <ScrollArea className="h-72 sm:h-[200px] md:h-60 lg:h-72 w-full rounded-md border p-2 sm:p-4">
                {notifications.length > 0 ? (
                  notifications.map((notification) => (
                    <div key={notification.id} className="mb-4 last:mb-0">
                      <h4 className="font-medium">{notification.title}</h4>
                      <p className="text-sm text-gray-500">
                        {notification.message}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No hay notificaciones</p>
                )}
              </ScrollArea>
            </div>
            {userRole === "student" && (
              <div>
                <h3 className="mb-2 font-semibold flex items-center">
                  <BookmarkIcon className="mr-2 h-4 w-4" />
                  Futuras Lecturas
                </h3>
                <ScrollArea className="h-[200px] sm:h-[200px] md:h-60  lg:h-60 w-full rounded-md border p-2 sm:p-4">
                  {futureReadings.length > 0 ? (
                    futureReadings.map((reading) => (
                      <div key={reading.id} className="mb-4 last:mb-0">
                        <h4 className="font-medium">{reading.bookTitle}</h4>
                        <p className="text-sm text-gray-500">
                          {reading.bookAuthor}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">
                      No tienes libros en futuras lecturas
                    </p>
                  )}
                </ScrollArea>
              </div>
            )}
          </div>
        </div>

        <div className="absolute mt-2 bottom-1 w-full sm:w-[340px] border-t border-gray-200 py-2 sm:py-4">
          <div className="mb-4 flex items-center space-x-4 relative">
            <AvatarUser userProfile={userProfile} userInfo={userInfo} />
            <div>
              <p className="font-medium text-sm sm:text-base">
                {userProfile?.name || userInfo?.displayName}
              </p>
              <p className="text-xs sm:text-sm text-gray-500">
                {userInfo?.email}
              </p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger>
                <motion.div
                  whileHover={{
                    scale: 1.2,
                    rotate: 10,
                    backgroundColor: "#f0f0f0",
                  }}
                  whileTap={{ scale: 0.9 }}
                  className="cursor-pointer rounded-full p-1 transition-colors duration-200 absolute right-16 lg:right-0 md:right-8 sm:right-10 top-3 block sm:block md:block"
                >
                  <EllipsisVertical className="w-6 h-6 sm:w-5   sm:h-5" />
                </motion.div>
              </DropdownMenuTrigger>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute right-16 lg:right-0 md:right-8 sm:right-10 mt-2" // Agregar posicionamiento absoluto
              >
                <DropdownMenuContent className="w-56 bg-white border border-gray-200 rounded-md shadow-lg">
                  <DropdownMenuItem className="px-4 py-2 hover:bg-gray-100">
                    <Tooltip content="Editar Perfil">
                      <Button
                        onClick={() => {
                          setShowEditProfile(true);
                          setIsChangePasswordOpen(false);
                          setIsSendVerificationOpen(false);
                        }}
                        className="flex items-center w-full text-left"
                      >
                        <Edit className="w-5 h-5 mr-2" />
                        Editar Perfil
                      </Button>
                    </Tooltip>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="px-4 py-2 hover:bg-gray-100">
                    <Tooltip content="Cambiar Contraseña">
                      <Button
                        onClick={() => {
                          setIsChangePasswordOpen(true);
                          setIsSendVerificationOpen(false);
                          setShowEditProfile(false);
                        }}
                        className="flex items-center w-full text-left"
                      >
                        <Lock className="w-5 h-5 mr-2" />
                        Cambiar Contraseña
                      </Button>
                    </Tooltip>
                  </DropdownMenuItem>
                  {!auth.currentUser.emailVerified && (
                    <DropdownMenuItem className="px-4 py-2 hover:bg-gray-100">
                      <Tooltip content="Verificar Email">
                        <Button
                          onClick={() => {
                            setIsSendVerificationOpen(true);
                            setIsChangePasswordOpen(false);
                            setShowEditProfile(false);
                          }}
                          className="flex items-center w-full text-left"
                        >
                          <Mail className="w-5 h-5 mr-2" />
                          Verificar Email
                        </Button>
                      </Tooltip>
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </motion.div>
            </DropdownMenu>
          </div>

          <LogOutDialog />

          {/* Diálogo Editar Perfil */}
          <Dialog open={showEditProfile} onOpenChange={setShowEditProfile}>
            <DialogContent className="w-full sm:w-96">
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

          {/* Implementación independiente de ChangePasswordDialog */}
          <ChangePasswordDialog
            isOpen={isChangePasswordOpen}
            onOpenChange={setIsChangePasswordOpen}
            triggerButton={null}
          />

          {/* Implementación independiente de SendEmailVerificationDialog */}
          <SendEmailVerificationDialog
            isOpen={isSendVerificationOpen}
            onOpenChange={setIsSendVerificationOpen}
            triggerButton={null}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
};

Sidebar.propTypes = {
  MenuName: PropTypes.string.isRequired,
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  notifications: PropTypes.array.isRequired,
  setNotifications: PropTypes.func.isRequired,
  userProfile: PropTypes.shape({
    name: PropTypes.string,
    photoURL: PropTypes.string,
    role: PropTypes.string, // Añadir validación para el rol
  }),
  userInfo: PropTypes.shape({
    displayName: PropTypes.string,
    email: PropTypes.string,
    photoURL: PropTypes.string,
  }).isRequired,
  passwordStatus: PropTypes.shape({
    status: PropTypes.string,
    daysUntilExpiration: PropTypes.number,
  }),
};

export default Sidebar;
