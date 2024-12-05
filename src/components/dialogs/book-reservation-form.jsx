"use client";

import PropTypes from "prop-types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BookIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { useState } from "react";
import { toast } from "sonner";

export default function BookReservationForm({ onReserve, book }) {
  const [selectedDate, setSelectedDate] = useState(null);

  // Calcular fecha mínima (hoy) y máxima (20 días después)
  const today = new Date();
  const maxDate = new Date();
  maxDate.setDate(today.getDate() + 20);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedDate) {
      toast.error("Por favor, selecciona una fecha de entrega");
      return;
    }
    onReserve(selectedDate);
  };

  return (
    <Card className="w-full max-w-md border-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookIcon className="h-6 w-6" />
          Confirmación de Reserva
        </CardTitle>
        <CardDescription>
          Selecciona la fecha de entrega (máximo 20 días)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <p>
              <strong>Título:</strong> {book.title}
            </p>
            <p>
              <strong>Autor:</strong> {book.author}
            </p>
          </div>
          <div className="">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              disabled={(date) => date < today || date > maxDate}
              className="rounded-md border flex relative justify-center items-center"
            />
          </div>
          {selectedDate && (
            <p className="text-sm text-muted-foreground">
              Fecha seleccionada: {selectedDate.toLocaleDateString()}
            </p>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button
          className="w-full"
          onClick={handleSubmit}
          disabled={!selectedDate}
        >
          Confirmar Reserva
        </Button>
      </CardFooter>
    </Card>
  );
}

BookReservationForm.propTypes = {
  book: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    author: PropTypes.string.isRequired,
  }).isRequired,
  onReserve: PropTypes.func.isRequired,
};
