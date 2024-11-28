/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useCallback, memo } from "react";
import { Trash2Icon } from "lucide-react";
import {
  collection,
  doc,
  deleteDoc,
  updateDoc,
  query,
  where,
  addDoc,
  onSnapshot,
  setDoc,
  getDoc,
  getDocs,
  increment,
  writeBatch,
} from "firebase/firestore";
import { ref, listAll, getDownloadURL, deleteObject } from "firebase/storage";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { Timestamp } from "firebase/firestore";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { db, auth, storage } from "../firebaseConfig";
import { MdDeleteForever } from "react-icons/md";
import NewBookForm from "./dialogs/new-book-form";
import EditBookForm from "./dialogs/edit-book-form";
import DeleteBookConfirmation from "./dialogs/delete-book-confirmation";
import { FaPowerOff } from "react-icons/fa";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import * as XLSX from "xlsx";
import {
  UsersIcon,
  CalendarIcon,
  BookIcon,
  SearchIcon,
  BookPlus,
  Pencil,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
} from "@tanstack/react-table";
import { Toaster, toast } from "sonner";
import ReservationsTab from "./tabs/ReservationsTab";
import UsersTab from "./tabs/UsersTab";
import BooksTab from "./tabs/BooksTab";
import { NavLink, Outlet, useLocation } from "react-router-dom";

const AdminPage = () => {
  const location = useLocation();
  // Estados principales
  // Remover los estados message y error ya que usaremos toast
  // const [message, setMessage] = useState("");
  // const [error, setError] = useState("");
  const [data, setData] = useState({
    reports: [],
    users: [],
    reservations: [],
    books: [],
    pendingReservations: [],
  });
  const [ui, setUi] = useState({
    editingBook: null,
    deletingBook: null,
    addingBook: false,
    showUsers: true,
  });

  // Corregir función setAddingBook que falta
  const setAddingBook = (value) => {
    setUi((prev) => ({ ...prev, addingBook: value }));
  };

  // Efectos para cargar datos iniciales
  useEffect(() => {
    const fetchInitialData = async () => {
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

        // Cargar reservaciones
        const reservationsSnapshot = await getDocs(
          collection(db, "reservations")
        );
        const reservations = reservationsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setData((prev) => ({
          ...prev,
          users,
          books,
          reservations,
        }));
      } catch (error) {
        console.error("Error cargando datos iniciales:", error);
      }
    };

    fetchInitialData();
  }, []);

  // Handlers optimizados usando useCallback
  const handleEditBook = useCallback(async (updatedBook) => {
    try {
      const bookDocRef = doc(db, "books", updatedBook.id);
      await updateDoc(bookDocRef, updatedBook);
      setData((prev) => ({
        ...prev,
        books: prev.books.map((book) =>
          book.id === updatedBook.id ? updatedBook : book
        ),
      }));
      setUi((prev) => ({ ...prev, editingBook: null }));
    } catch (error) {
      console.error("Error al editar libro:", error);
    }
  }, []);

  // Corregir handleStatusChange para manejar el caso de usuario
  const handleChangeRole = async (userId, newRole) => {
    if (confirm(`¿Estás seguro de cambiar el rol del usuario?`)) {
      try {
        const userDocRef = doc(db, "users", userId);
        await updateDoc(userDocRef, {
          role: newRole,
        });

        setData((prev) => ({
          ...prev,
          users: prev.users.map((user) =>
            user.id === userId ? { ...user, role: newRole } : user
          ),
        }));
      } catch (error) {
        console.error("Error al cambiar el rol del usuario:", error);
        alert("Hubo un error al cambiar el rol del usuario.");
      }
    }
  };

  const handleStatusChange = async (itemId, newValue, itemType) => {
    try {
      switch (itemType) {
        case "user":
          await handleChangeRole(itemId, newValue);
          break;
        case "book": {
          const bookRef = doc(db, "books", itemId);
          await updateDoc(bookRef, { status: newValue });
          setData((prev) => ({
            ...prev,
            books: prev.books.map((book) =>
              book.id === itemId ? { ...book, status: newValue } : book
            ),
          }));
          break;
        }
        case "reservation": {
          const docRef = doc(db, "reservations", itemId);
          await updateDoc(docRef, { status: newValue });
          setData((prev) => ({
            ...prev,
            reservations: prev.reservations.map((res) =>
              res.id === itemId ? { ...res, status: newValue } : res
            ),
          }));
          break;
        }
      }
    } catch (error) {
      console.error(`Error al cambiar estado de ${itemType}:`, error);
    }
  };

  // Efectos optimizados
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
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Usuario autenticado
      } else {
        // Redireccionar o manejar sesión expirada
        window.location.href = "/register";
      }
    });

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
      (snapshot) => {
        // ...existing code to handle pending reservations...
      }
    );

    // ...existing code...

    return () => {
      unsubscribeAuth();
      unsubscribeUsers();
      unsubscribeBooks();
      unsubscribeReservations();
      unsubscribePendingReservations();
      // ...existing code...
    };
  }, []);

  const handleDeleteBook = async (bookId) => {
    const bookDocRef = doc(db, "books", bookId);
    await deleteDoc(bookDocRef);
    setData((prev) => ({
      ...prev,
      books: prev.books.filter((book) => book.id !== bookId),
    }));
    setUi((prev) => ({ ...prev, deletingBook: null }));
  };

  const handleAddBook = async (newBook) => {
    try {
      const booksCollection = collection(db, "books");
      const bookDocRef = await addDoc(booksCollection, newBook);
      setData((prev) => ({
        ...prev,
        books: [...prev.books, { id: bookDocRef.id, ...newBook }],
      }));
      setAddingBook(false); // Usamos la función corregida setAddingBook
    } catch (error) {
      console.error("Error al agregar libro:", error);
    }
  };

  const handleLogout = () => {
    signOut(auth).then(() => {
      window.location.href = "/register";
    });
  };

  const handleDeleteUser = async (userId) => {
    const confirmPrompt = prompt(
      'Para eliminar el usuario, inserte la palabra "eliminar"'
    );
    if (confirmPrompt && confirmPrompt.toLowerCase() === "eliminar") {
      try {
        const userDocRef = doc(db, "users", userId);
        await deleteDoc(userDocRef);

        setData((prev) => ({
          ...prev,
          users: prev.users.filter((user) => user.id !== userId),
        }));
      } catch (error) {
        console.error("Error al eliminar el usuario:", error);
        alert("Hubo un error al eliminar el usuario.");
      }
    } else {
      alert("La palabra ingresada no coincide, no se ha eliminado el usuario.");
    }
  };

  const handleApproveReservation = async (reservationId, bookId, userId) => {
    try {
      const batch = writeBatch(db);
      const reservationRef = doc(db, "reservations", reservationId);
      const bookRef = doc(db, "books", bookId);
      const bookDoc = await getDoc(bookRef);
      const timestamp = Timestamp.fromDate(new Date());
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 14); // 14 días de préstamo

      if (!bookDoc.exists()) {
        throw new Error("El libro no existe");
      }

      const bookData = bookDoc.data();
      if (bookData.quantity <= 0) {
        throw new Error("No hay ejemplares disponibles");
      }

      // Actualizar reserva
      batch.update(reservationRef, {
        status: "aceptada",
        approvedAt: timestamp,
        processed: false,
      });

      // Actualizar libro
      batch.update(bookRef, {
        quantity: increment(-1),
        status: bookData.quantity <= 1 ? "No Disponible" : "Disponible",
      });

      // Crear registro de préstamo
      const borrowedBookRef = doc(
        collection(db, "users", userId, "borrowedBooks")
      );
      batch.set(borrowedBookRef, {
        bookId,
        title: bookData.title,
        author: bookData.author,
        borrowedAt: timestamp,
        dueDate: Timestamp.fromDate(dueDate),
        status: "Prestado",
        reservationId,
        category: bookData.category || "No especificada",
        isbn: bookData.isbn || "No disponible",
        notes: "",
      });

      // Agregar al historial con el mismo formato que user-dashboard
      const historyRef = doc(
        collection(db, "users", userId, "reservationHistory")
      );
      batch.set(historyRef, {
        book: bookData.title,
        author: bookData.author,
        status: "Prestado",
        date: timestamp,
        borrowedAt: timestamp,
        returnedAt: null,
        isbn: bookData.isbn || "No disponible",
        category: bookData.category || "No especificada",
        bookId: bookId,
        userId: userId,
        actionType: "Préstamo",
        notes: "",
        dueDate: Timestamp.fromDate(dueDate),
        lateReturn: false,
      });

      await batch.commit();
      toast.success("Reserva aprobada exitosamente", {
        duration: 3000,
        description: "La reserva ha sido procesada y aprobada",
      });
    } catch (error) {
      toast.error("Error al aprobar la reserva", {
        duration: 3000,
        description: error.message,
      });
    }
  };

  const handleRejectReservation = async (reservationId, userId, bookId) => {
    try {
      const batch = writeBatch(db);
      const reservationRef = doc(db, "reservations", reservationId);
      const bookDoc = await getDoc(doc(db, "books", bookId));
      const timestamp = Timestamp.fromDate(new Date());

      if (!bookDoc.exists()) {
        throw new Error("El libro no existe");
      }

      const bookData = bookDoc.data();

      // Actualizar reserva
      batch.update(reservationRef, {
        status: "rechazada",
        rejectedAt: timestamp,
        processed: false,
      });

      // Agregar al historial con el mismo formato que user-dashboard
      const historyRef = doc(
        collection(db, "users", userId, "reservationHistory")
      );
      batch.set(historyRef, {
        book: bookData.title,
        author: bookData.author,
        status: "Rechazada",
        date: timestamp,
        borrowedAt: null,
        returnedAt: null,
        isbn: bookData.isbn || "No disponible",
        category: bookData.category || "No especificada",
        bookId: bookId,
        userId: userId,
        actionType: "Rechazo de reserva",
        notes: "",
        dueDate: null,
        lateReturn: false,
      });

      await batch.commit();
      toast.success("Reserva rechazada exitosamente", {
        duration: 3000,
        description: "La reserva ha sido rechazada",
      });
    } catch (error) {
      toast.error("Error al rechazar la reserva", {
        duration: 3000,
        description: error.message,
      });
    }
  };

  // Definición de columnas para la tabla de usuarios
  const userColumns = [
    {
      accessorKey: "id",
      header: "ID",
    },
    {
      accessorKey: "name",
      header: "Nombre",
    },
    {
      accessorKey: "email",
      header: "Email",
    },
    {
      accessorKey: "role",
      header: "Rol",
      cell: ({ row }) => (
        <Select
          value={row.original.role}
          onValueChange={(value) =>
            handleStatusChange(row.original.id, value, "user")
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Cambiar rol" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="student">Estudiante</SelectItem>
            <SelectItem value="atm">ATM</SelectItem>
          </SelectContent>
        </Select>
      ),
    },
    {
      id: "actions",
      header: "Acciones",
      cell: ({ row }) => (
        // <button
        //   onClick={() => handleDeleteUser(row.original.id)}
        //   className="text-red-500 hover:text-red-700"
        // >
        //   <MdDeleteForever className="h-6 w-6" />
        // </button>
        <Button onClick={() => handleDeleteUser(row.original.id)}>
          <Trash2Icon className="mr-2 h-4 w-4" />
          Eliminar Usuario
        </Button>
      ),
    },
  ];

  // Definición de columnas para la tabla de libros
  const bookColumns = [
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
      accessorKey: "publicationDate",
      header: "Fecha de Publicación",
    },
    {
      accessorKey: "quantity",
      header: "Cantidad",
    },
    {
      accessorKey: "status",
      header: "Estado",
      cell: ({ row }) => (
        <Select
          value={row.original.status}
          onValueChange={(value) =>
            handleStatusChange(row.original.id, value, "book")
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Cambiar estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Disponible">Disponible</SelectItem>
            <SelectItem value="Prestado">Prestado</SelectItem>
            <SelectItem value="En reparación">En reparación</SelectItem>
          </SelectContent>
        </Select>
      ),
    },
    {
      id: "actions",
      header: "Acciones",
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={() =>
                  setUi((prev) => ({ ...prev, editingBook: row.original }))
                }
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Editar Libro</DialogTitle>
                <DialogDescription>
                  Realiza cambios en los detalles del libro.
                </DialogDescription>
              </DialogHeader>
              {ui.editingBook && (
                <EditBookForm
                  book={ui.editingBook}
                  onSave={handleEditBook}
                  onCancel={() =>
                    setUi((prev) => ({ ...prev, editingBook: null }))
                  }
                />
              )}
            </DialogContent>
          </Dialog>

          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={() =>
                  setUi((prev) => ({ ...prev, deletingBook: row.original }))
                }
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Eliminar Libro</DialogTitle>
                <DialogDescription>
                  Esta acción no se puede deshacer. Esto eliminará
                  permanentemente el libro.
                </DialogDescription>
              </DialogHeader>
              {ui.deletingBook && (
                <DeleteBookConfirmation
                  bookTitle={ui.deletingBook.title}
                  onConfirm={() => handleDeleteBook(ui.deletingBook.id)}
                  onCancel={() =>
                    setUi((prev) => ({ ...prev, deletingBook: null }))
                  }
                />
              )}
            </DialogContent>
          </Dialog>
        </div>
      ),
    },
  ];

  // Configuración de las tablas
  const handleSearch = (value, tableType) => {
    if (tableType === "users") {
      usersTable.setGlobalFilter(value);
    } else if (tableType === "books") {
      booksTable.setGlobalFilter(value);
    }
  };

  const usersTable = useReactTable({
    data: data.users,
    columns: userColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    initialState: {
      globalFilter: "",
    },
  });

  const booksTable = useReactTable({
    data: data.books,
    columns: bookColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    initialState: {
      globalFilter: "",
    },
  });

  // Reemplazar el renderizado de las tablas existentes con el nuevo formato
  const renderTable = (table, tableType) => (
    <>
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
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
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

  return (
    <div className="md:w-[1920px] min-h-screen md:mx-auto p-6 bg-black bg-opacity-30 backdrop-blur-sm">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl text-black font-bold border-0 shadow-md shadow-black rounded-lg text-center py-1 px-2 bg-white bg-opacity-100">
          Panel de Administración de la Biblioteca
        </h1>
        <Button
          className="border-0 pl-3 absolute right-6 top-[83px] shadow-md shadow-black font-semibold hover:border-2 text-black hover:border-black hover:bg-white hover:bg-opacity-100 bg-white bg-opacity-70"
          variant="outline"
          onClick={handleLogout}
        >
          <FaPowerOff className="" />
          Cerrar Sesión
        </Button>
      </div>

      <Tabs value={location.pathname.split("/").pop()} className="space-y-4">
        <TabsList className="border-2 ">
          <TabsTrigger value="reservations" asChild>
            <NavLink
              to="reservations"
              className="flex  hover:border-2 hover:border-black items-center bg-opacity-90"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              Reservas
            </NavLink>
          </TabsTrigger>
          <TabsTrigger value="users" asChild>
            <NavLink
              to="users"
              className="flex hover:shadow-black hover:shadow-lg hover:border-2 hover:border-black items-center bg-opacity-90"
              // flex items-center bg-opacity-90 shadow-black shadow-lg hover:border-2 hover:border-black backdrop:blur-sm bg-white
            >
              <UsersIcon className="mr-2 h-4 w-4" />
              Usuarios
            </NavLink>
          </TabsTrigger>
          <TabsTrigger value="books" asChild>
            <NavLink
              to="books"
              className="flex hover:shadow-black hover:shadow-lg hover:border-2 hover:border-black items-center bg-opacity-90"
            >
              <BookIcon className="mr-2 h-4 w-4" />
              Libros
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
              handleAddBook,
              handleEditBook,
              handleDeleteBook,
              handleStatusChange,
              handleDeleteUser,
              handleApproveReservation,
              handleRejectReservation,
              renderTable,
              usersTable,
              booksTable,
            }}
          />
        </div>
      </Tabs>
    </div>
  );
};

export default memo(AdminPage);
