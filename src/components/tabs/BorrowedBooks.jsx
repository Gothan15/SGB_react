import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { RefreshCw, BookOpenIcon, ArrowLeftRight, X } from "lucide-react";
import BookReturnForm from "../dialogs/book-return-form";
import ReservationRenewalForm from "../dialogs/reservation-renewal-form";
import {
  collection,
  doc,
  getDocs,
  updateDoc,
  deleteDoc,
  Timestamp,
  query,
  where,
  writeBatch,
  increment,
  addDoc,
  serverTimestamp,
  getDoc,
} from "firebase/firestore";
import { db, auth } from "@/firebaseConfig";
import { toast } from "sonner";
import LoadinSpinner from "../ui/LoadinSpinner";
import { Badge } from "../ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

function BorrowedBooks() {
  const [borrowedBooks, setBorrowedBooks] = useState([]);
  const [pendingReservations, setPendingReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  // eslint-disable-next-line no-unused-vars
  const [showRenewalDialog, setShowRenewalDialog] = React.useState(false);

  // Efecto para cargar los libros prestados y reservas pendientes
  useEffect(() => {
    const fetchUserData = async () => {
      if (!auth.currentUser) {
        setLoading(false);
        return;
      }

      try {
        // Obtener libros prestados
        const borrowedBooksRef = collection(
          db,
          "users",
          auth.currentUser.uid,
          "borrowedBooks"
        );
        const borrowedBooksSnap = await getDocs(borrowedBooksRef);
        const borrowedBooksData = borrowedBooksSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setBorrowedBooks(borrowedBooksData);

        // Obtener reservas pendientes
        const reservationsRef = collection(db, "reservations");
        const reservationsQuery = query(
          reservationsRef,
          where("userId", "==", auth.currentUser.uid),
          where("status", "==", "Pendiente")
        );
        const reservationsSnap = await getDocs(reservationsQuery);
        const pendingReservationsData = reservationsSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setPendingReservations(pendingReservationsData);

        setLoading(false);
      } catch (error) {
        console.error("Error al cargar datos del usuario:", error);
        setLoading(false);
      }
    };

    fetchUserData();
  }, [location.pathname]);

  // Función auxiliar para guardar notificaciones
  const saveNotification = async (title, message, type) => {
    try {
      const notificationsRef = collection(
        db,
        "users",
        auth.currentUser.uid,
        "notifications"
      );
      await addDoc(notificationsRef, {
        title,
        message,
        type,
        read: false,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error al guardar la notificación:", error);
    }
  };

  // Función para manejar la renovación
  const handleRenewal = async (bookId, newDueDate) => {
    try {
      const borrowedBookRef = doc(
        db,
        "users",
        auth.currentUser.uid,
        "borrowedBooks",
        bookId
      );

      // Obtener el documento actual para verificar renewalCount
      const bookDoc = await getDoc(borrowedBookRef);
      const bookData = bookDoc.data();

      if (bookData.renewalCount && bookData.renewalCount >= 1) {
        toast.error(
          "Ya has renovado este libro el máximo de veces permitido (1)"
        );
        return;
      }

      await updateDoc(borrowedBookRef, {
        dueDate: newDueDate,
        renewalCount: (bookData.renewalCount || 0) + 1,
      });

      // Actualizar el estado local
      setBorrowedBooks((prevBooks) =>
        prevBooks.map((book) =>
          book.id === bookId
            ? {
                ...book,
                dueDate: newDueDate,
                renewalCount: (book.renewalCount || 0) + 1,
              }
            : book
        )
      );

      const book = borrowedBooks.find((b) => b.id === bookId);
      await saveNotification(
        "Préstamo Renovado",
        `El préstamo del libro "${book.title}" ha sido renovado exitosamente.`,
        "success"
      );

      toast.success("Préstamo renovado exitosamente");
    } catch (error) {
      console.error("Error al renovar el préstamo:", error);
      toast.error("Error al renovar el préstamo");
    }
  };

  // Función para manejar la devolución
  const handleReturn = async (book) => {
    try {
      const batch = writeBatch(db);

      const borrowedBookRef = doc(
        db,
        "users",
        auth.currentUser.uid,
        "borrowedBooks",
        book.id
      );

      const bookRef = doc(db, "books", book.bookId || book.id);
      const timestamp = Timestamp.fromDate(new Date());

      // Actualizar el estado y la cantidad del libro
      batch.update(bookRef, {
        quantity: increment(1),
        status: "Disponible",
      });

      // Eliminar el libro de la lista de prestados del usuario
      batch.delete(borrowedBookRef);

      // Buscar primero el registro en el historial
      const historyRef = collection(
        db,
        "users",
        auth.currentUser.uid,
        "reservationHistory"
      );
      const historyQuery = query(
        historyRef,
        where("borrowedAt", "==", book.borrowedAt)
      );
      const historySnapshot = await getDocs(historyQuery);

      // Si existe, actualizar el registro existente. Si no, crear uno nuevo
      if (!historySnapshot.empty) {
        const existingDoc = historySnapshot.docs[0];
        batch.update(existingDoc.ref, {
          status: "Devuelto",
          returnedAt: timestamp,
        });
      } else {
        // Si por alguna razón no existe el registro, crear uno nuevo
        const newHistoryRef = doc(historyRef, book.id);
        batch.set(newHistoryRef, {
          ...book,
          status: "Devuelto",
          returnedAt: timestamp,
        });
      }

      await batch.commit();

      await saveNotification(
        "Libro Devuelto",
        `El libro "${book.title}" ha sido devuelto exitosamente.`,
        "info"
      );

      toast.success("Libro devuelto exitosamente");

      setBorrowedBooks((prevBooks) =>
        prevBooks.filter((b) => b.id !== book.id)
      );
    } catch (error) {
      console.error("Error al devolver el libro:", error);
      toast.error("Error al devolver el libro");
    }
  };

  // Función para manejar la cancelación de la reserva
  const handleCancelReservation = async (reservationId, bookTitle) => {
    try {
      const reservationRef = doc(db, "reservations", reservationId);
      await deleteDoc(reservationRef);

      toast.success(`Reserva de "${bookTitle}" cancelada`);

      // Actualizar el estado local
      setPendingReservations((prevReservations) =>
        prevReservations.filter((r) => r.id !== reservationId)
      );
    } catch (error) {
      console.error("Error al cancelar la reserva:", error);
      toast.error("Error al cancelar la reserva");
    }
  };

  if (loading) {
    return (
      <Card className="border-transparent bg-transparent relative justify-center items-center flex min-h-auto  ">
        <CardContent className="flex justify-center items-center min-h-[300px]">
          <LoadinSpinner />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-white to-gray-200 shadow-lg backdrop-blur-sm md:p-6 p-4">
      <CardHeader>
        <CardTitle>Libros Prestados</CardTitle>
        <CardDescription>
          Libros que tienes actualmente en préstamo y solicitudes pendientes.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {pendingReservations.length === 0 && borrowedBooks.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <div className="rounded-full bg-background/10 p-3">
              <BookOpenIcon className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">
              No hay libros prestados
            </h3>
            <p className="mb-4 mt-2 text-sm text-muted-foreground">
              No tienes libros prestados ni solicitudes pendientes.
            </p>
          </div>
        ) : (
          <>
            {pendingReservations.length > 0 && (
              <>
                <h3 className="text-lg font-semibold mb-4">
                  Solicitudes Pendientes
                </h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[60px]">Libro</TableHead>
                      <TableHead>Título</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Fecha de Solicitud</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className=" overflow-y-auto max-h-[200px]">
                    {pendingReservations.map((reservation) => (
                      <TableRow key={reservation.id}>
                        <TableCell>
                          <Avatar>
                            <AvatarImage
                              src={reservation.imageUrl}
                              alt={reservation.bookTitle}
                            />
                            <AvatarFallback>📚</AvatarFallback>
                          </Avatar>
                        </TableCell>
                        <TableCell>{reservation.bookTitle}</TableCell>
                        <TableCell>
                          <Badge>{reservation.status}</Badge>
                        </TableCell>
                        <TableCell>
                          {reservation.requestedAt instanceof Timestamp
                            ? reservation.requestedAt
                                .toDate()
                                .toLocaleDateString()
                            : "Fecha no disponible"}
                        </TableCell>
                        <TableCell>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      className="w-full md:w-auto"
                                    >
                                      <X className="mr-2 h-4 w-4" />
                                      Cancelar
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>
                                        Cancelar Reserva
                                      </DialogTitle>
                                      <DialogDescription>
                                        ¿Estás seguro de que deseas cancelar
                                        esta reserva?
                                      </DialogDescription>
                                    </DialogHeader>
                                    <div className="flex justify-end space-x-2">
                                      <Button
                                        variant="outline"
                                        className="w-full md:w-auto"
                                        onClick={(e) => e.preventDefault()}
                                      >
                                        No
                                      </Button>
                                      <Button
                                        className="hover:bg-gradient-to-l hover:border-black hover:font-semibold from-red-700 transition-colors duration-200 to-black w-full md:w-auto"
                                        onClick={() =>
                                          handleCancelReservation(
                                            reservation.id,
                                            reservation.bookTitle
                                          )
                                        }
                                      >
                                        Sí, cancelar
                                      </Button>
                                    </div>
                                  </DialogContent>
                                </Dialog>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Cancelar la reserva pendiente</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </>
            )}

            {borrowedBooks.length > 0 && (
              <>
                <h3 className="text-lg font-semibold my-4">
                  Libros Reservados Actualmente
                </h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[60px]">Libro</TableHead>
                      <TableHead>Título</TableHead>
                      <TableHead>Autor</TableHead>
                      <TableHead>Fecha de Devolución</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="overflow-y-auto max-h-[570px]">
                    {borrowedBooks.map((book) => (
                      <TableRow key={book.id}>
                        <TableCell>
                          <Avatar>
                            <AvatarImage src={book.imageUrl} alt={book.title} />
                            <AvatarFallback>📚</AvatarFallback>
                          </Avatar>
                        </TableCell>
                        <TableCell>{book.title}</TableCell>
                        <TableCell>{book.author}</TableCell>
                        <TableCell>
                          {book.dueDate
                            ? book.dueDate.toDate().toLocaleDateString()
                            : "Fecha no disponible"}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button
                                        className="w-full md:w-auto"
                                        size="sm"
                                      >
                                        <RefreshCw className="mr-2 h-4 w-4" />
                                        Renovar
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                      <DialogHeader>
                                        <DialogTitle>
                                          Renovar Préstamo
                                        </DialogTitle>
                                        <DialogDescription>
                                          ¿Estás seguro de que deseas renovar el
                                          préstamo de este libro?
                                        </DialogDescription>
                                      </DialogHeader>
                                      <ReservationRenewalForm
                                        book={book}
                                        onRenew={handleRenewal}
                                        onClose={() =>
                                          setShowRenewalDialog(false)
                                        }
                                      />
                                    </DialogContent>
                                  </Dialog>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Renovar el período de préstamo</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>

                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button
                                        className="w-full md:w-auto"
                                        size="sm"
                                      >
                                        <ArrowLeftRight className="mr-2 h-4 w-4" />
                                        Devolver
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                      <DialogHeader>
                                        <DialogTitle>
                                          Devolver Libro
                                        </DialogTitle>
                                        <DialogDescription>
                                          Confirma la devolución del libro.
                                        </DialogDescription>
                                      </DialogHeader>
                                      <BookReturnForm
                                        book={book}
                                        onReturn={handleReturn}
                                      />
                                    </DialogContent>
                                  </Dialog>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Devolver el libro a la biblioteca</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default BorrowedBooks;
