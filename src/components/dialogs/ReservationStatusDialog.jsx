import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import PropTypes from "prop-types";
import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { downloadExcel } from "@/lib/utils/excel";

export function ReservationStatusDialog({ data }) {
  return (
    <DialogContent className="max-w-xl">
      <DialogHeader>
        <DialogTitle>Informe de Estado de Reservas</DialogTitle>
        <DialogDescription>
          Resumen de los diferentes estados de las reservas de libros
        </DialogDescription>
      </DialogHeader>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Estado</TableHead>
            <TableHead>Cantidad</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, index) => (
            <TableRow key={index}>
              <TableCell>{row.Estado}</TableCell>
              <TableCell>{row.Cantidad}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Button
        onClick={() => downloadExcel(data, "estado_reservas.xlsx")}
        className="mt-4"
      >
        <Download className="mr-2 h-4 w-4" />
        Descargar Excel
      </Button>
    </DialogContent>
  );
}
ReservationStatusDialog.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      status: PropTypes.string.isRequired,
      count: PropTypes.number.isRequired,
    })
  ).isRequired,
};
