/* eslint-disable no-unused-vars */
// Importaciones de React
import { useState, useEffect, useCallback, memo, useRef } from "react";
import { useLocation, NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  Trash2 as TrashIcon2,
  MessageSquare,
  UserIcon,
  X,
  Menu,
} from "lucide-react";
// Importaciones externas
import { toast } from "sonner";
import {
  collection,
  doc,
  query,
  where,
  onSnapshot,
  getDoc,
  getDocs,
  writeBatch,
  orderBy,
  setDoc,
  deleteDoc,
} from "firebase/firestore";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { flexRender } from "@tanstack/react-table";
import {
  UsersIcon,
  ChevronsUpDown,
  ChevronUp,
  ChevronDown,
  BarChart,
} from "lucide-react";

// Importaciones internas
import {
  db,
  auth,
  SESSION_TIMEOUT_DURATION,
  SESSION_EXPIRATION_DURATION,
} from "../firebaseConfig";
import { functions } from "@/firebaseConfig";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import PanelHeader from "./ui/panel-header";
import WelcomeUser from "./ui/welcome-user";
import LoadinSpinner from "./ui/LoadinSpinner";
import Sidebar from "./sidebar-dashboards";
import Bubble from "./ui/Bubble";
import VerificarAdmin from "./VerificarAdmin";
import ReauthDialog from "./ui/ReauthDialog";

const AdminPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [data, setData] = useState({
    users: [],
    books: [],
  });
  const [ui, setUi] = useState({
    editingBook: null,
    deletingBook: null,
    addingBook: false,
    showUsers: true,
  });
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
  const [IconLocation, seticonLocation] = useState("Usuarios");
  const [isFabOpen, setIsFabOpen] = useState(false);
  const inactivityTimeoutRef = useRef(null);
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

  // Efectos para cargar datos iniciales
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        // Cargar usuarios
        const usersSnapshot = await getDocs(collection(db, "users"));
        const users = usersSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Cargar libros
        const booksSnapshot = await getDocs(collection(db, "books"));
        const books = booksSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setData((prev) => ({
          ...prev,
          users,
          books,
        }));
      } catch (error) {
        console.error("Error cargando datos iniciales:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  // Efectos optimizados
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
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        checkActiveSession(user);
        setUserData((prev) => ({ ...prev, userInfo: user }));
        setLoading(false);

        const sessionStartTime = Date.now();
        localStorage.setItem("sessionStartTime", sessionStartTime.toString());

        const sessionRef = doc(db, "activeSessions", user.uid);
        setDoc(
          sessionRef,
          {
            userName: user.displayName,
            timestamp: new Date().getTime(),
            userAgent: navigator.userAgent,
            browserSessionId: localStorage.getItem("browserSessionId"),
            lastUpdated: new Date().toISOString(),
            sessionStartTime,
          },
          { merge: true }
        );

        checkSessionExpiration();
        ReauthDialog;
      } else {
        navigate("/register", { replace: true });
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const checkSessionExpiration = useCallback(() => {
    const intervalId = setInterval(() => {
      const sessionStartTime = parseInt(
        localStorage.getItem("sessionStartTime"),
        10
      );
      const currentTime = Date.now();

      if (currentTime - sessionStartTime >= SESSION_EXPIRATION_DURATION) {
        clearInterval(intervalId);

        localStorage.removeItem("sessionStartTime");
        deleteDoc(doc(db, "activeSessions", auth.currentUser.uid));

        setShowReauthDialog(true);
      }
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const unsubscribers = [];

    // Función para obtener datos con cleanup
    const setupRealtimeListeners = () => {
      // Actualizar la colección y los campos para que coincidan con user-dashboard.jsx
      const pendingReservationsQuery = query(
        collection(db, "reservations"), // Asegurarse de que la colección es "reservations"
        where("status", "==", "pendiente")
      );

      const unsubscribe = onSnapshot(
        pendingReservationsQuery,
        async (snapshot) => {
          const reservationsData = await Promise.all(
            snapshot.docs.map(async (docSnapshot) => {
              const data = { id: docSnapshot.id, ...docSnapshot.data() };
              // Obtener datos relacionados
              const [userDoc, bookDoc] = await Promise.all([
                getDoc(doc(db, "users", data.userId)),
                getDoc(doc(db, "books", data.bookId)),
              ]);

              return {
                ...data,
                userName: userDoc.exists()
                  ? userDoc.data().name
                  : "Usuario desconocido",
                bookTitle: bookDoc.exists()
                  ? bookDoc.data().title
                  : "Título desconocido",
              };
            })
          );

          setData((prev) => ({
            ...prev,
            pendingReservations: reservationsData,
          }));
        }
      );

      unsubscribers.push(unsubscribe);
    };

    setupRealtimeListeners();

    // Cleanup function
    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, []);

  useEffect(() => {
    const usersRef = collection(db, "users");
    const unsubscribeUsers = onSnapshot(usersRef, (snapshot) => {
      const users = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setData((prev) => ({ ...prev, users }));
    });

    const booksRef = collection(db, "books");
    const unsubscribeBooks = onSnapshot(booksRef, (snapshot) => {
      const books = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setData((prev) => ({ ...prev, books }));
    });

    const reservationsRef = collection(db, "reservations");
    const unsubscribeReservations = onSnapshot(reservationsRef, (snapshot) => {
      const reservations = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setData((prev) => ({ ...prev, reservations }));
    });

    const pendingReservationsQuery = query(
      collection(db, "reservations"),
      where("status", "==", "pendiente")
    );
    const unsubscribePendingReservations = onSnapshot(
      pendingReservationsQuery,
      () => {
        // ...existing code to handle pending reservations...
      }
    );

    return () => {
      //unsubscribeAuth();
      unsubscribeUsers();
      unsubscribeBooks();
      unsubscribeReservations();
      unsubscribePendingReservations();
    };
  }, []);

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

  // Configuración de las tablas
  const handleSearch = (value, tableType) => {
    if (tableType === "users") {
      // eslint-disable-next-line no-undef
      usersTable.setGlobalFilter(value);
    } else if (tableType === "books") {
      // eslint-disable-next-line no-undef
      booksTable.setGlobalFilter(value);
    }
  };

  // Reemplazar el renderizado de las tablas existentes con el nuevo formato
  function getSortIcon(column) {
    const sorted = column.getIsSorted();
    if (!sorted) return <ChevronsUpDown className="ml-2 h-4 w-4" />;
    if (sorted === "asc") return <ChevronUp className="ml-2 h-4 w-4" />;
    return <ChevronDown className="ml-2 h-4 w-4" />;
  }

  const renderTable = (table, tableType) => (
    <>
      {tableType !== "tickets" && (
        <div className="flex items-center space-x-2 mb-4">
          <Input
            placeholder={`Buscar ${
              tableType === "users" ? "usuario" : "libro"
            }...`}
            className="max-w-sm"
            value={table.getState().globalFilter ?? ""}
            onChange={(e) => handleSearch(e.target.value, tableType)}
          />
        </div>
      )}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.column.getCanSort() ? (
                      <div
                        className="flex cursor-pointer items-center"
                        onClick={() => header.column.toggleSorting()}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {getSortIcon(header.column)}
                      </div>
                    ) : (
                      flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Anterior
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Siguiente
        </Button>
      </div>
    </>
  );

  // Fix the click handlers for NavLinks
  const handleNavLinkClick = (location) => {
    seticonLocation(location);
  };

  if (loading) {
    return <LoadinSpinner />;
  }

  return (
    <>
      {showReauthDialog && (
        <ReauthDialog
          isOpen={showReauthDialog}
          onClose={() => setShowReauthDialog(false)}
          onReauthenticate={() => {
            signOut(auth).then(() => {
              navigate("/register", { replace: true });
            });
          }}
        />
      )}
      <div className="md:w-[1920px] min-h-screen md:mx-auto p-6 bg-black bg-opacity-30 backdrop-blur-sm">
        <VerificarAdmin />
        <div className="flex justify-between items-center mb-6">
          <div className="rounded-md shadow-md shadow-black">
            <PanelHeader
              panelName="Panel de Administración de la Biblioteca"
              locationName={IconLocation}
            />
          </div>

          <div className="absolute left-[300px]  ml-4 rounded-md shadow-md shadow-black font-semibold  text-black ">
            <WelcomeUser />
          </div>

          <div className="fixed bottom-6 right-6 z-50">
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
              MenuName={"Opciones de Administrador"}
              isOpen={isFabOpen}
              onClose={() => setIsFabOpen(false)}
              notifications={notifications}
              setNotifications={setNotifications}
              userProfile={userData.userProfile}
              userInfo={userData.userInfo}
            />
          </div>
        </div>

        <Tabs value={location.pathname.split("/").pop()} className="space-y-4">
          <TabsList className="border-0 bg-white bg-opacity-70 backdrop-blur shadow-lg shadow-black">
            <TabsTrigger value="users" asChild>
              <NavLink
                onClick={() => handleNavLinkClick("Usuarios")}
                to="users"
                className="flex hover:shadow-black hover:shadow-lg hover:bg-white hover:text-black hover:border-0 hover:border-black items-center bg-opacity-90"
              >
                <UsersIcon className="mr-2 h-4 w-4" />
                Usuarios
              </NavLink>
            </TabsTrigger>

            <TabsTrigger value="reports" asChild>
              <NavLink
                onClick={() => handleNavLinkClick("Informes")}
                to="reports"
                className="flex hover:shadow-black hover:shadow-lg hover:bg-white hover:text-black hover:border-0 hover:border-black items-center bg-opacity-90"
              >
                <BarChart className="mr-2 h-4 w-4" />
                Informes
              </NavLink>
            </TabsTrigger>
            <TabsTrigger value="support" asChild>
              <NavLink
                onClick={() => handleNavLinkClick("Soporte")}
                to="support"
                className="flex hover:bg-white hover:shadow-black hover:shadow-lg  hover:text-black hover:border-0 hover:border-black items-center bg-opacity-90"
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                Soporte
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
            <Outlet
              context={{
                data,
                setData,
                ui,
                setUi,
                renderTable, // Mantener renderTable en el contexto
                loading,
              }}
            />
          </div>
        </Tabs>
      </div>
    </>
  );
};

export default memo(AdminPage);
