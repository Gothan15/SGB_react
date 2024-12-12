"use client";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Bell, EllipsisVertical, Trash2 } from "lucide-react";

import PropTypes from "prop-types";

import { auth, db } from "@/firebaseConfig";
import { collection, getDocs, writeBatch } from "firebase/firestore";
import { useCallback } from "react";
import AvatarUser from "./ui/avatarUser";

import LogOutDialog from "./dialogs/LogOutDialog";
import { motion } from "framer-motion"; // Importar framer-motion para animaciones

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

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>{MenuName}</SheetTitle>
        </SheetHeader>
        <div className="py-4 ">
          {/* Mostrar el cartel si la contraseña está expirada o por expirar */}
          {passwordStatus &&
            (passwordStatus.status === "expired" ||
              passwordStatus.status === "expiring") && (
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className={`mb-4 p-4 rounded-lg  shadow-lg ${
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
          <div className="space-y-4">
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

              <ScrollArea className="h-[300px] w-full rounded-md border p-4">
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
          </div>
        </div>

        <div className="absolute bottom-1 w-[340px]  border-t border-gray-200 py-4">
          <div className="mb-4 flex items-center space-x-4  ">
            {/* <User className="h-6 w-6" /> */}
            <AvatarUser userProfile={userProfile} userInfo={userInfo} />
            <div>
              <p className="font-medium">
                {userProfile?.name || userInfo?.displayName}
              </p>
              <p className="text-sm text-gray-500">{userInfo?.email}</p>
            </div>
            <EllipsisVertical
              className=" w-4 h-4 ml-12 absolute right-4
            "
            />
          </div>

          <LogOutDialog />
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
