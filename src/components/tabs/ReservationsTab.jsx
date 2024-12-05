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
import LoadinSpinner from "../LoadinSpinner";
import { Badge } from "../ui/badge";

const ReservationsTab = () => {
  const { data, handleApproveReservation, handleRejectReservation } =
    useOutletContext();

  if (!data?.pendingReservations) {
    return (
      <Card className="bg-opacity-100 shadow-black shadow-lg backdrop:blur-sm bg-white">
        <CardContent className="flex justify-center items-center min-h-[300px]">
          <LoadinSpinner />
        </CardContent>
      </Card>
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
              .map((reservation) => (
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
