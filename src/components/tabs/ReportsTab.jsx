/* eslint-disable no-unused-vars */
"use client";

import React, { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebaseConfig";

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
  // Eliminar el uso de useOutletContext
  // const { data } = useOutletContext();

  // Estados locales
  const [reservations, setReservations] = useState([]);
  const [waitTimeData, setWaitTimeData] = useState([]);
  const [mostRequestedData, setMostRequestedData] = useState([]);
  const [reservationStatusData, setReservationStatusData] = useState([]);

  useEffect(() => {
    // Obtener datos necesarios desde Firebase
    const fetchReservations = async () => {
      const reservationsSnapshot = await getDocs(
        collection(db, "reservations")
      );
      const reservationsData = reservationsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setReservations(reservationsData);
    };

    fetchReservations();
  }, []);

  // Funciones para generar informes usando los estados locales
  const generateWaitTimeReport = () => {
    if (!reservations.length) return;

    const waitTimeData = reservations.map((res) => ({
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
    if (!reservations.length) return;

    const bookRequests = {};
    reservations.forEach((res) => {
      bookRequests[res.bookTitle] = (bookRequests[res.bookTitle] || 0) + 1;
    });

    const reportData = Object.entries(bookRequests).map(([book, count]) => ({
      "Título del Libro": book,
      "Número de Solicitudes": count,
    }));
    setMostRequestedData(reportData);
  };

  const generateReservationStatusReport = () => {
    if (!reservations.length) return;

    const statusCount = reservations.reduce((acc, res) => {
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
    <Card className="bg-gradient-to-br from-white to-gray-200 bg-opacity-100 shadow-black shadow-lg backdrop:blur-sm bg-white">
      <CardHeader className="p-4 md:p-6">
        <CardTitle className="text-lg md:text-xl">
          Informes y Estadísticas
        </CardTitle>
        <CardDescription className="text-sm md:text-base">
          Genera informes detallados sobre el uso de la biblioteca
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Tarjetas de informes */}
          <Card className="w-full">
            <CardHeader className="p-4">
              <CardTitle className="text-base md:text-lg">
                Tiempos de Espera
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <p className="text-xs md:text-sm text-muted-foreground mb-4">
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

          <Card className="w-full">
            <CardHeader className="p-4">
              <CardTitle className="text-base md:text-lg">
                Libros Más Solicitados
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <p className="text-xs md:text-sm text-muted-foreground mb-4">
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

          <Card className="w-full">
            <CardHeader className="p-4">
              <CardTitle className="text-base md:text-lg">
                Estado de Reservas
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <p className="text-xs md:text-sm text-muted-foreground mb-4">
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
        </div>
      </CardContent>
    </Card>
  );
}

// Actualizar PropTypes ya que ahora usamos useOutletContext
ReportsTab.propTypes = {};

export default ReportsTab;
