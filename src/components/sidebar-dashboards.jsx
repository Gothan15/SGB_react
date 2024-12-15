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
import {
  collection,
  getDocs,
  writeBatch,
  query,
  where,
  onSnapshot,
  doc,
  getDoc,
} from "firebase/firestore";
import { useCallback, useState, useEffect } from "react";
import AvatarUser from "./ui/avatarUser";
import { BookmarkIcon } from "lucide-react";

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
            {userRole === "student" && (
              <div>
                <h3 className="mb-2 font-semibold flex items-center">
                  <BookmarkIcon className="mr-2 h-4 w-4" />
                  Futuras Lecturas
                </h3>
                <ScrollArea className="h-[300px] w-full rounded-md border p-4">
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
