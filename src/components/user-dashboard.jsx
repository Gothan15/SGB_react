/* eslint-disable no-unused-vars */
"use client";

// Firebase imports
import { db, auth } from "../firebaseConfig";
import { signOut, onAuthStateChanged } from "firebase/auth";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  addDoc,
  onSnapshot,
  increment,
  deleteDoc,
  writeBatch,
  getDoc,
  Timestamp,
  orderBy,
  setDoc,
} from "firebase/firestore";

// Components & Context
import ChatButton from "./ui/ChatButton";
import UserContext from "./UserContext";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import React, { memo, useCallback, useEffect, useState } from "react";
import NotificationButton from "./ui/NotificationButton";
// UI Components imports
import { Button } from "@/components/ui/button";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
} from "@tanstack/react-table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FaPowerOff } from "react-icons/fa";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  BookOpenIcon,
  CalendarIcon,
  UserIcon,
  BookIcon,
  RefreshCw,
  ArrowLeftRight,
  Search,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import BookReservationForm from "./dialogs/book-reservation-form";
import BookReturnForm from "./dialogs/book-return-form";
import ReservationRenewalForm from "./dialogs/reservation-renewal-form";
import ReservationHistory from "./tabs/ReservationHistory";
import ProfileEditForm from "./dialogs/profile-edit-form";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import PhoneInput from "react-phone-input-2";
import AvailableBooks from "./tabs/AvailableBooks";
import BorrowedBooks from "./tabs/BorrowedBooks";
import AccountInfo from "./tabs/AccountInfo";
import { Toaster, toast } from "sonner";
import LoadinSpinner from "./LoadinSpinner";

const UserDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Estados agrupados por funcionalidad
  const [userData, setUserData] = useState({
    borrowedBooks: [],
    reservationHistory: [],
    userInfo: null,
    availableBooks: [],
    pendingReservations: [],
    userProfile: null,
  });

  const [uiState, setUiState] = useState({
    showReservationDialog: false,
    showRenewalDialog: false,
    showEditProfile: false,
  });

  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);

  // Funciones principales
  const loadUserData = async () => {
    if (!auth.currentUser) return;
    setLoading(true);
    try {
      // Obtener información del perfil del usuario
      const userProfileRef = doc(db, "users", auth.currentUser.uid);
      const userProfileSnap = await getDoc(userProfileRef);
      const userProfile = userProfileSnap.data();

      // Obtener libros prestados
      const borrowedBooksRef = collection(
        db,
        "users",
        auth.currentUser.uid,
        "borrowedBooks"
      );
      const borrowedBooksSnap = await getDocs(borrowedBooksRef);
      const borrowedBooks = borrowedBooksSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Obtener libros disponibles
      const booksRef = collection(db, "books");
      const booksQuery = query(booksRef, where("status", "==", "Disponible"));
      const booksSnap = await getDocs(booksQuery);
      const availableBooks = booksSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Obtener reservas pendientes
      const reservationsRef = collection(db, "reservations");
      const reservationsQuery = query(
        reservationsRef,
        where("userId", "==", auth.currentUser.uid),
        where("status", "==", "pendiente")
      );
      const reservationsSnap = await getDocs(reservationsQuery);
      const pendingReservations = reservationsSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Obtener historial de reservas
      const historyRef = collection(
        db,
        "users",
        auth.currentUser.uid,
        "reservationHistory"
      );
      const historySnap = await getDocs(historyRef);
      const reservationHistory = historySnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setUserData({
        borrowedBooks,
        reservationHistory,
        userInfo: auth.currentUser,
        availableBooks,
        pendingReservations,
        userProfile,
      });
    } catch (error) {
      console.error("Error loading user data:", error);
      toast.error("Error al cargar los datos del usuario");
    } finally {
      setLoading(false);
    }
  };

  // Efecto para cargar datos iniciales y recargar al cambiar de ruta
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        loadUserData();
      } else {
        navigate("/register", { replace: true });
      }
    });

    return () => unsubscribe();
  }, [location.pathname, navigate]); // Agregamos location.pathname y navigate como dependencias

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

  // Maneja la limpieza del historial
  const handleClearHistory = useCallback(async () => {
    try {
      const historyRef = collection(
        db,
        "users",
        auth.currentUser.uid,
        "reservationHistory"
      );
      const snapshot = await getDocs(historyRef);

      const batch = db.batch();
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      toast.success("Historial limpiado exitosamente");
    } catch (error) {
      toast.error("Error al limpiar el historial");
      console.error("Error:", error);
    }
  }, []);

  // Handlers optimizados
  const handleReservation = useCallback(
    async (book, onSuccess, selectedDate) => {
      if (!auth.currentUser) {
        toast.error("Usuario no autenticado");
        return;
      }

      try {
        await addDoc(collection(db, "reservations"), {
          userId: auth.currentUser.uid,
          userName: userData.userInfo.displayName,
          bookId: book.id,
          bookTitle: book.title,
          bookAuthor: book.author,
          status: "pendiente",
          requestedAt: Timestamp.fromDate(new Date()),
          dueDate: Timestamp.fromDate(selectedDate), // Agregamos la fecha de entrega
          processed: false,
        });

        const notificationRef = doc(
          collection(db, "users", auth.currentUser.uid, "notifications")
        );
        await setDoc(notificationRef, {
          message: `Has solicitado el libro "${
            book.title
          }" para entregar el ${selectedDate.toLocaleDateString()}.`,
          createdAt: Timestamp.fromDate(new Date()),
          read: false,
        });

        toast.success("Solicitud de reserva enviada correctamente", {
          duration: 3000,
          description: `Has solicitado "${
            book.title
          }" para entregar el ${selectedDate.toLocaleDateString()}`,
        });

        if (onSuccess) onSuccess();
      } catch (error) {
        toast.error("Error al enviar la solicitud de reserva", {
          duration: 3000,
          description: error.message,
        });
        console.error("Error:", error);
      }
    },
    [userData.userInfo]
  );

  // Maneja la devolución de un libro
  const handleReturn = useCallback(async (book) => {
    try {
      const batch = writeBatch(db);

      // Referencia al libro prestado en la colección del usuario
      const borrowedBookRef = doc(
        db,
        "users",
        auth.currentUser.uid,
        "borrowedBooks",
        book.id
      );

      // Referencia al libro en la colección principal de libros
      const bookRef = doc(db, "books", book.bookId || book.id);
      const timestamp = Timestamp.fromDate(new Date());

      // Obtener el documento del libro para verificar que existe
      const bookDoc = await getDoc(bookRef);
      if (!bookDoc.exists()) {
        throw new Error("El libro no existe en la base de datos");
      }

      // Actualizar el estado y la cantidad del libro
      batch.update(bookRef, {
        quantity: increment(1),
        status: "Disponible",
      });

      // Eliminar el libro de la lista de prestados del usuario
      batch.delete(borrowedBookRef);

      // Buscar la entrada existente en el historial que corresponde al préstamo
      const historyRef = collection(
        db,
        "users",
        auth.currentUser.uid,
        "reservationHistory"
      );
      const historyQuery = query(
        historyRef,
        where("bookId", "==", book.bookId || book.id),
        where("borrowedAt", "==", book.borrowedAt),
        where("status", "==", "Prestado")
      );
      const historySnapshot = await getDocs(historyQuery);

      if (!historySnapshot.empty) {
        // Actualizar la entrada existente en el historial
        const historyDoc = historySnapshot.docs[0];
        batch.update(historyDoc.ref, {
          status: "Devuelto",
          returnedAt: timestamp,
          lateReturn: book.dueDate
            ? timestamp.toDate() > book.dueDate.toDate()
            : false,
        });
      }

      // Ejecutar todas las operaciones en batch
      await batch.commit();

      // Actualizar el estado local
      setUserData((prev) => ({
        ...prev,
        borrowedBooks: prev.borrowedBooks.filter((b) => b.id !== book.id),
      }));

      // Añadir notificación para el usuario
      const notificationRef = doc(
        collection(db, "users", auth.currentUser.uid, "notifications")
      );
      await setDoc(notificationRef, {
        message: `Has devuelto el libro "${book.title}".`,
        createdAt: Timestamp.fromDate(new Date()),
        read: false,
      });

      toast.success("Libro devuelto exitosamente");
      // setNotifications((prev) => [...prev, `Has devuelto "${book.title}"`]);
    } catch (error) {
      console.error("Error al devolver el libro:", error);
      toast.error(`Error al devolver el libro: ${error.message}`);
    }
  }, []);

  // Maneja la renovación de un libro
  const handleRenewal = useCallback(async (bookId, newDueDate) => {
    try {
      // Actualizar la fecha de devolución en el documento del libro prestado
      const borrowedBookRef = doc(
        db,
        "users",
        auth.currentUser.uid,
        "borrowedBooks",
        bookId
      );

      await updateDoc(borrowedBookRef, {
        dueDate: newDueDate,
      });

      // Actualizar el estado local con la nueva fecha de devolución
      setUserData((prev) => ({
        ...prev,
        borrowedBooks: prev.borrowedBooks.map((book) =>
          book.id === bookId ? { ...book, dueDate: newDueDate } : book
        ),
      }));

      // toast.success("Préstamo renovado exitosamente");
    } catch (error) {
      // toast.error("Error al renovar el préstamo");
      console.error("Error:", error);
    }
  }, []);

  // Maneja el cierre de sesión de manera más eficiente
  const handleLogout = useCallback(async () => {
    try {
      await signOut(auth);
      // Usar navigate de react-router-dom en lugar de window.location
      navigate("/register", { replace: true });
    } catch (error) {
      toast.error("Error al cerrar sesión");
      console.error("Error al cerrar sesión:", error);
    }
  }, [navigate]);

  // Función auxiliar para formatear el número de teléfono
  const formatPhoneNumber = useCallback((phone) => {
    if (!phone) return "N/A";
    // Usa PhoneInput para obtener el formato correcto
    return phone;
  }, []);

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
  }, []);

  const handleCancelReservation = useCallback(
    async (reservationId, bookTitle) => {
      if (!auth.currentUser) return;

      try {
        // Eliminar la reservación
        const reservationRef = doc(db, "reservations", reservationId);
        await deleteDoc(reservationRef);

        // Agregar notificación
        const notificationRef = doc(
          collection(db, "users", auth.currentUser.uid, "notifications")
        );
        await setDoc(notificationRef, {
          message: `Has cancelado la reserva del libro "${bookTitle}".`,
          createdAt: Timestamp.fromDate(new Date()),
          read: false,
        });

        // Actualizar el estado local
        setUserData((prev) => ({
          ...prev,
          pendingReservations: prev.pendingReservations.filter(
            (r) => r.id !== reservationId
          ),
        }));

        toast.success("Reserva cancelada exitosamente");
      } catch (error) {
        console.error("Error al cancelar la reserva:", error);
        toast.error("Error al cancelar la reserva");
      }
    },
    []
  );

  const columns = [
    {
      accessorKey: "id",
      header: "ID",
    },
    {
      accessorKey: "title",
      header: "Título",
    },
    {
      accessorKey: "author",
      header: "Autor",
    },
    {
      accessorKey: "quantity",
      header: "Cantidad",
    },
    {
      accessorKey: "status",
      header: "Estado",
    },
    {
      id: "actions",
      header: "Acciones",
      cell: ({ row }) => {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const [open, setOpen] = useState(false);

        return (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <BookIcon className="mr-2 h-4 w-4" />
                Reservar
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogTitle>Reservar Libro</DialogTitle>
              <BookReservationForm
                book={row.original}
                onReserve={(selectedDate) =>
                  handleReservation(
                    row.original,
                    () => setOpen(false),
                    selectedDate
                  )
                }
              />
            </DialogContent>
          </Dialog>
        );
      },
    },
  ];

  const table = useReactTable({
    data: userData.availableBooks,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    initialState: {
      pagination: {
        pageSize: 8,
      },
    },
  });

  return (
    <UserContext.Provider
      value={{
        userData,
        handleRenewal,
        handleReturn,
        handleReservation,
        handleClearHistory,
        handleCancelReservation, // Agregar el nuevo handler al contexto
        uiState,
        setUiState,
        table,
        loading,
      }}
    >
      <div className="md:w-[1920px] min-h-screen md:mx-auto p-6 bg-black bg-opacity-30 backdrop-blur-sm">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl text-black font-bold border-0 shadow-md shadow-black rounded-lg text-center py-1 px-2 bg-white bg-opacity-100">
            Panel de Usuario
          </h1>
          <div className="absolute right-[180px] top-[83px] rounded-md shadow-md shadow-black font-semibold hover:border-2 text-black hover:border-black hover:bg-white hover:bg-opacity-100 bg-white bg-opacity-70">
            <NotificationButton
              notifications={notifications}
              onClear={clearNotifications}
            />
          </div>
        </div>
        <Button
          className="border-0  absolute right-6 top-[83px] pl-3 shadow-md shadow-black font-semibold h hover:border-2 text-black hover:border-black hover:bg-white hover:bg-opacity-100 bg-white bg-opacity-70"
          variant="outline"
          onClick={handleLogout}
        >
          <FaPowerOff className="" />
          Cerrar Sesión
        </Button>

        <Tabs value={location.pathname.split("/").pop()} className="space-y-4">
          <TabsList className="border-2">
            <TabsTrigger value="available" asChild>
              <NavLink
                to="available"
                className="flex hover:bg-opacity-100 hover:shadow-black hover:shadow-lg hover:border-2 hover:border-black items-center bg-opacity-90"
              >
                <BookIcon className="mr-2 h-4 w-4" />
                Libros Disponibles
              </NavLink>
            </TabsTrigger>
            <TabsTrigger value="borrowed" asChild>
              <NavLink
                to="borrowed"
                className="flex hover:bg-opacity-100 hover:shadow-black hover:shadow-lg hover:border-2 hover:border-black items-center bg-opacity-90"
              >
                <BookOpenIcon className="mr-2 h-4 w-4" />
                Libros Prestados
              </NavLink>
            </TabsTrigger>
            <TabsTrigger value="reservations" asChild>
              <NavLink
                to="reservations"
                className="flex hover:bg-opacity-100 hover:shadow-black hover:shadow-lg hover:border-2 hover:border-black items-center bg-opacity-90"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                Historial de Reservas
              </NavLink>
            </TabsTrigger>
            <TabsTrigger value="account" asChild>
              <NavLink
                to="account"
                className="flex hover:bg-opacity-100 hover:shadow-black hover:shadow-lg hover:border-2 hover:border-black items-center bg-opacity-90"
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

// Exportar el componente memoizado para evitar renders innecesarios
export default memo(UserDashboard);
