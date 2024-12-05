/* eslint-disable no-unused-vars */
"use client";

// Firebase imports
import { auth } from "../firebaseConfig";
import { signOut, onAuthStateChanged } from "firebase/auth";
import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  writeBatch,
} from "firebase/firestore";

// Components & Context
import ChatButton from "./ui/ChatButton";
import UserContext from "./UserContext";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import React, { memo, useEffect, useState } from "react";
import NotificationButton from "./ui/NotificationButton";
import { db } from "@/firebaseConfig";

// UI Components imports
import { BookOpenIcon, CalendarIcon, UserIcon, BookIcon } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import LoadinSpinner from "./LoadinSpinner";
import WelcomeUser from "./welcome-user";
import PanelHeader from "./panel-header";
import LogoutDrawer from "./ui/LogoutDrawer";

const UserDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [IconLocation, seticonLocation] = useState("Libros Prestados");

  // Estados principales
  const [userData, setUserData] = useState({
    borrowedBooks: [],
    reservationHistory: [],
    userInfo: null,
    availableBooks: [],
    pendingReservations: [],
    userProfile: null,
  });

  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);

  // Efecto para cargar datos iniciales y recargar al cambiar de ruta
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserData((prev) => ({ ...prev, userInfo: user }));
        setLoading(false);
      } else {
        navigate("/register", { replace: true });
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  // Efecto para suscribirse a las notificaciones
  useEffect(() => {
    let unsubscribe;
    if (auth.currentUser) {
      const notificationsRef = collection(
        db,
        "users",
        auth.currentUser.uid,
        "notifications"
      );
      const notificationsQuery = query(
        notificationsRef,
        orderBy("createdAt", "desc")
      );
      unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
        const notifs = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setNotifications(notifs);
      });
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Maneja el cierre de sesión
  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/register", { replace: true });
    } catch (error) {
      toast.error("Error al cerrar sesión");
      console.error("Error al cerrar sesión:", error);
    }
  };

  const clearNotifications = async () => {
    if (!auth.currentUser) return;
    try {
      const batch = writeBatch(db);
      const notificationsRef = collection(
        db,
        "users",
        auth.currentUser.uid,
        "notifications"
      );
      const snapshot = await getDocs(notificationsRef);

      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      setNotifications([]);
    } catch (error) {
      console.error("Error al limpiar notificaciones:", error);
    }
  };

  if (loading) {
    return <LoadinSpinner />;
  }

  return (
    <UserContext.Provider value={{ userData, loading }}>
      <div className="md:w-[1920px] min-h-screen md:mx-auto p-6 bg-black bg-opacity-30 backdrop-blur-sm">
        <div className="flex justify-between items-center mb-6">
          <div className="rounded-md shadow-md shadow-black">
            <PanelHeader
              panelName="Panel de Usuario"
              locationName={IconLocation}
            />
          </div>

          <div className="absolute left-[300px] ml-4 rounded-md shadow-md shadow-black font-semibold text-black">
            <WelcomeUser />
          </div>
          <div className="absolute right-[190px] top-[83px]">
            <NotificationButton
              notifications={notifications}
              onClear={clearNotifications}
            />
          </div>
        </div>
        <div className="absolute right-6 top-[83px]">
          <LogoutDrawer onLogout={handleLogout} />
        </div>

        <Tabs value={location.pathname.split("/").pop()} className="space-y-4">
          <TabsList className="border-0 bg-white bg-opacity-70 backdrop-blur shadow-lg shadow-black">
            <TabsTrigger value="available" asChild>
              <NavLink
                onClick={() => seticonLocation("Libros Disponibles")}
                to="available"
                className="flex hover:bg-opacity-100 hover:shadow-black hover:shadow-lg hover:bg-white hover:text-black items-center bg-opacity-90"
              >
                <BookIcon className="mr-2 h-4 w-4" />
                Libros Disponibles
              </NavLink>
            </TabsTrigger>
            <TabsTrigger value="borrowed" asChild>
              <NavLink
                onClick={() => seticonLocation("Libros Prestados")}
                to="borrowed"
                className="flex hover:bg-opacity-100 hover:shadow-black hover:shadow-lg hover:bg-white hover:text-black items-center bg-opacity-90"
              >
                <BookOpenIcon className="mr-2 h-4 w-4" />
                Libros Prestados
              </NavLink>
            </TabsTrigger>
            <TabsTrigger value="reservations" asChild>
              <NavLink
                onClick={() => seticonLocation("Historial de Reservas")}
                to="reservations"
                className="flex hover:bg-opacity-100 hover:shadow-black hover:shadow-lg hover:bg-white hover:text-black items-center bg-opacity-90"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                Historial de Reservas
              </NavLink>
            </TabsTrigger>
            <TabsTrigger value="account" asChild>
              <NavLink
                onClick={() => seticonLocation("Mi Cuenta")}
                to="account"
                className="flex hover:bg-opacity-100 hover:shadow-black hover:shadow-lg hover:bg-white hover:text-black items-center bg-opacity-90"
              >
                <UserIcon className="mr-2 h-4 w-4" />
                Mi Cuenta
              </NavLink>
            </TabsTrigger>
          </TabsList>

          <div className="p-4">
            <Outlet />
          </div>
        </Tabs>
        <ChatButton />
      </div>
    </UserContext.Provider>
  );
};

export default memo(UserDashboard);
