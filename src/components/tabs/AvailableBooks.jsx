/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
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
  getDoc,
} from "firebase/firestore";
import { db, auth } from "@/firebaseConfig";
import { toast } from "sonner";
import { BookIcon, SearchIcon, XIcon, Loader2 } from "lucide-react"; // Añadir import de SearchIcon
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
import { Input } from "@/components/ui/input"; // Añadir import de Input
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { motion } from "framer-motion";
import { Search, Heart, Star, ChevronLeft, ChevronRight } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// const categories = [
//   { icon: "📚", label: "Todos" },
//   { icon: "🎭", label: "Drama" },
//   { icon: "🔍", label: "Misterio" },
//   { icon: "💕", label: "Romance" },
//   { icon: "🚀", label: "Sci-Fi" },
//   { icon: "🎨", label: "Arte" },
//   { icon: "📖", label: "Historia" },
//   { icon: "🎬", label: "Biografías" },
//   { icon: "🌍", label: "Viajes" },
//   { icon: "👔", label: "Negocios" },
//   { icon: "🧠", label: "Psicología" },
//   { icon: "📱", label: "Tecnología" },
// ];

function AvailableBooks() {
  const [availableBooks, setAvailableBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const [globalFilter, setGlobalFilter] = useState("");
  const [selectedBook, setSelectedBook] = useState(null);
  const [open, setOpen] = useState(false);
  const [futureReadingIds, setFutureReadingIds] = useState([]);
  const [filterQuery, setFilterQuery] = useState(""); // Reemplazar filterTitle y filterAuthor
  const [isProcessingReservation, setIsProcessingReservation] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [favorites, setFavorites] = useState([]);
  const [booksPerPage, setBooksPerPage] = useState(8);
  const [currentPage, setCurrentPage] = useState(1);

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
    setIsProcessingReservation(true);
    if (!auth.currentUser) {
      toast.error("Usuario no autenticado");
      return;
    }

    try {
      // Obtener el estado actual del libro desde la base de datos
      const bookRef = doc(db, "books", book.id);
      const bookDoc = await getDoc(bookRef);
      const bookData = bookDoc.data();

      if (bookData.status === "Prestado") {
        toast.error("El libro ya está prestado y no puede ser reservado");
        return;
      }

      // Verificar el número de libros prestados por el usuario
      const borrowedBooksRef = collection(
        db,
        "users",
        auth.currentUser.uid,
        "borrowedBooks"
      );
      const borrowedBooksSnapshot = await getDocs(borrowedBooksRef);

      if (borrowedBooksSnapshot.size >= 6) {
        toast.error("Has alcanzado el límite máximo de 6 libros prestados");
        return;
      }

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
    } finally {
      setTimeout(() => {
        setIsProcessingReservation(false);
      }, 3000);
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

  const filteredBooks = availableBooks.filter((book) => {
    const query = filterQuery.toLowerCase();
    return (
      book.title.toLowerCase().includes(query) ||
      book.author.toLowerCase().includes(query)
    );
  });

  const toggleFavorite = (bookId) => {
    setFavorites((prev) =>
      prev.includes(bookId)
        ? prev.filter((id) => id !== bookId)
        : [...prev, bookId]
    );
    toast.success("Lista de favoritos actualizada");
  };

  // Calcular índices para paginación
  const indexOfLastBook = currentPage * booksPerPage;
  const indexOfFirstBook = indexOfLastBook - booksPerPage;
  const currentBooks = filteredBooks.slice(indexOfFirstBook, indexOfLastBook);
  const totalPages = Math.ceil(filteredBooks.length / booksPerPage);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 },
  };

  if (loading) return <LoadinSpinner />;

  return (
    <div className="h-[calc(100vh-285px)] bg-gradient-to-b from-white to-gray-100 overflow-hidden">
      {/* Search and Categories Container */}
      <div className="h-[100px]">
        {/* Search Bar */}
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b shadow-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
              <Input
                type="text"
                placeholder="Buscar por título o autor"
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                className="pl-10 h-12 text-lg bg-white border-gray-300 rounded-full focus:border-blue-600 focus:ring-blue-600 text-gray-900 placeholder-gray-500"
              />
            </div>
          </div>
        </div>

        {/* Categories */}
        {/* <div className="border-b bg-white/50">
          <div className="container mx-auto px-4">
            <ScrollArea className="w-full whitespace-nowrap">
              <div className="flex w-max space-x-4 p-4">
                {categories.map((category) => (
                  <Button
                    key={category.label}
                    variant="ghost"
                    className={`flex items-center space-x-2 rounded-full px-4 py-2 text-sm font-medium transition-colors
                    ${
                      selectedCategory === category.label
                        ? "bg-gray-900 text-white hover:bg-gray-800"
                        : "hover:bg-gray-100"
                    }`}
                    onClick={() => setSelectedCategory(category.label)}
                  >
                    <span>{category.icon}</span>
                    <span>{category.label}</span>
                  </Button>
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>
        </div> */}
      </div>

      {/* Main Content Area with Fixed Height */}
      <div className="h-[calc(100%-100px)] overflow-y-auto">
        {/* Controles de visualización */}
        <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-3">
            <div className="flex justify-between items-center">
              <p className="text-sm font-medium text-gray-700">
                Mostrando {indexOfFirstBook + 1}-
                {Math.min(indexOfLastBook, filteredBooks.length)} de{" "}
                {filteredBooks.length} libros
              </p>
              <div className="flex items-center gap-4">
                <Select
                  value={booksPerPage.toString()}
                  onValueChange={(value) => {
                    setBooksPerPage(Number(value));
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-[180px] bg-white text-gray-900">
                    <SelectValue placeholder="Libros por página" />
                  </SelectTrigger>
                  <SelectContent>
                    {[8, 16, 32, 64].map((number) => (
                      <SelectItem key={number} value={number.toString()}>
                        {number} libros por página
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {/* Books Grid with Scrollable Container */}
        <div className="container mx-auto px-4 py-4">
          {currentBooks.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8"
            >
              <p className="text-gray-700 font-medium text-lg">
                No se encontraron libros disponibles
              </p>
            </motion.div>
          ) : (
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 auto-rows-max"
            >
              {currentBooks.map((book) => (
                <motion.div
                  key={book.id}
                  variants={item}
                  whileHover={{ scale: 1.03 }}
                  className="group relative bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300"
                >
                  <div className="relative aspect-[4/3] overflow-hidden rounded-t-xl">
                    <img
                      src={book.imageUrl}
                      alt={book.title}
                      className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
                      onClick={() => {
                        setSelectedBook(book);
                        setOpen(true);
                      }}
                    />
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      className="absolute right-3 top-3"
                    >
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 rounded-full bg-white/90 backdrop-blur-sm hover:bg-white shadow-md"
                        onClick={() => handleToggleFutureList(book)}
                      >
                        {futureReadingIds.includes(book.id) ? (
                          <BookmarkCheck className="fill-green-600 text-green-600" />
                        ) : (
                          <BookmarkIcon className="text-gray-700" />
                        )}
                      </Button>
                    </motion.div>
                  </div>

                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 line-clamp-1 text-lg">
                      {book.title}
                    </h3>
                    <p className="text-sm text-gray-600 line-clamp-1 mt-1">
                      {book.author}
                    </p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>

        {/* Pagination at bottom */}
        <div className="sticky bottom-0 bg-white/90 backdrop-blur-sm py-4">
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 pb-8">
              <Button
                variant="outline"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="text-gray-700 border-gray-300 hover:bg-gray-100"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      onClick={() => setCurrentPage(page)}
                      className={`w-10 ${
                        currentPage === page
                          ? "bg-black text-white hover:bg-black"
                          : "text-gray-700 border-gray-300 hover:bg-gray-100"
                      }`}
                    >
                      {page}
                    </Button>
                  )
                )}
              </div>
              <Button
                variant="outline"
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className="text-gray-700 border-gray-300 hover:bg-gray-100"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {selectedBook && (
        <Sheet
          open={open}
          onOpenChange={(open) => {
            setOpen(open);
            if (!open) setSelectedBook(null);
          }}
        >
          <SheetContent className="w-full max-w-lg sm:max-w-xl md:max-w-2xl lg:max-w-3xl h-full md:h-auto overflow-auto bg-white">
            <SheetHeader>
              <SheetTitle className="text-2xl font-bold text-gray-900">
                {selectedBook.title}
              </SheetTitle>
              <SheetDescription className="text-gray-600 text-lg">
                {selectedBook.author}
              </SheetDescription>
            </SheetHeader>
            <div className="overflow-auto mt-6">
              <img
                src={selectedBook.imageUrl}
                alt={selectedBook.title}
                className="w-full h-64 object-cover mb-6 rounded-lg shadow-lg"
              />
              <p className="text-justify text-gray-700 leading-relaxed whitespace-pre-line text-base">
                {"  "}
                {selectedBook.description}
              </p>
              <div className="flex space-x-2 mt-4">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" disabled={isProcessingReservation}>
                            {isProcessingReservation ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Procesando...
                              </>
                            ) : (
                              <>
                                <BookIcon className="mr-2 h-4 w-4" />
                                Reservar
                              </>
                            )}
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
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Realizar una reserva de este libro</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
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
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Agregar o quitar de tu lista de lecturas futuras</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}

export default AvailableBooks;
