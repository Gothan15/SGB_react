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
import { Input } from "@/components/ui/input";
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
} from "firebase/firestore";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
} from "@tanstack/react-table";
import { db, auth } from "@/firebaseConfig";
import { toast } from "sonner";
import { BookIcon, ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import BookReservationForm from "../dialogs/book-reservation-form";
import { flexRender } from "@tanstack/react-table";
import LoadinSpinner from "../ui/LoadinSpinner";

function AvailableBooks() {
  const [availableBooks, setAvailableBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const [globalFilter, setGlobalFilter] = useState("");

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

  const columns = React.useMemo(
    () => [
      // {
      //   accessorKey: "id",
      //   header: "ID",
      // },
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
    ],
    []
  );

  const table = useReactTable({
    data: availableBooks,
    columns,
    state: {
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
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

  const handleReservation = async (book, onSuccess, selectedDate) => {
    if (!auth.currentUser) {
      toast.error("Usuario no autenticado");
      return;
    }
    try {
      await addDoc(collection(db, "reservations"), {
        userId: auth.currentUser.uid,
        userName: auth.currentUser.displayName,
        bookId: book.id,
        bookTitle: book.title,
        bookAuthor: book.author,
        status: "pendiente",
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
  };

  function getSortIcon(column) {
    const sorted = column.getIsSorted();
    if (!sorted) {
      return <ChevronsUpDown className="ml-2 h-4 w-4" />;
    }
    if (sorted === "asc") {
      return <ChevronUp className="ml-2 h-4 w-4" />;
    }
    return <ChevronDown className="ml-2 h-4 w-4" />;
  }

  const getStatusBadge = (status) => {
    const statusStyles = {
      Disponible: "bg-green-500 hover:bg-green-600",
      Reservado: "bg-yellow-500 hover:bg-yellow-600",
      Prestado: "bg-red-500 hover:bg-red-600",
    };

    return (
      <Badge className={statusStyles[status] || "bg-gray-500"}>{status}</Badge>
    );
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
    <Card className="bg-gradient-to-br from-white to-gray-200 bg-opacity-100 shadow-black shadow-lg backdrop-blur-sm bg-white">
      <CardHeader>
        <CardTitle>Libros Disponibles</CardTitle>
        <CardDescription>
          Explora y reserva libros disponibles en nuestra biblioteca.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {table.getRowModel().rows.length === 0 ? (
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
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Input
                placeholder="Buscar por título o autor"
                className="max-w-sm"
                value={table.getState().globalFilter ?? ""}
                onChange={(e) => table.setGlobalFilter(e.target.value)}
              />
            </div>
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
                          {cell.column.id === "status"
                            ? getStatusBadge(cell.getValue())
                            : flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext()
                              )}
                        </TableCell>
                      ))}
                      <TableCell></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
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
      </CardContent>
    </Card>
  );
}

export default AvailableBooks;
