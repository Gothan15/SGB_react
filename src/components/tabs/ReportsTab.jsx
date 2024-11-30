/* eslint-disable no-unused-vars */
"use client";

import React from "react";

import { useOutletContext } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, BarChart2, Clock, BookOpen, Download } from "lucide-react";
import * as XLSX from "xlsx";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { WaitTimeDialog } from "@/components/dialogs/WaitTimeDialog";
import { MostRequestedDialog } from "@/components/dialogs/MostRequestedDialog";
import { ReservationStatusDialog } from "@/components/dialogs/ReservationStatusDialog";

function ReportsTab() {
  const { data } = useOutletContext();
  const [waitTimeData, setWaitTimeData] = React.useState([]);
  const [mostRequestedData, setMostRequestedData] = React.useState([]);
  const [reservationStatusData, setReservationStatusData] = React.useState([]);

  const generateWaitTimeReport = () => {
    if (!data?.reservations) return;

    const waitTimeData = data.reservations.map((res) => ({
      Usuario: res.userName,
      Libro: res.bookTitle,
      "Fecha Solicitud": res.requestedAt?.toDate().toLocaleDateString(),
      "Fecha Aprobación": res.approvedAt?.toDate().toLocaleDateString(),
      "Tiempo Espera (días)": res.approvedAt
        ? Math.floor(
            (res.approvedAt.toDate() - res.requestedAt.toDate()) /
              (1000 * 60 * 60 * 24)
          )
        : "Pendiente",
    }));
    setWaitTimeData(waitTimeData);
  };

  const generateMostRequestedReport = () => {
    if (!data?.reservations) return;

    const bookRequests = {};
    data.reservations.forEach((res) => {
      bookRequests[res.bookTitle] = (bookRequests[res.bookTitle] || 0) + 1;
    });

    const reportData = Object.entries(bookRequests).map(([book, count]) => ({
      "Título del Libro": book,
      "Número de Solicitudes": count,
    }));
    setMostRequestedData(reportData);
  };

  const generateReservationStatusReport = () => {
    if (!data?.reservations) return;

    const statusCount = data.reservations.reduce((acc, res) => {
      acc[res.status] = (acc[res.status] || 0) + 1;
      return acc;
    }, {});

    const reportData = Object.entries(statusCount).map(([status, count]) => ({
      Estado: status,
      Cantidad: count,
    }));
    setReservationStatusData(reportData);
  };

  const downloadExcel = (data, filename) => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, "Report");
    XLSX.writeFile(wb, filename);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart className="h-6 w-6" />
          Informes y Estadísticas
        </CardTitle>
        <CardDescription>
          Genera informes detallados sobre el uso de la biblioteca
        </CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tiempos de Espera</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Análisis de tiempos de espera para reservas
            </p>
            <Dialog>
              <DialogTrigger asChild>
                <Button onClick={generateWaitTimeReport} className="w-full">
                  <Clock className="mr-2 h-4 w-4" />
                  Generar Informe
                </Button>
              </DialogTrigger>
              <WaitTimeDialog data={waitTimeData} />
            </Dialog>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Libros Más Solicitados</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Ranking de libros más populares
            </p>
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  onClick={generateMostRequestedReport}
                  className="w-full"
                >
                  <BookOpen className="mr-2 h-4 w-4" />
                  Generar Informe
                </Button>
              </DialogTrigger>
              <MostRequestedDialog data={mostRequestedData} />
            </Dialog>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Estado de Reservas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Resumen de estados de reservas
            </p>
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  onClick={generateReservationStatusReport}
                  className="w-full"
                >
                  <BarChart2 className="mr-2 h-4 w-4" />
                  Generar Informe
                </Button>
              </DialogTrigger>
              <ReservationStatusDialog data={reservationStatusData} />
            </Dialog>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
}

// Actualizar PropTypes ya que ahora usamos useOutletContext
ReportsTab.propTypes = {};

export default ReportsTab;
