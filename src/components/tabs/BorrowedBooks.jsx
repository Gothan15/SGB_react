import React, { useContext } from "react";
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
import { RefreshCw, BookOpenIcon, ArrowLeftRight } from "lucide-react";
import BookReturnForm from "../dialogs/book-return-form";
import ReservationRenewalForm from "../dialogs/reservation-renewal-form";
import { Timestamp } from "firebase/firestore";
import UserContext from "../UserContext";
import LoadinSpinner from "../LoadinSpinner";

function BorrowedBooks() {
  const { userData, handleRenewal, handleReturn, loading } =
    useContext(UserContext);
  // eslint-disable-next-line no-unused-vars
  const [showRenewalDialog, setShowRenewalDialog] = React.useState(false);

  if (loading) {
    return (
      <Card className="bg-opacity-100 shadow-black shadow-lg backdrop:blur-sm bg-white">
        <CardContent className="flex justify-center items-center min-h-[300px]">
          <LoadinSpinner />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-opacity-100 shadow-black shadow-lg backdrop-blur-sm bg-white">
      <CardHeader>
        <CardTitle>Libros Prestados</CardTitle>
        <CardDescription>
          Libros que tienes actualmente en préstamo y solicitudes pendientes.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {userData.pendingReservations.length === 0 &&
        userData.borrowedBooks.length === 0 ? (
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
            {userData.pendingReservations.length > 0 && (
              <>
                <h3 className="text-lg font-semibold mb-4">
                  Solicitudes Pendientes
                </h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Título</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Fecha de Solicitud</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userData.pendingReservations.map((reservation) => (
                      <TableRow key={reservation.id}>
                        <TableCell>{reservation.bookTitle}</TableCell>
                        <TableCell>{reservation.status}</TableCell>
                        <TableCell>
                          {reservation.requestedAt instanceof Timestamp
                            ? reservation.requestedAt
                                .toDate()
                                .toLocaleDateString()
                            : "Fecha no disponible"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </>
            )}

            {userData.borrowedBooks.length > 0 && (
              <>
                <h3 className="text-lg font-semibold my-4">
                  Libros Prestados Actualmente
                </h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Título</TableHead>
                      <TableHead>Autor</TableHead>
                      <TableHead>Fecha de Devolución</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userData.borrowedBooks.map((book) => (
                      <TableRow key={book.id}>
                        <TableCell>{book.id}</TableCell>
                        <TableCell>{book.title}</TableCell>
                        <TableCell>{book.author}</TableCell>
                        <TableCell>
                          {book.dueDate
                            ? book.dueDate.toDate().toLocaleDateString()
                            : "Fecha no disponible"}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button size="sm" variant="outline">
                                  <RefreshCw className="mr-2 h-4 w-4" />
                                  Renovar
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Renovar Préstamo</DialogTitle>
                                  <DialogDescription>
                                    ¿Estás seguro de que deseas renovar el
                                    préstamo de este libro?
                                  </DialogDescription>
                                </DialogHeader>
                                <ReservationRenewalForm
                                  book={book}
                                  onRenew={handleRenewal}
                                  onClose={() => setShowRenewalDialog(false)}
                                />
                              </DialogContent>
                            </Dialog>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button size="sm" variant="outline">
                                  <ArrowLeftRight className="mr-2 h-4 w-4" />
                                  Devolver
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Devolver Libro</DialogTitle>
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
