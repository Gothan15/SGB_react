/* eslint-disable no-unused-vars */
"use client";
import UserContext from "./UserContext";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import React, { useState, useEffect, useCallback, memo } from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { db, auth } from "../firebaseConfig";
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
  orderBy,
  writeBatch,
  getDoc,
} from "firebase/firestore";
import { signOut } from "firebase/auth";
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
import { Timestamp } from "firebase/firestore";
import ReservationHistory from "./tabs/ReservationHistory";
import { onAuthStateChanged } from "firebase/auth";
import ProfileEditForm from "./dialogs/profile-edit-form";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import PhoneInput from "react-phone-input-2";
import AvailableBooks from "./tabs/AvailableBooks";
import BorrowedBooks from "./tabs/BorrowedBooks";
import AccountInfo from "./tabs/AccountInfo";
import { Toaster, toast } from "sonner";

function UserDashboard() {
  const location = useLocation();
  // Estados agrupados lógicamente
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

  // Efecto para cargar datos iniciales
  useEffect(() => {
    const loadUserData = async () => {
      if (!auth.currentUser) return;

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

        // Actualizar el estado con todos los datos
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
        setUiState((prev) => ({
          ...prev,
          error: "Error al cargar los datos del usuario",
        }));
      }
    };

    // Configurar listener para cambios en la autenticación
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        loadUserData();
      } else {
        window.location.href = "/register";
      }
    });

    // Limpiar el listener cuando el componente se desmonte
    return () => unsubscribe();
  }, []); // Se ejecuta solo al montar el componente

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

  // Maneja la reserva de un libro
  const handleReservation = useCallback(
    async (book, onSuccess) => {
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
          processed: false,
        });

        toast.success("Solicitud de reserva enviada correctamente", {
          duration: 3000,
          description: `Has reservado "${book.title}"`,
        });

        // Llamar al callback de éxito para cerrar el diálogo
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

      // Actualizar el historial de reservas
      const historyRef = collection(
        db,
        "users",
        auth.currentUser.uid,
        "reservationHistory"
      );

      // Crear nueva entrada en el historial
      const newHistoryRef = doc(historyRef);
      batch.set(newHistoryRef, {
        bookId: book.bookId || book.id,
        title: book.title,
        author: book.author,
        status: "Devuelto",
        returnedAt: timestamp,
        borrowedAt: book.borrowedAt || timestamp,
        dueDate: book.dueDate || timestamp,
        lateReturn: book.dueDate
          ? timestamp.toDate() > book.dueDate.toDate()
          : false,
      });

      // Ejecutar todas las operaciones en batch
      await batch.commit();

      // Actualizar el estado local
      setUserData((prev) => ({
        ...prev,
        borrowedBooks: prev.borrowedBooks.filter((b) => b.id !== book.id),
      }));

      toast.success("Libro devuelto exitosamente");
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

  // Maneja el cierre de sesión
  const handleLogout = useCallback(() => {
    signOut(auth).then(() => {
      window.location.href = "/register";
    });
  }, []);

  // Función auxiliar para formatear el número de teléfono
  const formatPhoneNumber = useCallback((phone) => {
    if (!phone) return "N/A";
    // Usa PhoneInput para obtener el formato correcto
    return phone;
  }, []);

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
              <DialogHeader>
                <DialogTitle>Reservar Libro</DialogTitle>
                <DialogDescription>
                  Confirma la reserva del libro seleccionado.
                </DialogDescription>
              </DialogHeader>
              <BookReservationForm
                onReserve={() =>
                  handleReservation(row.original, () => setOpen(false))
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
  });

  return (
    <UserContext.Provider
      value={{
        userData,
        handleRenewal,
        handleReturn,
        handleReservation,
        handleClearHistory,

        uiState,
        setUiState,
        table,
      }}
    >
      <div className="md:w-[1920px] min-h-screen md:mx-auto p-6 bg-black bg-opacity-30 backdrop-blur-sm">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl text-black font-bold border-0 shadow-md shadow-black rounded-lg text-center py-1 px-2 bg-white bg-opacity-100">
            Panel de Usuario
          </h1>
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
                className="hover:border-2 hover:border-black items-center bg-opacity-90"
              >
                <BookIcon className="mr-2 h-4 w-4" />
                Libros Disponibles
              </NavLink>
            </TabsTrigger>
            <TabsTrigger value="borrowed" asChild>
              <NavLink
                to="borrowed"
                className="hover:border-2 hover:border-black items-center bg-opacity-90"
              >
                <BookOpenIcon className="mr-2 h-4 w-4" />
                Libros Prestados
              </NavLink>
            </TabsTrigger>
            <TabsTrigger value="reservations" asChild>
              <NavLink
                to="reservations"
                className="hover:border-2 hover:border-black items-center bg-opacity-90"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                Historial de Reservas
              </NavLink>
            </TabsTrigger>
            <TabsTrigger value="account" asChild>
              <NavLink
                to="account"
                className="hover:border-2 hover:border-black items-center bg-opacity-90"
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
      </div>
    </UserContext.Provider>
  );
}

// Exportar el componente memoizado para evitar renders innecesarios
export default memo(UserDashboard);
