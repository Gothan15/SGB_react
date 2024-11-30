/* eslint-disable no-unused-vars */
import { useState, useEffect, useContext } from "react";
import { toast } from "sonner";

import UserContext from "../UserContext";
import { Trash2Icon, CalendarIcon } from "lucide-react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  getDocs,
  deleteDoc,
  writeBatch,
} from "firebase/firestore";
import { db, auth } from "@/firebaseConfig";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import LoadinSpinner from "../LoadinSpinner";
import { useLocation } from "react-router-dom";

export default function ReservationHistory() {
  const { userData, loading } = useContext(UserContext);
  const location = useLocation();
  const [reservations, setReservations] = useState([]);

  useEffect(() => {
    if (!auth.currentUser) {
      toast.error("Usuario no autenticado");
      return;
    }

    const historyRef = collection(
      db,
      "users",
      auth.currentUser.uid,
      "reservationHistory"
    );

    const q = query(historyRef, orderBy("returnedAt", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      try {
        const reservations = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setReservations(reservations);
      } catch (err) {
        toast.error("Error al cargar el historial: " + err.message);
      }
    });

    return () => unsubscribe();
  }, [location.pathname]);

  if (loading) {
    return (
      <Card className="border-transparent bg-transparent absolute left-[860px] top-[380px] min-h-screen">
        <CardContent className="flex justify-center items-center min-h-[300px]">
          <LoadinSpinner />
        </CardContent>
      </Card>
    );
  }

  const handleClearHistory = async () => {
    if (!auth.currentUser) {
      toast.error("Usuario no autenticado");
      return;
    }

    try {
      const historyRef = collection(
        db,
        "users",
        auth.currentUser.uid,
        "reservationHistory"
      );
      const querySnapshot = await getDocs(historyRef);

      const batch = writeBatch(db);
      querySnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      toast.success("Historial borrado exitosamente");
    } catch (err) {
      toast.error("Error al borrar el historial: " + err.message);
      console.error("Error al borrar el historial:", err);
    }
  };

  return (
    <Card className="bg-opacity-100 shadow-black shadow-lg backdrop:blur-sm bg-white">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Historial de Reservas</CardTitle>
            <CardDescription>
              Tu historial de reservas de libros.
            </CardDescription>
          </div>
          <Button onClick={handleClearHistory}>
            <Trash2Icon className="mr-2 h-4 w-4" />
            Limpiar Historial
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {reservations.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <div className="rounded-full bg-background/10 p-3">
              <CalendarIcon className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">No hay historial</h3>
            <p className="mb-4 mt-2 text-sm text-muted-foreground">
              No tienes registros de préstamos o devoluciones.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Libro</TableHead>
                <TableHead>Autor</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha de Préstamo</TableHead>
                <TableHead>Fecha de Devolución</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reservations.map((reservation) => (
                <TableRow key={reservation.id}>
                  <TableCell>{reservation.book || reservation.title}</TableCell>
                  <TableCell>{reservation.author}</TableCell>
                  <TableCell>{reservation.status}</TableCell>
                  <TableCell>
                    {reservation.borrowedAt?.toDate().toLocaleDateString() ||
                      "N/A"}
                  </TableCell>
                  <TableCell>
                    {reservation.returnedAt?.toDate().toLocaleDateString() ||
                      "N/A"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
