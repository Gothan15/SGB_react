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
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  BookPlus,
  ChevronDown,
  ChevronsUpDown,
  ChevronUp,
  Pencil,
  Trash2,
} from "lucide-react";
import NewBookForm from "../dialogs/new-book-form";
import EditBookForm from "../dialogs/edit-book-form";
import DeleteBookConfirmation from "../dialogs/delete-book-confirmation";
import { useOutletContext } from "react-router-dom";
import { toast } from "sonner";
import LoadinSpinner from "../ui/LoadinSpinner";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/firebaseConfig";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { useCallback } from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Input } from "../ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

const BooksTab = () => {
  const { ui, setUi, data, setData } = useOutletContext();

  // Handlers optimizados usando useCallback
  const handleEditBook = useCallback(
    async (updatedBook) => {
      try {
        const batch = writeBatch(db);
        const bookRef = doc(db, "books", updatedBook.id);

        // Actualizar libro
        batch.update(bookRef, updatedBook);

        // Crear notificación para administradores
        const adminsSnapshot = await getDocs(
          query(collection(db, "users"), where("role", "==", "atm"))
        );
        const timestamp = Timestamp.fromDate(new Date());

        adminsSnapshot.docs.forEach((adminDoc) => {
          const notificationRef = doc(
            collection(db, "users", adminDoc.id, "notifications")
          );
          batch.set(notificationRef, {
            title: "Libro Actualizado",
            message: `Libro actualizado: "${updatedBook.title}"`,
            type: "info",
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
    },
    [setData]
  );

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
        query(collection(db, "users"), where("role", "==", "atm"))
      );
      const timestamp = Timestamp.fromDate(new Date());

      adminsSnapshot.docs.forEach((adminDoc) => {
        const notificationRef = doc(
          collection(db, "users", adminDoc.id, "notifications")
        );
        batch.set(notificationRef, {
          title: "Libro Eliminado",
          message: `Libro eliminado: "${bookData.title}"`,
          type: "error",
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
        query(collection(db, "users"), where("role", "==", "atm"))
      );
      const timestamp = Timestamp.fromDate(new Date());

      adminsSnapshot.docs.forEach((adminDoc) => {
        const notificationRef = doc(
          collection(db, "users", adminDoc.id, "notifications")
        );
        batch.set(notificationRef, {
          title: "Nuevo Libro Añadido",
          message: `Nuevo libro añadido: "${newBook.title}" por ${newBook.author}`,
          type: "success",
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

  const handleStatusChange = async (itemId, newValue, itemType) => {
    console.log(`Cambiando estado de ${itemType} ${itemId} a ${newValue}`); // Console log agregado
    try {
      switch (itemType) {
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
      }
    } catch (error) {
      console.error(`Error al cambiar estado de ${itemType}:`, error);
    }
  };

  // Definición de columnas para la tabla de libros
  const bookColumns = [
    {
      accessorKey: "imageUrl",
      header: "Portada",
      enableSorting: false,
      cell: ({ row }) => (
        <Avatar className="w-12 h-12">
          <AvatarImage src={row.original.imageUrl} alt={row.original.title} />
          <AvatarFallback>
            {row.original.title.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      ),
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

  const handleSearch = (value, tableType) => {
    if (tableType === "books") {
      booksTable.setGlobalFilter(value);
    }
  };

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
        pageSize: 6,
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
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={table.getAllColumns().length}
                  className="text-center"
                >
                  No hay {tableType === "books" ? "libros" : "elementos"}{" "}
                  disponibles.
                </TableCell>
              </TableRow>
            )}
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

  if (!booksTable) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <LoadinSpinner />
      </div>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-white to-gray-200  bg-opacity-100 shadow-black shadow-lg backdrop:blur-sm bg-white">
      <CardHeader>
        <CardTitle>Gestión de Libros</CardTitle>
        <CardDescription>
          Administra el catálogo de libros de la biblioteca.
        </CardDescription>
      </CardHeader>
      <CardContent className=" overflow-y-auto max-h-[570px]">
        <div className="">
          <Dialog>
            <DialogTrigger className="absolute right-[65px]" asChild>
              <Button size="sm">
                <BookPlus className="h-4 w-4" />
                Agregar Nuevo Libro
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Agregar Nuevo Libro</DialogTitle>
                <DialogDescription>
                  Añade un nuevo libro al catálogo.
                </DialogDescription>
              </DialogHeader>
              <NewBookForm
                onSave={(data) => {
                  handleAddBook(data);
                  toast.success("Libro agregado exitosamente");
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
        {renderTable(booksTable, "books")}

        {/* Modal de edición */}
        {ui.editingBook && (
          <Dialog
            open={!!ui.editingBook}
            onOpenChange={() =>
              setUi((prev) => ({ ...prev, editingBook: null }))
            }
          >
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Editar Libro</DialogTitle>
                <DialogDescription>
                  Realiza cambios en los detalles del libro.
                </DialogDescription>
              </DialogHeader>
              <EditBookForm
                book={ui.editingBook}
                onSave={(data) => {
                  handleEditBook(data);
                  toast.success("Libro actualizado exitosamente");
                  setUi((prev) => ({ ...prev, editingBook: null }));
                }}
                onCancel={() =>
                  setUi((prev) => ({ ...prev, editingBook: null }))
                }
              />
            </DialogContent>
          </Dialog>
        )}

        {/* Modal de eliminación */}
        {ui.deletingBook && (
          <Dialog
            open={!!ui.deletingBook}
            onOpenChange={() =>
              setUi((prev) => ({ ...prev, deletingBook: null }))
            }
          >
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Eliminar Libro</DialogTitle>
                <DialogDescription>
                  Esta acción no se puede deshacer. Esto eliminará
                  permanentemente el libro.
                </DialogDescription>
              </DialogHeader>
              <DeleteBookConfirmation
                bookTitle={ui.deletingBook.title}
                onConfirm={() => {
                  handleDeleteBook(ui.deletingBook.id);
                  toast.success("Libro eliminado exitosamente");
                  setUi((prev) => ({ ...prev, deletingBook: null }));
                }}
                onCancel={() =>
                  setUi((prev) => ({ ...prev, deletingBook: null }))
                }
              />
            </DialogContent>
          </Dialog>
        )}
      </CardContent>
    </Card>
  );
};

export default BooksTab;
