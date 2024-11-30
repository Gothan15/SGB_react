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

export function WaitTimeDialog({ data }) {
  return (
    <DialogContent className="max-w-5xl max-h-[80vh]">
      <DialogHeader className="mb-4">
        <DialogTitle className="text-xl">
          Informe de Tiempos de Espera
        </DialogTitle>
        <DialogDescription>
          Análisis detallado de los tiempos de espera para las reservas de
          libros
        </DialogDescription>
      </DialogHeader>
      <div className="overflow-auto max-h-[calc(80vh-200px)]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-bold">Usuario</TableHead>
              <TableHead className="font-bold">Libro</TableHead>
              <TableHead className="font-bold whitespace-nowrap">
                Fecha Solicitud
              </TableHead>
              <TableHead className="font-bold whitespace-nowrap">
                Fecha Aprobación
              </TableHead>
              <TableHead className="font-bold whitespace-nowrap">
                Tiempo Espera (días)
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, index) => (
              <TableRow key={index} className="hover:bg-muted/50">
                <TableCell className="py-2">{row.Usuario}</TableCell>
                <TableCell className="py-2">{row.Libro}</TableCell>
                <TableCell className="py-2 whitespace-nowrap">
                  {row["Fecha Solicitud"]}
                </TableCell>
                <TableCell className="py-2 whitespace-nowrap">
                  {row["Fecha Aprobación"]}
                </TableCell>
                <TableCell className="py-2 text-center">
                  {row["Tiempo Espera (días)"]}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <Button
        onClick={() => downloadExcel(data, "tiempos_espera.xlsx")}
        className="mt-4 w-full sm:w-auto"
        variant="outline"
      >
        <Download className="mr-2 h-4 w-4" />
        Descargar Excel
      </Button>
    </DialogContent>
  );
}
WaitTimeDialog.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      userName: PropTypes.string.isRequired,
      bookTitle: PropTypes.string.isRequired,
      requestedAt: PropTypes.instanceOf(Date),
      approvedAt: PropTypes.instanceOf(Date),
    })
  ).isRequired,
};
