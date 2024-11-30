import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
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
import PropTypes from "prop-types";

export function MostRequestedDialog({ data }) {
  return (
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle>Informe de Libros Más Solicitados</DialogTitle>
        <DialogDescription>
          Ranking de los libros más populares basado en el número de solicitudes
        </DialogDescription>
      </DialogHeader>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Título del Libro</TableHead>
            <TableHead>Número de Solicitudes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, index) => (
            <TableRow key={index}>
              <TableCell>{row["Título del Libro"]}</TableCell>
              <TableCell>{row["Número de Solicitudes"]}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Button
        onClick={() => downloadExcel(data, "libros_solicitados.xlsx")}
        className="mt-4"
      >
        <Download className="mr-2 h-4 w-4" />
        Descargar Excel
      </Button>
    </DialogContent>
  );
}
MostRequestedDialog.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      bookTitle: PropTypes.string.isRequired,
      requestCount: PropTypes.number.isRequired,
    })
  ).isRequired,
};
