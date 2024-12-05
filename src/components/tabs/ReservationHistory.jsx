/* eslint-disable no-unused-vars */
// Importación de hooks y componentes necesarios
import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";

import {
  Trash2Icon,
  CalendarIcon,
  ChevronsUpDown,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  getDocs,
  deleteDoc,
  writeBatch,
  addDoc,
  serverTimestamp,
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
import { Badge } from "@/components/ui/badge";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  getPaginationRowModel,
} from "@tanstack/react-table";

export default function ReservationHistory() {
  const [reservations, setReservations] = useState([]);
  const [sorting, setSorting] = useState([]);
  const [loading, setLoading] = useState(true);

  const getStatusBadge = (status) => {
    const statusStyles = {
      Devuelto: "bg-green-500 hover:bg-green-600",
      Prestado: "bg-black hover:bg-gray-600",
      Vencido: "bg-red-500 hover:bg-red-600",
      default: "bg-gray-500 hover:bg-gray-600",
    };

    return statusStyles[status] || statusStyles.default;
  };

  const columns = useMemo(
    () => [
      {
        accessorFn: (row) => row.book || row.title,
        id: "book",
        header: "Libro",
        cell: (info) => info.getValue(),
      },
      {
        accessorKey: "author",
        header: "Autor",
      },
      {
        accessorKey: "status",
        header: "Estado",
        cell: (info) => (
          <Badge className={getStatusBadge(info.getValue())}>
            {info.getValue()}
          </Badge>
        ),
      },
      {
        accessorKey: "borrowedAt",
        header: "Fecha de Préstamo",
        cell: (info) => info.getValue()?.toDate().toLocaleDateString() || "N/A",
      },
      {
        accessorKey: "returnedAt",
        header: "Fecha de Devolución",
        cell: (info) => info.getValue()?.toDate().toLocaleDateString() || "N/A",
      },
    ],
    []
  );

  const table = useReactTable({
    data: reservations,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 8,
      },
    },
  });

  useEffect(() => {
    if (!auth.currentUser) {
      toast.error("Usuario no autenticado");
      setLoading(false);
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
        const reservationsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setReservations(reservationsData);
        setLoading(false);
      } catch (err) {
        toast.error("Error al cargar el historial: " + err.message);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

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

  const handleClearHistory = async () => {
    if (!auth.currentUser) {
      toast.error("Usuario no autenticado");
      return;
    }

    // Verificar si hay historial para limpiar
    if (reservations.length === 0) {
      toast.warning("No hay historial que limpiar");
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

      // Guardar notificación de limpieza del historial
      await saveNotification(
        "Historial Limpiado",
        "Se ha limpiado todo el historial de préstamos.",
        "info"
      );

      toast.success("Historial borrado exitosamente");
      setReservations([]);
    } catch (err) {
      toast.error("Error al borrar el historial: " + err.message);
      console.error("Error al borrar el historial:", err);
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
    <Card className="bg-gradient-to-br from-white to-gray-200 bg-opacity-100 shadow-black shadow-lg backdrop:blur-sm bg-white">
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
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id}>
                        {header.isPlaceholder ? null : (
                          <div
                            className={
                              header.column.getCanSort()
                                ? "flex cursor-pointer items-center"
                                : ""
                            }
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                            {header.column.getCanSort() &&
                              getSortIcon(header.column)}
                          </div>
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
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
