"use client";
import PropTypes from "prop-types";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DialogFooter } from "@/components/ui/dialog";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

export default function EditBookForm({ book, onSave, onCancel }) {
  const [formData, setFormData] = useState(book);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleStatusChange = (value) => {
    setFormData({ ...formData, status: value });
  };

  const handleIsbnChange = (value) => {
    // Solo permitir números
    const numbersOnly = value.replace(/[^0-9]/g, "");
    setFormData({ ...formData, isbn: numbersOnly });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      quantity: parseInt(formData.quantity), // Asegurar que la cantidad sea un número
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="title" className="text-right">
            Título
          </Label>
          <Input
            id="title"
            value={formData.title}
            onChange={handleChange}
            className="col-span-3"
          />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="author" className="text-right">
            Autor
          </Label>
          <Input
            id="author"
            value={formData.author}
            onChange={handleChange}
            className="col-span-3"
          />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="isbn" className="text-right">
            ISBN
          </Label>
          <div className="col-span-3">
            <InputOTP
              value={formData.isbn}
              onChange={handleIsbnChange}
              maxLength={5}
              render={({ slots }) => (
                <InputOTPGroup>
                  {slots.map((slot, index) => (
                    <InputOTPSlot key={index} {...slot} className="w-9" />
                  ))}
                </InputOTPGroup>
              )}
            />
          </div>
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="status" className="text-right">
            Estado
          </Label>
          <Select value={formData.status} onValueChange={handleStatusChange}>
            <SelectTrigger className="col-span-3">
              <SelectValue placeholder="Selecciona el estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Disponible">Disponible</SelectItem>
              <SelectItem value="Prestado">Prestado</SelectItem>
              <SelectItem value="En reparación">En reparación</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="quantity" className="text-right">
            Cantidad
          </Label>
          <Input
            id="quantity"
            type="number"
            value={formData.quantity}
            onChange={handleChange}
            className="col-span-3"
          />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="publicationDate" className="text-right">
            Fecha de Publicación
          </Label>
          <Input
            id="publicationDate"
            type="date"
            value={formData.publicationDate}
            onChange={handleChange}
            className="col-span-3"
          />
        </div>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">Guardar cambios</Button>
      </DialogFooter>
    </form>
  );
}
EditBookForm.propTypes = {
  book: PropTypes.shape({
    title: PropTypes.string,
    author: PropTypes.string,
    quantity: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    status: PropTypes.string,
  }).isRequired,
  onSave: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};
