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
import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react"; // Añadir estos imports
import BookReservationForm from "../dialogs/book-reservation-form";
import { flexRender } from "@tanstack/react-table";
import UserContext from "../UserContext";
import LoadinSpinner from "../LoadinSpinner";

function AvailableBooks() {
  const { table, handleReservation, loading } = useContext(UserContext);

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
      <Card className="bg-opacity-100 shadow-black shadow-lg backdrop:blur-sm bg-white">
        <CardContent className="flex justify-center items-center min-h-[300px]">
          <LoadinSpinner />
        </CardContent>
      </Card>
    );
  }

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
        {table.getRowModel().rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <div className="rounded-full bg-background/10 p-3">
              <BookIcon className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">
              No hay libros disponibles
            </h3>
            <p className="mb-4 mt-2 text-sm text-muted-foreground">
              No se encontraron libros disponibles para reservar.
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
                        {header.column.getCanSort() ? (
                          <div
                            className="flex cursor-pointer items-center"
                            onClick={() => header.column.toggleSorting()}
                          >
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                            {getSortIcon(header.column)}
                          </div>
                        ) : (
                          flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )
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
        )}
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
