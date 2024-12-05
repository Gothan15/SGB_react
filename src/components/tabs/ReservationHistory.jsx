/* eslint-disable no-unused-vars */
// Importación de hooks y componentes necesarios
import { useState, useEffect, useContext, useMemo } from "react";
import { toast } from "sonner";

import UserContext from "../UserContext";
import {
  Trash2Icon,
  CalendarIcon,
  ArrowUpDown,
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
import { Badge } from "@/components/ui/badge";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  getPaginationRowModel,
} from "@tanstack/react-table";

export default function ReservationHistory() {
  // Obtener datos del usuario y estado de carga del contexto
  const { userData, loading } = useContext(UserContext);
  const location = useLocation();
  // Estados para manejar las reservas y el ordenamiento
  const [reservations, setReservations] = useState([]);
  const [sorting, setSorting] = useState([]);

  // Función para asignar clases CSS según el estado de la reserva
  const getStatusBadge = (status) => {
    const statusStyles = {
      Devuelto: "bg-green-500 hover:bg-green-600",
      Prestado: "bg-black hover:bg-gray-600",
      Vencido: "bg-red-500 hover:bg-red-600",
      default: "bg-gray-500 hover:bg-gray-600",
    };

    return statusStyles[status] || statusStyles.default;
  };

  // Definición de columnas para la tabla usando useMemo para optimización
  const columns = useMemo(
    () => [
      // Columna para el título del libro
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

  // Configuración de la tabla usando useReactTable
  const table = useReactTable({
    data: reservations,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(), // Agregar este
    initialState: {
      pagination: {
        pageSize: 8,
      },
    },
  });

  // Efecto para cargar y actualizar el historial de reservas
  useEffect(() => {
    // Verificar autenticación del usuario
    if (!auth.currentUser) {
      toast.error("Usuario no autenticado");
      return;
    }

    // Configurar referencia a la colección de historial
    const historyRef = collection(
      db,
      "users",
      auth.currentUser.uid,
      "reservationHistory"
    );

    // Crear query ordenada por fecha de devolución
    const q = query(historyRef, orderBy("returnedAt", "desc"));

    // Suscribirse a cambios en tiempo real
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

    // Limpiar suscripción al desmontar
    return () => unsubscribe();
  }, [location.pathname]);

  // Mostrar spinner durante la carga
  if (loading) {
    return (
      <Card className="border-transparent bg-transparent absolute left-[860px] top-[380px] min-h-screen">
        <CardContent className="flex justify-center items-center min-h-[300px]">
          <LoadinSpinner />
        </CardContent>
      </Card>
    );
  }

  // Función para limpiar todo el historial
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

  // Función para mostrar el ícono de ordenamiento
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

  // Renderizado del componente
  return (
    <Card className="bg-gradient-to-br from-white to-gray-200 bg-opacity-100 shadow-black shadow-lg backdrop:blur-sm bg-white">
      {/* Cabecera de la tarjeta con título y botón de limpieza */}
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

      {/* Contenido principal: tabla o mensaje de no hay datos */}
      <CardContent>
        {reservations.length === 0 ? (
          // Mostrar mensaje cuando no hay historial
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
          // Mostrar tabla con el historial
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
