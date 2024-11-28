/* eslint-disable no-unused-vars */
import React, { useContext } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription, // Agregamos DialogDescription
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { BookIcon } from "lucide-react";
import BookReservationForm from "../dialogs/book-reservation-form";
import { flexRender } from "@tanstack/react-table";
import UserContext from "../UserContext";

function AvailableBooks() {
  const { table, handleReservation } = useContext(UserContext);

  return (
    <Card className="bg-opacity-100 shadow-black shadow-lg backdrop-blur-sm bg-white">
      <CardHeader>
        <CardTitle>Libros Disponibles</CardTitle>
        <CardDescription>
          Explora y reserva libros disponibles en nuestra biblioteca.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-2 mb-4">
          <Input
            placeholder="Buscar por título o autor"
            className="max-w-sm"
            value={table.getState().globalFilter ?? ""}
            onChange={(e) => table.setGlobalFilter(e.target.value)}
          />
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
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
                  {/* <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <BookIcon className="mr-2 h-4 w-4" />
                          Reservar
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Reservar Libro</DialogTitle>
                          <DialogDescription>
                            Confirma la reserva del libro seleccionado.
                          </DialogDescription>
                        </DialogHeader>
                        <BookReservationForm
                          onReserve={() => handleReservation(row.original)}
                        />
                      </DialogContent>
                    </Dialog>
                  </TableCell> */}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-end space-x-2 py-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Siguiente
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default AvailableBooks;

// Si tenías propTypes, elimínalas
// AvailableBooks.propTypes = {
//   // ...prop definitions...
// };
