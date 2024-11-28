"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DialogFooter } from "@/components/ui/dialog";
import PropTypes from "prop-types";

export default function BookReservationForm({ onReserve }) {
  const [bookTitle, setBookTitle] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onReserve(); // Este callback ahora incluirá la función para cerrar el diálogo
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="bookTitle" className="text-right">
            Título del Libro
          </Label>
          <Input
            id="bookTitle"
            value={bookTitle}
            onChange={(e) => setBookTitle(e.target.value)}
            className="col-span-3"
          />
        </div>
      </div>
      <DialogFooter>
        <Button type="submit">Reservar</Button>
      </DialogFooter>
    </form>
  );
}

BookReservationForm.propTypes = {
  onReserve: PropTypes.func.isRequired,
};
