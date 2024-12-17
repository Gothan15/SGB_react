/* eslint-disable no-unused-vars */
"use client";

// Firebase imports
import { auth } from "../firebaseConfig";
import { signOut, onAuthStateChanged } from "firebase/auth";
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  getDoc,
  addDoc,
  serverTimestamp,
  deleteDoc,
} from "firebase/firestore";
import {
  SESSION_TIMEOUT_DURATION,
  PASSWORD_NOTIFICATION,
  SESSION_EXPIRATION_DURATION,
} from "../firebaseConfig";

import { useRef, useCallback } from "react";

// Components & Context
import ChatButton from "./ui/ChatButton";
import UserContext from "./UserContext";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import React, { memo, useEffect, useState } from "react";

import { db } from "@/firebaseConfig";
import ForcePasswordChangeDialog from "./dialogs/ForcePasswordChangeDialog";
import PasswordExpirationCheck from "./auth/PasswordExpirationCheck";

// UI Components imports
import {
  BookOpenIcon,
  CalendarIcon,
  UserIcon,
  BookIcon,
  X,
  Menu,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import LoadinSpinner from "./ui/LoadinSpinner";
import WelcomeUser from "./ui/welcome-user";
import PanelHeader from "./ui/panel-header";
import Sidebar from "./ui/sidebar-dashboards";
import Bubble from "./ui/Bubble";
import ReauthDialog from "./ui/ReauthDialog";

const UserDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [IconLocation, seticonLocation] = useState("Libros Reservados");

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
  const [isFabOpen, setIsFabOpen] = useState(false);
  const [showForcePasswordChange, setShowForcePasswordChange] = useState(false);
  const inactivityTimeoutRef = useRef(null);
  const [passwordStatus, setPasswordStatus] = useState(null);
  const [showReauthDialog, setShowReauthDialog] = useState(false);

  const resetInactivityTimeout = useCallback(() => {
    if (inactivityTimeoutRef.current)
      clearTimeout(inactivityTimeoutRef.current);
    inactivityTimeoutRef.current = setTimeout(() => {
      signOut(auth);
      toast.error("Sesión cerrada por inactividad");
      console.log("Sesión cerrada por inactividad");
    }, SESSION_TIMEOUT_DURATION);
  }, []);

  useEffect(() => {
    const events = ["mousemove", "keydown", "scroll", "click"];
    events.forEach((event) =>
      window.addEventListener(event, resetInactivityTimeout)
    );
    resetInactivityTimeout();
    return () => {
      events.forEach((event) =>
        window.removeEventListener(event, resetInactivityTimeout)
      );
      if (inactivityTimeoutRef.current)
        clearTimeout(inactivityTimeoutRef.current);
    };
  }, [resetInactivityTimeout]);

  // Verificar expiración de sesión
  const checkSessionExpiration = useCallback(() => {
    const intervalId = setInterval(() => {
      const sessionStartTime = parseInt(
        localStorage.getItem("sessionStartTime"),
        10
      );
      const currentTime = Date.now();

      if (currentTime - sessionStartTime >= SESSION_EXPIRATION_DURATION) {
        clearInterval(intervalId);

        // Eliminar datos de sesión de Firestore y localStorage
        localStorage.removeItem("sessionStartTime");
        deleteDoc(doc(db, "activeSessions", auth.currentUser.uid));

        // Mostrar diálogo de reautenticación
        setShowReauthDialog(true);
      }
    }, 1000); // Verificar cada segundo

    return () => clearInterval(intervalId);
  }, []);

  // Efecto para cargar datos iniciales y recargar al cambiar de ruta
  useEffect(() => {
    const checkActiveSession = async (user) => {
      if (!user) return;

      try {
        const sessionRef = doc(db, "activeSessions", user.uid);
        const sessionDoc = await getDoc(sessionRef);
        const browserSessionId =
          localStorage.getItem("browserSessionId") || crypto.randomUUID(); // Genera un ID único para esta instancia del navegador

        if (sessionDoc.exists()) {
          const sessionData = sessionDoc.data();

          // Si la sesión es de otro navegador (diferente browserSessionId)
          if (
            sessionData.browserSessionId &&
            sessionData.browserSessionId !== browserSessionId
          ) {
            await signOut(auth);
            toast.error("Ya existe una sesión activa en otro dispositivo");
            navigate("/register", { replace: true });
            return;
          }
        }

        // Almacena el browserSessionId en localStorage
        localStorage.setItem("browserSessionId", browserSessionId);

        // Registrar o actualizar la sesión actual
        await setDoc(sessionRef, {
          userName: user.displayName,
          timestamp: new Date().getTime(),
          userAgent: navigator.userAgent,
          browserSessionId: browserSessionId, // Incluye el ID de sesión del navegador
          lastUpdated: new Date().toISOString(),
        });
      } catch (error) {
        console.error("Error checking session:", error);
        toast.error("Error al verificar la sesión");
      }
    };

    const checkPasswordStatus = async (user) => {
      if (!user) return;

      try {
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          const expiresAt = userData.passwordExpiresAt?.toDate();

          if (expiresAt) {
            const now = new Date();
            const daysUntilExpiration = Math.ceil(
              (expiresAt - now) / (1000 * 60 * 60 * 24)
            );

            if (daysUntilExpiration > 0) {
              console.log(
                `Tu contraseña expirará en ${daysUntilExpiration} días`
              );
            }

            if (daysUntilExpiration <= 0) {
              // Contraseña expirada
              savePasswordNotification(
                user.uid,
                "Contraseña expirada",
                "Tu contraseña ha expirado. Por favor, cámbiala lo antes posible."
              );
              setPasswordStatus({ status: "expired", daysUntilExpiration });
            } else if (
              daysUntilExpiration <= PASSWORD_NOTIFICATION.WARN_DAYS_BEFORE
            ) {
              // Contraseña a punto de expirar
              savePasswordNotification(
                user.uid,
                "Contraseña por expirar",
                `Tu contraseña expira en ${daysUntilExpiration} días. Por favor, cámbiala pronto.`
              );
              setPasswordStatus({ status: "expiring", daysUntilExpiration });
            } else {
              setPasswordStatus({ status: "valid", daysUntilExpiration });
            }
          }
        }
      } catch (error) {
        console.error("Error al verificar el estado de la contraseña:", error);
      }
    };

    const savePasswordNotification = async (uid, title, message) => {
      try {
        const notificationsRef = collection(db, "users", uid, "notifications");
        await addDoc(notificationsRef, {
          title,
          message,
          type: "warning",
          read: false,
          createdAt: serverTimestamp(),
        });
      } catch (error) {
        console.error("Error al guardar la notificación:", error);
      }
    };

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        checkActiveSession(user);
        setUserData((prev) => ({ ...prev, userInfo: user }));
        setLoading(false);
        checkPasswordStatus(user); // Agregar esta línea para verificar el estado de la contraseña

        // Guardar tiempo de inicio de sesión en Firestore y localStorage
        const sessionStartTime = Date.now();
        localStorage.setItem("sessionStartTime", sessionStartTime.toString());

        const sessionRef = doc(db, "activeSessions", user.uid);
        setDoc(
          sessionRef,
          {
            // ...datos existentes...
            sessionStartTime,
          },
          { merge: true }
        );

        // Configurar verificación de expiración de sesión
        checkSessionExpiration();
      } else {
        navigate("/register", { replace: true });
      }
    });

    return () => unsubscribe();
  }, [checkSessionExpiration, navigate]);

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

  useEffect(() => {
    const checkPasswordStatus = async () => {
      if (!auth.currentUser) return;
      const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (
          userData.requiresPasswordChange ||
          (userData.passwordExpiresAt &&
            userData.passwordExpiresAt.toDate() <= new Date())
        ) {
          setShowForcePasswordChange(true);
        }
      }
    };

    checkPasswordStatus();
  }, []);

  if (loading) {
    return <LoadinSpinner />;
  }

  return (
    <>
      <PasswordExpirationCheck />
      {showForcePasswordChange && (
        <ForcePasswordChangeDialog
          isOpen={showForcePasswordChange}
          onClose={() => setShowForcePasswordChange(false)}
        />
      )}
      {showReauthDialog && (
        <ReauthDialog
          isOpen={showReauthDialog}
          onClose={() => setShowReauthDialog(false)}
          onReauthenticate={() => {
            // Lógica para reautenticar al usuario
            signOut(auth).then(() => {
              navigate("/register", { replace: true });
            });
          }}
        />
      )}
      <UserContext.Provider value={{ userData, loading }}>
        <div className="md:w-full w-full min-h-screen mx-auto p-4 bg-black bg-opacity-30 backdrop-blur-sm">
          <div className="flex flex-col md:flex-row justify-between items-center mb-6">
            <div className="rounded-md shadow-md shadow-black">
              <PanelHeader
                panelName="Panel de Usuario"
                locationName={IconLocation}
              />
            </div>

            <div className="absolute left-4 md:left-[300px] ml-4 rounded-md shadow-md shadow-black font-semibold text-black">
              <WelcomeUser
                userProfile={userData.userProfile}
                userInfo={userData.userInfo}
              />
            </div>

            <div className="fixed bottom-6 right-6 z-[9999]">
              <button
                className={`bg-primary text-primary-foreground rounded-full p-4 shadow-lg transition-all duration-300 ease-in-out ${
                  isFabOpen ? "rotate-45 scale-110" : ""
                }`}
                onClick={() => setIsFabOpen(!isFabOpen)}
              >
                {notifications.length > 0 && (
                  <Bubble
                    className="absolute left-0 top-0 bg-red-500 text-white rounded-full p-1"
                    count={notifications.length}
                  />
                )}
                {isFabOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
              <Sidebar
                MenuName={"Opciones de Usuario"}
                isOpen={isFabOpen}
                onClose={() => setIsFabOpen(false)}
                notifications={notifications}
                setNotifications={setNotifications}
                userProfile={userData.userProfile}
                userInfo={userData.userInfo}
                passwordStatus={passwordStatus} // Pasar el estado de la contraseña
              />
            </div>
          </div>

          {/* <div className="absolute right-6 top-[83px]">
          <LogoutDrawer />
        </div> */}

          <Tabs
            value={location.pathname.split("/").pop()}
            className="space-y-4"
          >
            <TabsList className=" border-0 bg-white bg-opacity-70 backdrop-blur shadow-lg shadow-black sm:w-auto overflow-x-auto">
              <TabsTrigger value="available" asChild className=" md:w-auto">
                <NavLink
                  onClick={() => seticonLocation("Libros Disponibles")}
                  to="available"
                  className="flex hover:bg-opacity-100 hover:shadow-black hover:shadow-lg hover:bg-white hover:text-black items-center bg-opacity-90"
                >
                  <BookIcon className="mr-2 h-4 w-4" />
                  <span className="hidden md:inline">Libros Disponibles</span>
                  <span className="md:hidden">Disp.</span>
                </NavLink>
              </TabsTrigger>
              <TabsTrigger value="borrowed" asChild className=" md:w-auto">
                <NavLink
                  onClick={() => seticonLocation("Libros Reservados")}
                  to="borrowed"
                  className="flex hover:bg-opacity-100 hover:shadow-black hover:shadow-lg hover:bg-white hover:text-black items-center bg-opacity-90"
                >
                  <BookOpenIcon className="mr-2 h-4 w-4" />
                  <span className="hidden md:inline">Libros Reservados</span>
                  <span className="md:hidden">Reserv.</span>
                </NavLink>
              </TabsTrigger>
              <TabsTrigger value="reservations" asChild className=" md:w-auto">
                <NavLink
                  onClick={() => seticonLocation("Historial de Reservas")}
                  to="reservations"
                  className="flex hover:bg-opacity-100 hover:shadow-black hover:shadow-lg hover:bg-white hover:text-black items-center bg-opacity-90"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  <span className="hidden md:inline">
                    Historial de Reservas
                  </span>
                  <span className="md:hidden">Historial</span>
                </NavLink>
              </TabsTrigger>
              <TabsTrigger value="account" asChild className=" md:w-auto">
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

            <div className="p-2 md:p-4">
              <Outlet />
            </div>
          </Tabs>
          <ChatButton />
        </div>
      </UserContext.Provider>
    </>
  );
};

export default memo(UserDashboard);
