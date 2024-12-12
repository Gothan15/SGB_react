import { useOutletContext } from "react-router-dom";
import { CalendarX } from "lucide-react"; // Añadir este import
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
import LoadinSpinner from "../ui/LoadinSpinner";
import { Badge } from "../ui/badge";
//import { useState } from "react";
import { toast } from "sonner";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  query,
  Timestamp,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/firebaseConfig";

const ReservationsTab = () => {
  const {
    data,
    //handleApproveReservation, handleRejectReservation
  } = useOutletContext();

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
        status: "Aceptada",
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
        title: "Reserva Aprobada",
        message: `Tu reserva para "${bookData.title}" ha sido aprobada.`,
        createdAt: timestamp,
        read: false,
        type: "success",
      });

      // Obtener datos del usuario
      const userDoc = await getDoc(doc(db, "users", userId));
      const userData = userDoc.data();

      // Notificación para todos los administradores
      const adminsSnapshot = await getDocs(
        query(collection(db, "users"), where("role", "==", "atm"))
      );

      adminsSnapshot.docs.forEach((adminDoc) => {
        const adminNotificationRef = doc(
          collection(db, "users", adminDoc.id, "notifications")
        );
        batch.set(adminNotificationRef, {
          title: "Nueva Reserva Aprobada",
          message: `Reserva aprobada: "${bookData.title}" para el usuario ${userData.name}`,
          createdAt: timestamp,
          read: false,
          type: "reservation_approved",
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
        status: "Rechazada",
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
        title: "Reserva Rechazada",
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
        query(collection(db, "users"), where("role", "==", "atm"))
      );

      adminsSnapshot.docs.forEach((adminDoc) => {
        const adminNotificationRef = doc(
          collection(db, "users", adminDoc.id, "notifications")
        );
        batch.set(adminNotificationRef, {
          title: "Reserva Rechazada",
          message: `Reserva rechazada: "${bookData.title}" para el usuario ${userData.name}`,
          createdAt: timestamp,
          read: false,
          type: "reservation_rejected",
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

  if (!data?.pendingReservations) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <LoadinSpinner />
      </div>
    );
  }

  // Añadir esta sección para mostrar mensaje cuando no hay reservas
  if (data.pendingReservations.length === 0) {
    return (
      <Card className=" bg-gradient-to-br from-white to-gray-200 bg-opacity-100 shadow-black shadow-lg backdrop:blur-sm bg-white ">
        <CardHeader>
          <CardTitle>Solicitudes de Reservas Pendientes</CardTitle>
          <CardDescription>
            Administra las solicitudes de reservas pendientes.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <CalendarX className="h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">
            No hay solicitudes pendientes
          </h3>
          <p className="text-gray-500 text-center">
            Las nuevas solicitudes de reserva aparecerán aquí cuando los
            usuarios las realicen.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-white to-gray-200 bg-opacity-100 shadow-black shadow-lg backdrop:blur-sm bg-white mt-6">
      <CardHeader>
        <CardTitle>Solicitudes de Reservas Pendientes</CardTitle>
        <CardDescription>
          Administra las solicitudes de reservas pendientes.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID Reserva</TableHead>
              <TableHead>Usuario</TableHead>
              <TableHead>Libro</TableHead>
              <TableHead>Fecha de Solicitud</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.pendingReservations
              .sort((a, b) => a.requestedAt?.toDate() - b.requestedAt?.toDate())
              .map((reservation, index) => (
                <TableRow key={reservation.id}>
                  <TableCell>{reservation.id}</TableCell>
                  <TableCell>{reservation.userName}</TableCell>
                  <TableCell>{reservation.bookTitle}</TableCell>
                  <TableCell>
                    {reservation.requestedAt?.toDate().toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Badge>{reservation.status}</Badge>
                  </TableCell>
                  <TableCell>
                    {reservation.status === "pendiente" && (
                      <div className="flex space-x-2">
                        {index === 0 ? (
                          // Botones habilitados para la primera solicitud
                          <>
                            <Button
                              onClick={() =>
                                handleApproveReservation(
                                  reservation.id,
                                  reservation.bookId,
                                  reservation.userId
                                )
                              }
                              className="bg-green-500 hover:bg-green-700"
                            >
                              Aprobar
                            </Button>
                            <Button
                              onClick={() =>
                                handleRejectReservation(
                                  reservation.id,
                                  reservation.userId,
                                  reservation.bookId
                                )
                              }
                              className="bg-red-500 hover:bg-red-700"
                            >
                              Rechazar
                            </Button>
                          </>
                        ) : (
                          // Botones deshabilitados para el resto de solicitudes
                          <>
                            <Button disabled className="bg-gray-400">
                              Aprobar
                            </Button>
                            <Button disabled className="bg-gray-400">
                              Rechazar
                            </Button>
                          </>
                        )}
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default ReservationsTab;
