/* eslint-disable no-unused-vars */
import { useState, useEffect, useContext } from "react";
import { toast } from "sonner";

import UserContext from "../UserContext";
import { Trash2Icon } from "lucide-react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  getDocs,
  deleteDoc,
  Timestamp,
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

export default function ReservationHistory() {
  const { userData } = useContext(UserContext);
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

        if (snapshot.empty) {
          toast.info("No hay historial de reservas");
        }
      } catch (err) {
        toast.error("Error al cargar el historial: " + err.message);
      }
    });

    return () => unsubscribe();
  }, []);

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

      if (querySnapshot.empty) {
        toast.info("No hay registros para borrar");
        return;
      }

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
    <Card className="bg-opacity-100 shadow-black shadow-lg backdrop-blur-sm bg-white">
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
      </CardContent>
    </Card>
  );
}
