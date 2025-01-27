// Importaciones de React
import { useState, useEffect, useCallback, memo, useRef } from "react";
import { useLocation, NavLink, Outlet, useNavigate } from "react-router-dom";
import { UserIcon, Menu, X } from "lucide-react";
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
  orderBy,
  setDoc,
  deleteDoc,
} from "firebase/firestore";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { flexRender } from "@tanstack/react-table";
import {
  CalendarIcon,
  BookIcon,
  ChevronsUpDown,
  ChevronUp,
  ChevronDown,
} from "lucide-react";

// Importaciones internas
import {
  db,
  auth,
  SESSION_TIMEOUT_DURATION,
  SESSION_EXPIRATION_DURATION,
} from "../firebaseConfig";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AnimatePresence, motion } from "framer-motion";
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
import Bubble from "./ui/Bubble";
import Sidebar from "./ui/sidebar-dashboards";
import ReauthDialog from "./ui/ReauthDialog";
//import FunFacts from "./ui/FunFacts";

const BibPage = () => {
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
  const [IconLocation, setIconLocation] = useState("Reservas");
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
      } else {
        navigate("/register", { replace: true });
      }
    });

    return () => unsubscribe();
  }, [checkSessionExpiration, navigate]);

  useEffect(() => {
    const unsubscribers = [];

    // Función para obtener datos con cleanup
    const setupRealtimeListeners = () => {
      // Actualizar la colección y los campos para que coincidan con user-dashboard.jsx
      const pendingReservationsQuery = query(
        collection(db, "reservations"), // Asegurarse de que la colección es "reservations"
        where("status", "==", "Pendiente")
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
      where("status", "==", "Pendiente")
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

  useEffect(() => {
    const path = location.pathname.split("/").pop();
    const locationMap = {
      reservations: "Reservas",
      books: "Libros",
      account: "Mi Cuenta",
    };
    setIconLocation(locationMap[path] || "Reservas");
  }, [location.pathname]);

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
      <div className="md:w-full w-full min-h-screen mx-auto p-4 bg-black bg-opacity-30 backdrop-blur-sm">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6">
          <div className="rounded-md shadow-md shadow-black w-[60%]">
            <PanelHeader
              panelName="Panel de Asistente"
              locationName={IconLocation}
            />
          </div>
          {/* <div className="w-[30%] h-[30%] md:w-[30%] md:h-[10%]">
            <FunFacts />
          </div> */}
        </div>
        <div className="w-full md:w-auto md:absolute md:left-[300px] md:ml-4 rounded-md shadow-md shadow-black font-semibold text-black">
          <WelcomeUser />
        </div>

        {/* Botón flotante y sidebar */}
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
            MenuName={"Opciones de Asistente"}
            isOpen={isFabOpen}
            onClose={() => setIsFabOpen(false)}
            notifications={notifications}
            setNotifications={setNotifications}
            userProfile={userData.userProfile}
            userInfo={userData.userInfo}
          />
        </div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="bg-transparent bg-opacity-70 backdrop-blur-md shadow-lg rounded-md p-4"
        >
          <Tabs
            value={location.pathname.split("/").pop()}
            className="space-y-4"
          >
            <TabsList className="inline-flex p-1 bg-white/50 backdrop-blur-md shadow-lg rounded-full ">
              {/* <TabsTrigger value="reservations" asChild>
              <NavLink
                onClick={() => handleNavLinkClick("Reservas")}
                to="reservations"
                className="flex  hover:shadow-black hover:shadow-lg hover:bg-white hover:text-black hover:border-0 hover:border-black items-center bg-opacity-90"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                Reservas
              </NavLink>
            </TabsTrigger> */}

              <AnimatePresence>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <TabsTrigger value="reservations" asChild>
                    <NavLink
                      to="reservations"
                      className={({ isActive }) =>
                        `flex items-center px-4 py-2 rounded-full transition-all ${
                          isActive
                            ? "bg-black text-white shadow-md"
                            : "hover:bg-gray-100"
                        }`
                      }
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      Reservas
                    </NavLink>
                  </TabsTrigger>
                </motion.div>

                {/* <TabsTrigger value="books" asChild>
              <NavLink
                onClick={() => handleNavLinkClick("Libros")}
                to="books"
                className="flex hover:shadow-black hover:shadow-lg hover:bg-white hover:text-black hover:border-0 hover:border-black items-center bg-opacity-90"
              >
                <BookIcon className="mr-2 h-4 w-4" />
                Libros
              </NavLink>
            </TabsTrigger> */}
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <TabsTrigger value="books" asChild>
                    <NavLink
                      to="books"
                      className={({ isActive }) =>
                        `flex items-center px-4 py-2 rounded-full transition-all ${
                          isActive
                            ? "bg-black text-white shadow-md"
                            : "hover:bg-gray-100"
                        }`
                      }
                    >
                      <BookIcon className="mr-2 h-4 w-4" />
                      Libros
                    </NavLink>
                  </TabsTrigger>
                </motion.div>
                {/* <TabsTrigger value="account" asChild>
              <NavLink
                onClick={() => seticonLocation("Mi Cuenta")}
                to="account"
                className="flex hover:bg-opacity-100 hover:shadow-black hover:shadow-lg hover:bg-white hover:text-black items-center bg-opacity-90"
              >
                <UserIcon className="mr-2 h-4 w-4" />
                Mi Cuenta
              </NavLink>
            </TabsTrigger> */}
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <TabsTrigger value="account" asChild>
                    <NavLink
                      to="account"
                      className={({ isActive }) =>
                        `flex items-center px-4 py-2 rounded-full transition-all ${
                          isActive
                            ? "bg-black text-white shadow-md"
                            : "hover:bg-gray-100"
                        }`
                      }
                    >
                      <UserIcon className="mr-2 h-4 w-4" />
                      Mi Cuenta
                    </NavLink>
                  </TabsTrigger>
                </motion.div>
              </AnimatePresence>
            </TabsList>

            <div className="p-2 md:p-4">
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
        </motion.div>
      </div>
    </>
  );
};

export default memo(BibPage);
