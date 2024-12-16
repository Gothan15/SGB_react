/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  doc,
  setDoc,
  Timestamp,
  deleteDoc,
} from "firebase/firestore";
import { db, auth } from "@/firebaseConfig";
import { toast } from "sonner";
import { BookIcon, ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import BookReservationForm from "../dialogs/book-reservation-form";
import LoadinSpinner from "../ui/LoadinSpinner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { BookmarkIcon, BookmarkCheck } from "lucide-react";

function AvailableBooks() {
  const [availableBooks, setAvailableBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const [globalFilter, setGlobalFilter] = useState("");
  const [selectedBook, setSelectedBook] = useState(null);
  const [open, setOpen] = useState(false);
  const [futureReadingIds, setFutureReadingIds] = useState([]);

  useEffect(() => {
    const fetchAvailableBooks = async () => {
      try {
        const booksRef = collection(db, "books");
        const booksQuery = query(booksRef, where("status", "==", "Disponible"));
        const booksSnap = await getDocs(booksQuery);
        const books = booksSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setAvailableBooks(books);
        setLoading(false);
      } catch (error) {
        console.error("Error al cargar libros disponibles:", error);
        setLoading(false);
      }
    };

    fetchAvailableBooks();
  }, []);

  useEffect(() => {
    const fetchFutureReadings = async () => {
      if (!auth.currentUser) return;
      try {
        const futureReadingsRef = collection(db, "futureReadings");
        const q = query(
          futureReadingsRef,
          where("userId", "==", auth.currentUser.uid)
        );
        const querySnapshot = await getDocs(q);
        const readings = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          bookId: doc.data().bookId,
        }));
        const bookIds = readings.map((reading) => reading.bookId);
        setFutureReadingIds(bookIds);
      } catch (error) {
        console.error("Error al obtener futuras lecturas:", error);
      }
    };

    fetchFutureReadings();
  }, []);

  const handleReservation = async (book, onSuccess, selectedDate) => {
    if (!auth.currentUser) {
      toast.error("Usuario no autenticado");
      return;
    }

    try {
      // Verificar si el usuario ya tiene una reserva activa para este libro
      const existingReservationsQuery = query(
        collection(db, "reservations"),
        where("userId", "==", auth.currentUser.uid),
        where("bookId", "==", book.id),
        where("status", "in", ["Pendiente", "Aprobado"])
      );
      const existingReservations = await getDocs(existingReservationsQuery);

      if (!existingReservations.empty) {
        toast.error("Ya tienes una reserva activa para este libro");
        return;
      }

      // Verificar el número total de reservas activas del usuario
      const activeReservationsQuery = query(
        collection(db, "reservations"),
        where("userId", "==", auth.currentUser.uid),
        where("status", "in", ["Pendiente", "Aprobado"])
      );
      const activeReservations = await getDocs(activeReservationsQuery);

      if (activeReservations.size >= 3) {
        toast.error("Has alcanzado el límite máximo de 3 reservas activas");
        return;
      }

      // Si pasa las verificaciones, proceder con la reserva
      await addDoc(collection(db, "reservations"), {
        userId: auth.currentUser.uid,
        userName: auth.currentUser.displayName,
        bookId: book.id,
        bookTitle: book.title,
        bookAuthor: book.author,
        status: "Pendiente",
        imageUrl: book.imageUrl,
        requestedAt: Timestamp.fromDate(new Date()),
        dueDate: Timestamp.fromDate(selectedDate),
        processed: false,
      });

      const notificationRef = doc(
        collection(db, "users", auth.currentUser.uid, "notifications")
      );
      await setDoc(notificationRef, {
        title: "Reserva Solicitada",
        message: `Has solicitado el libro "${
          book.title
        }" para entregar el ${selectedDate.toLocaleDateString()}.`,
        createdAt: Timestamp.fromDate(new Date()),
        read: false,
        type: "info",
      });

      toast.success("Solicitud de reserva enviada correctamente", {
        duration: 3000,
        description: `Has solicitado "${
          book.title
        }" para entregar el ${selectedDate.toLocaleDateString()}. Te quedan ${
          2 - activeReservations.size
        } reservas disponibles.`,
      });

      if (onSuccess) onSuccess();
    } catch (error) {
      toast.error("Error al enviar la solicitud de reserva", {
        duration: 3000,
        description: error.message,
      });
      console.error("Error:", error);
    }
  };

  const handleToggleFutureList = async (book) => {
    if (!auth.currentUser) {
      toast.error("Usuario no autenticado");
      return;
    }
    try {
      const futureReadingsRef = collection(db, "futureReadings");
      const q = query(
        futureReadingsRef,
        where("userId", "==", auth.currentUser.uid),
        where("bookId", "==", book.id)
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        // Eliminar de futuras lecturas
        const docId = querySnapshot.docs[0].id;
        await deleteDoc(doc(db, "futureReadings", docId));
        setFutureReadingIds((prev) => prev.filter((id) => id !== book.id));
        toast.success(`"${book.title}" eliminado de futuras lecturas`);
      } else {
        // Agregar a futuras lecturas
        const newReadingRef = await addDoc(collection(db, "futureReadings"), {
          userId: auth.currentUser.uid,
          userEmail: auth.currentUser.email,
          bookId: book.id,
          bookTitle: book.title,
          bookAuthor: book.author,
          bookDescription: book.description,
          imageUrl: book.imageUrl,
          addedAt: Timestamp.fromDate(new Date()),
          status: "pendiente",
        });
        setFutureReadingIds((prev) => [...prev, book.id]);
        toast.success(`"${book.title}" agregado a futuras lecturas`);
      }
    } catch (error) {
      toast.error("Error al actualizar futuras lecturas");
      console.error("Error:", error);
    }
  };

  if (loading) {
    return (
      <Card className="border-transparent bg-transparent absolute left-[860px] top-[380px] min-h-screen">
        <CardContent className="flex justify-center items-center min-h-[300px]">
          <LoadinSpinner />
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      <Card className="bg-gradient-to-br from-white to-gray-200 shadow-lg backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Libros Disponibles</CardTitle>
          <CardDescription>
            Explora y reserva libros disponibles en nuestra biblioteca.
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-y-auto max-h-[570px]">
          {availableBooks.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <div className="rounded-full bg-background/10 p-3">
                <BookIcon className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">
                No hay libros disponibles
              </h3>
              <p className="mb-4 mt-2 text-sm text-muted-foreground">
                No se encontraron libros disponibles para reservar.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {availableBooks.map((book) => (
                <Card
                  key={book.id}
                  className="shadow-lg hover:shadow-2xl transition-shadow duration-300 cursor-pointer md:p-4 p-2"
                >
                  <CardHeader className=" p-0">
                    <img
                      src={book.imageUrl}
                      alt={book.title}
                      className="w-full h-48 object-cover rounded-lg md:h-64"
                      onClick={() => {
                        setSelectedBook(book);
                        setOpen(true);
                      }}
                    />
                  </CardHeader>
                  <CardContent>
                    <CardTitle>{book.title}</CardTitle>
                    <CardDescription>{book.author}</CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedBook && (
        <Sheet
          open={open}
          onOpenChange={(open) => {
            setOpen(open);
            if (!open) setSelectedBook(null);
          }}
        >
          <SheetContent>
            <SheetHeader>
              <SheetTitle>{selectedBook.title}</SheetTitle>
              <SheetDescription>{selectedBook.author}</SheetDescription>
            </SheetHeader>
            <div>
              <img
                src={selectedBook.imageUrl}
                alt={selectedBook.title}
                className="w-full h-64 object-cover mb-4 rounded-lg shadow-lg"
              />
              <p className="text-justify text-gray-700 leading-relaxed mt-4 overflow-auto max-h-[500px] whitespace-pre-line ">
                {selectedBook.description}
              </p>
              <div className="flex space-x-2 mt-4">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <BookIcon className="mr-2 h-4 w-4" />
                      Reservar
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogTitle>Reservar Libro</DialogTitle>
                    <BookReservationForm
                      book={selectedBook}
                      onReserve={(selectedDate) => {
                        handleReservation(
                          selectedBook,
                          () => setOpen(false),
                          selectedDate
                        );
                      }}
                    />
                  </DialogContent>
                </Dialog>
                <Button
                  className={
                    futureReadingIds.includes(selectedBook.id)
                      ? "bg-green-500 text-white font-semibold"
                      : "bg-secondary text-black "
                  }
                  variant={
                    futureReadingIds.includes(selectedBook.id)
                      ? "primary"
                      : "secondary"
                  }
                  onClick={() => handleToggleFutureList(selectedBook)}
                >
                  {futureReadingIds.includes(selectedBook.id) ? (
                    <BookmarkCheck className="mr-2 h-4 w-4" />
                  ) : (
                    <BookmarkIcon className="mr-2 h-4 w-4" />
                  )}
                  {futureReadingIds.includes(selectedBook.id)
                    ? "En futuras lecturas"
                    : "Agregar a futuras lecturas"}
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}

export default AvailableBooks;
