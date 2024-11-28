import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import PropTypes from "prop-types";
import { Timestamp } from "firebase/firestore";
import { toast } from "@/components/ui/sonner";

export default function ReservationRenewalForm({ book, onRenew, onClose }) {
  const handleSubmit = (e) => {
    e.preventDefault();

    // Calcular nueva fecha (5 días más)
    const currentDate = book.dueDate.toDate();
    const newDate = new Date(currentDate.getTime());
    newDate.setDate(newDate.getDate() + 5);
    const newTimestamp = Timestamp.fromDate(newDate);

    // Llamar a onRenew con el id del libro y la nueva fecha
    onRenew(book.id, newTimestamp);

    // Mostrar toast usando Sonner - Corregido el formato
    toast.success("Préstamo renovado", {
      description: "La reserva ha sido extendida por 5 días adicionales.",
    });

    // Cerrar el diálogo
    onClose();
  };

  // Convertir el Timestamp a una fecha formateada
  const formatDate = (timestamp) => {
    if (!timestamp) return "";
    const date = timestamp.toDate();
    return date.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-4 py-4">
        <p>
          ¿Estás seguro de que deseas renovar el préstamo del siguiente libro?
        </p>
        <p>
          <strong>Título:</strong> {book.title}
        </p>
        <p>
          <strong>Autor:</strong> {book.author}
        </p>
        <p>
          <strong>Fecha actual de devolución:</strong>{" "}
          {formatDate(book.dueDate)}
        </p>
      </div>
      <DialogFooter>
        <Button type="submit">Confirmar Renovación</Button>
      </DialogFooter>
    </form>
  );
}

ReservationRenewalForm.propTypes = {
  book: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    author: PropTypes.string.isRequired,
    dueDate: PropTypes.object.isRequired, // Cambiado de string a object para Timestamp
  }).isRequired,
  onRenew: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};
