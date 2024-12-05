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
import { BookPlus } from "lucide-react";
import NewBookForm from "../dialogs/new-book-form";
import EditBookForm from "../dialogs/edit-book-form";
import DeleteBookConfirmation from "../dialogs/delete-book-confirmation";
import { useOutletContext } from "react-router-dom";
import { toast } from "sonner";
import LoadinSpinner from "../LoadinSpinner";

const BooksTab = () => {
  const {
    renderTable,
    booksTable,
    ui,
    setUi,
    handleAddBook,
    handleEditBook,
    handleDeleteBook,
  } = useOutletContext();

  if (!booksTable) {
    return (
      <Card className="bg-gradient-to-br from-white to-gray-200 bg-opacity-100 shadow-black shadow-lg backdrop:blur-sm bg-white">
        <CardContent className="flex justify-center items-center min-h-[300px]">
          <LoadinSpinner />
        </CardContent>
      </Card>
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
      <CardContent>
        <div className="">
          {/* <Input placeholder="Buscar por título o autor" />
          <Button>
            <SearchIcon className="h-4 w-4 mr-2" />
            Buscar
          </Button> */}

          <Dialog>
            <DialogTrigger className="absolute right-[65px]" asChild>
              <Button variant="outline" size="">
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
