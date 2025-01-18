/* eslint-disable no-unused-vars */

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import PropTypes from "prop-types";
import { es } from "date-fns/locale";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BookIcon, CalendarIcon, Loader2 } from "lucide-react";

import { toast } from "sonner";
import { addDays, format } from "date-fns";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

export default function BookReservationForm({ onReserve, book }) {
  const [selectedDate, setSelectedDate] = useState(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate minimum date (today) and maximum date (20 days from now)
  const today = new Date();
  const maxDate = new Date();
  maxDate.setDate(today.getDate() + 20);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedDate) {
      toast.error("Por favor, selecciona una fecha de entrega");
      return;
    }
    setIsSubmitting(true);
    onReserve(selectedDate);
    setTimeout(() => {
      setIsSubmitting(false);
    }, 3000);
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
          {/*
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !selectedDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon />
                {selectedDate ? (
                  format(selectedDate, "PPP")
                ) : (
                  <span>Selecciona una fecha</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent
              align="start"
              className="flex w-auto flex-col space-y-2 p-2"
            >
              <Select
                onValueChange={(value) =>
                  setSelectedDate(addDays(new Date(), parseInt(value)))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent position="popper">
                  <SelectItem value="0">Hoy</SelectItem>
                  <SelectItem value="1">Mañana</SelectItem>
                  <SelectItem value="3">En 3 días</SelectItem>
                  <SelectItem value="7">En 1 semana</SelectItem>
                  <SelectItem value="14">En 2 semanas</SelectItem>
                  <SelectItem value="20">En 20 días(máximo)</SelectItem>
                </SelectContent>
              </Select>
              <div className="rounded-md border">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => date < today || date > maxDate}
                  initialFocus
                />
              </div>
            </PopoverContent>
          </Popover>
          */}
          <DayPicker
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            disabled={(date) => date < today || date > maxDate}
            locale={es}
            className="font-sans flex relative items-center justify-center"
          />
          {selectedDate && (
            <p className="text-sm text-muted-foreground">
              Fecha seleccionada:{" "}
              {format(selectedDate, "PPP", { locale: es }).replace(
                /(\b\w+\b)/g,
                (word) => word.charAt(0).toUpperCase() + word.slice(1)
              )}
            </p>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button
          className="w-full"
          onClick={handleSubmit}
          disabled={!selectedDate || isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Procesando...
            </>
          ) : (
            "Confirmar Reserva"
          )}
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
