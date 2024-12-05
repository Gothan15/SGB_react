// Importaciones de React
import { useState, useEffect, useCallback, memo } from "react";
import { useLocation, NavLink, Outlet, useNavigate } from "react-router-dom";
import { Trash2 as Trash2Icon, MessageSquare } from "lucide-react";
// Importaciones externas

import { toast } from "sonner";
import {
  collection,
  doc,
  // deleteDoc,
  updateDoc,
  query,
  where,
  // addDoc,
  onSnapshot,
  getDoc,
  getDocs,
  increment,
  writeBatch,
  Timestamp,
  orderBy,
} from "firebase/firestore";
import { signOut, onAuthStateChanged } from "firebase/auth";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
} from "@tanstack/react-table";
import {
  UsersIcon,
  CalendarIcon,
  BookIcon,
  Pencil,
  Trash2,
  ChevronsUpDown,
  ChevronUp,
  ChevronDown,
  BarChart,
} from "lucide-react";

// Importaciones internas
import { db, auth } from "../firebaseConfig";
import EditBookForm from "./dialogs/edit-book-form";
import DeleteBookConfirmation from "./dialogs/delete-book-confirmation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import NotificationButton from "./ui/NotificationButton";
import PanelHeader from "./panel-header";
import WelcomeUser from "./welcome-user";
import LogoutDrawer from "./ui/LogoutDrawer";

const AdminPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
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
    supportTickets: [],
  });
  const [ui, setUi] = useState({
    editingBook: null,
    deletingBook: null,
    addingBook: false,
    showUsers: true,
  });
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [IconLocation, seticonLocation] = useState("Reservas");

  // Corregir función setAddingBook que falta
  // const setAddingBook = (value) => {
  //   setUi((prev) => ({ ...prev, addingBook: value }));
  // };

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
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  // Handlers optimizados usando useCallback
  const handleEditBook = useCallback(async (updatedBook) => {
    try {
      const batch = writeBatch(db);
      const bookRef = doc(db, "books", updatedBook.id);

      // Actualizar libro
      batch.update(bookRef, updatedBook);

      // Crear notificación para administradores
      const adminsSnapshot = await getDocs(
        query(collection(db, "users"), where("role", "==", "admin"))
      );
      const timestamp = Timestamp.fromDate(new Date());

      adminsSnapshot.docs.forEach((adminDoc) => {
        const notificationRef = doc(
          collection(db, "users", adminDoc.id, "notifications")
        );
        batch.set(notificationRef, {
          message: `Libro actualizado: "${updatedBook.title}"`,
          type: "book_updated",
          createdAt: timestamp,
          read: false,
        });
      });

      await batch.commit();
      setData((prev) => ({
        ...prev,
        books: prev.books.map((book) =>
          book.id === updatedBook.id ? updatedBook : book
        ),
      }));
    } catch (error) {
      console.error("Error al actualizar libro:", error);
      toast.error("Error al actualizar libro");
    }
  }, []);

  // Corregir handleStatusChange para manejar el caso de usuario
  const handleChangeRole = async (userId, newRole) => {
    if (confirm(`¿Estás seguro de cambiar el rol del usuario?`)) {
      try {
        const batch = writeBatch(db);
        const userRef = doc(db, "users", userId);
        const userDoc = await getDoc(userRef);
        const userData = userDoc.data();

        // Actualizar rol
        batch.update(userRef, { role: newRole });

        // Crear notificaciones
        const timestamp = Timestamp.fromDate(new Date());

        // Notificación para el usuario afectado
        const userNotificationRef = doc(
          collection(db, "users", userId, "notifications")
        );
        batch.set(userNotificationRef, {
          message: `Tu rol ha sido actualizado a: ${newRole}`,
          type: "role_updated",
          createdAt: timestamp,
          read: false,
        });

        // Notificación para administradores
        const adminsSnapshot = await getDocs(
          query(collection(db, "users"), where("role", "==", "admin"))
        );
        adminsSnapshot.docs.forEach((adminDoc) => {
          if (adminDoc.id !== userId) {
            // Evitar duplicar notificación si el usuario es admin
            const notificationRef = doc(
              collection(db, "users", adminDoc.id, "notifications")
            );
            batch.set(notificationRef, {
              message: `Rol actualizado para ${userData.name}: ${newRole}`,
              type: "role_updated",
              createdAt: timestamp,
              read: false,
            });
          }
        });

        await batch.commit();
        setData((prev) => ({
          ...prev,
          users: prev.users.map((user) =>
            user.id === userId ? { ...user, role: newRole } : user
          ),
        }));
      } catch (error) {
        console.error("Error al cambiar el rol:", error);
        toast.error("Error al cambiar el rol");
      }
    }
  };

  const handleStatusChange = async (itemId, newValue, itemType) => {
    console.log(`Cambiando estado de ${itemType} ${itemId} a ${newValue}`); // Console log agregado
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
      () => {
        // ...existing code to handle pending reservations...
      }
    );

    const ticketsRef = collection(db, "support_tickets");
    const unsubscribeTickets = onSnapshot(ticketsRef, (snapshot) => {
      const tickets = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setData((prev) => ({ ...prev, supportTickets: tickets }));
    });

    return () => {
      unsubscribeAuth();
      unsubscribeUsers();
      unsubscribeBooks();
      unsubscribeReservations();
      unsubscribePendingReservations();
      unsubscribeTickets();
      // ...existing code...
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

  const handleDeleteBook = async (bookId) => {
    try {
      const batch = writeBatch(db);
      const bookRef = doc(db, "books", bookId);
      const bookDoc = await getDoc(bookRef);
      const bookData = bookDoc.data();

      // Eliminar libro
      batch.delete(bookRef);

      // Crear notificación para administradores
      const adminsSnapshot = await getDocs(
        query(collection(db, "users"), where("role", "==", "admin"))
      );
      const timestamp = Timestamp.fromDate(new Date());

      adminsSnapshot.docs.forEach((adminDoc) => {
        const notificationRef = doc(
          collection(db, "users", adminDoc.id, "notifications")
        );
        batch.set(notificationRef, {
          message: `Libro eliminado: "${bookData.title}"`,
          type: "book_deleted",
          createdAt: timestamp,
          read: false,
        });
      });

      await batch.commit();
      setData((prev) => ({
        ...prev,
        books: prev.books.filter((book) => book.id !== bookId),
      }));
    } catch (error) {
      console.error("Error al eliminar libro:", error);
      toast.error("Error al eliminar libro");
    }
  };

  const handleAddBook = async (newBook) => {
    try {
      const batch = writeBatch(db);
      const booksCollection = collection(db, "books");
      const newBookRef = doc(booksCollection);

      // Añadir libro
      batch.set(newBookRef, newBook);

      // Crear notificación para administradores
      const adminsSnapshot = await getDocs(
        query(collection(db, "users"), where("role", "==", "admin"))
      );
      const timestamp = Timestamp.fromDate(new Date());

      adminsSnapshot.docs.forEach((adminDoc) => {
        const notificationRef = doc(
          collection(db, "users", adminDoc.id, "notifications")
        );
        batch.set(notificationRef, {
          message: `Nuevo libro añadido: "${newBook.title}" por ${newBook.author}`,
          type: "book_added",
          createdAt: timestamp,
          read: false,
        });
      });

      await batch.commit();
      setData((prev) => ({
        ...prev,
        books: [...prev.books, { id: newBookRef.id, ...newBook }],
      }));
    } catch (error) {
      console.error("Error al agregar libro:", error);
      toast.error("Error al agregar libro");
    }
  };

  const handleLogout = useCallback(async () => {
    console.log("Usuario cerró sesión."); // Console log agregado
    try {
      await signOut(auth);
      navigate("/register", { replace: true });
    } catch (error) {
      toast.error("Error al cerrar sesión");
      console.error("Error al cerrar sesión:", error);
    }
  }, [navigate]);

  const handleDeleteUser = async (userId) => {
    const confirmPrompt = prompt(
      'Para eliminar el usuario, inserte la palabra "eliminar"'
    );
    if (confirmPrompt && confirmPrompt.toLowerCase() === "eliminar") {
      try {
        const batch = writeBatch(db);
        const userDocRef = doc(db, "users", userId);
        const userDoc = await getDoc(userDocRef);
        const userData = userDoc.data();

        // Eliminar usuario
        batch.delete(userDocRef);

        // Crear notificación para administradores
        const adminsSnapshot = await getDocs(
          query(collection(db, "users"), where("role", "==", "admin"))
        );
        const timestamp = Timestamp.fromDate(new Date());

        adminsSnapshot.docs.forEach((adminDoc) => {
          const notificationRef = doc(
            collection(db, "users", adminDoc.id, "notifications")
          );
          batch.set(notificationRef, {
            message: `Usuario ${userData.name} (${userData.email}) ha sido eliminado del sistema.`,
            type: "user_deleted",
            createdAt: timestamp,
            read: false,
          });
        });

        await batch.commit();
        setData((prev) => ({
          ...prev,
          users: prev.users.filter((user) => user.id !== userId),
        }));
      } catch (error) {
        console.error("Error al eliminar el usuario:", error);
        toast.error("Error al eliminar el usuario");
      }
    }
  };

  const handleApproveReservation = async (reservationId, bookId, userId) => {
    try {
      const batch = writeBatch(db);
      const reservationRef = doc(db, "reservations", reservationId);
      const bookRef = doc(db, "books", bookId);
      const reservationDoc = await getDoc(reservationRef);
      const bookDoc = await getDoc(bookRef);
      const timestamp = Timestamp.fromDate(new Date());

      if (!bookDoc.exists()) {
        throw new Error("El libro no existe en la base de datos");
      }

      const bookData = bookDoc.data();
      const reservationData = reservationDoc.data();

      if (bookData.quantity <= 0) {
        throw new Error("No hay suficientes copias disponibles");
      }

      // Usar la fecha de devolución de la reserva
      const dueDate = reservationData.dueDate;

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
        dueDate: dueDate, // Usar la fecha de la reserva
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
        dueDate: dueDate, // Usar la fecha de la reserva
        lateReturn: false,
      });
      // Añadir notificación para el usuario
      const notificationRef = doc(
        collection(db, "users", userId, "notifications")
      );
      batch.set(notificationRef, {
        message: `Tu reserva para "${bookData.title}" ha sido aprobada.`,
        createdAt: timestamp,
        read: false,
        type: "reservation_approved",
      });

      // Obtener datos del usuario
      const userDoc = await getDoc(doc(db, "users", userId));
      const userData = userDoc.data();

      // Notificación para todos los administradores
      const adminsSnapshot = await getDocs(
        query(collection(db, "users"), where("role", "==", "admin"))
      );

      adminsSnapshot.docs.forEach((adminDoc) => {
        const adminNotificationRef = doc(
          collection(db, "users", adminDoc.id, "notifications")
        );
        batch.set(adminNotificationRef, {
          message: `Reserva aprobada: "${bookData.title}" para el usuario ${userData.name}`,
          createdAt: timestamp,
          read: false,
          type: "admin_reservation_approved",
        });
      });

      await batch.commit();
      toast.success("Reserva aprobada exitosamente");
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

      // Notificación para el usuario
      const userNotificationRef = doc(
        collection(db, "users", userId, "notifications")
      );
      batch.set(userNotificationRef, {
        message: `Tu reserva para "${bookData.title}" ha sido rechazada.`,
        createdAt: timestamp,
        read: false,
        type: "reservation_rejected",
      });

      // Obtener datos del usuario
      const userDoc = await getDoc(doc(db, "users", userId));
      const userData = userDoc.data();

      // Notificación para todos los administradores
      const adminsSnapshot = await getDocs(
        query(collection(db, "users"), where("role", "==", "admin"))
      );

      adminsSnapshot.docs.forEach((adminDoc) => {
        const adminNotificationRef = doc(
          collection(db, "users", adminDoc.id, "notifications")
        );
        batch.set(adminNotificationRef, {
          message: `Reserva rechazada: "${bookData.title}" para el usuario ${userData.name}`,
          createdAt: timestamp,
          read: false,
          type: "admin_reservation_rejected",
        });
      });

      await batch.commit();
      toast.success("Reserva rechazada exitosamente");
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
      enableSorting: false,
    },
    {
      accessorKey: "name",
      header: "Nombre",
      enableSorting: true,
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
      enableSorting: false,
    },
    {
      accessorKey: "title",
      header: "Título",
      enableSorting: true,
    },
    {
      accessorKey: "author",
      header: "Autor",
      enableSorting: true,
    },
    {
      accessorKey: "publicationDate",
      header: "Fecha de Publicación",
      enableSorting: true,
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
            <SelectItem value="No Disponible">No disponible</SelectItem>
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
    getSortedRowModel: getSortedRowModel(),
    initialState: {
      globalFilter: "",
      pagination: {
        pageSize: 8,
      },
    },
  });

  const booksTable = useReactTable({
    data: data.books,
    columns: bookColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: {
      globalFilter: "",
      pagination: {
        pageSize: 8,
      },
    },
  });

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

  return (
    <div className="md:w-[1920px] min-h-screen md:mx-auto p-6 bg-black bg-opacity-30 backdrop-blur-sm">
      <div className="flex justify-between items-center mb-6">
        {/* <h1 className="text-3xl text-black font-bold border-0 shadow-md shadow-black rounded-lg text-center py-1 px-2 bg-white bg-opacity-100">
          Panel de Administración de la Biblioteca
        </h1> */}
        <div className="rounded-md shadow-md shadow-black">
          <PanelHeader
            panelName="Panel de Administración de la Biblioteca"
            locationName={IconLocation}
          />
        </div>

        <div className="absolute left-[300px]  ml-4 rounded-md shadow-md shadow-black font-semibold  text-black ">
          <WelcomeUser />
        </div>
        <div
          //className="absolute right-[200px] top-[83px] rounded-md shadow-md shadow-black font-semibold hover:border-2 text-black hover:border-black hover:bg-white hover:bg-opacity-100 transition-colors duration-300 bg-white bg-opacity-70"
          className="absolute right-[190px] top-[83px]"
        >
          <NotificationButton
            notifications={notifications}
            onClear={clearNotifications}
          />
        </div>
        {/* <Button
          className="border-0 pl-3 absolute right-6 top-[83px] shadow-md shadow-black font-semibold hover:border-2 text-black hover:border-black hover:bg-white hover:bg-opacity-100 bg-white bg-opacity-70"
          variant="outline"
          onClick={handleLogout}
        >
          <FaPowerOff className="" />
          Cerrar Sesión
        </Button> */}
        <div className="absolute right-6 top-[83px]">
          <LogoutDrawer onLogout={handleLogout} />
        </div>
      </div>

      <Tabs value={location.pathname.split("/").pop()} className="space-y-4">
        <TabsList className="border-0 bg-white bg-opacity-70 backdrop-blur shadow-lg shadow-black">
          <TabsTrigger value="reservations" asChild>
            <NavLink
              onClick={() => handleNavLinkClick("Reservas")}
              to="reservations"
              className="flex  hover:shadow-black hover:shadow-lg hover:bg-white hover:text-black hover:border-0 hover:border-black items-center bg-opacity-90"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              Reservas
            </NavLink>
          </TabsTrigger>
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
          <TabsTrigger value="books" asChild>
            <NavLink
              onClick={() => handleNavLinkClick("Libros")}
              to="books"
              className="flex hover:shadow-black hover:shadow-lg hover:bg-white hover:text-black hover:border-0 hover:border-black items-center bg-opacity-90"
            >
              <BookIcon className="mr-2 h-4 w-4" />
              Libros
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
              loading,
            }}
          />
        </div>
      </Tabs>
    </div>
  );
};

export default memo(AdminPage);
