import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import PropTypes from "prop-types";
import { Timestamp } from "firebase/firestore";
import { toast } from "sonner";

export default function ReservationRenewalForm({ book, onRenew, onClose }) {
  // Determinar si el libro ya fue renovado
  const hasBeenRenewed = book.renewalCount && book.renewalCount >= 1;

  const handleSubmit = (e) => {
    e.preventDefault();

    if (hasBeenRenewed) {
      toast.error(
        "Este libro ya ha sido renovado el máximo de veces permitido"
      );
      return;
    }

    const currentDate = book.dueDate.toDate();
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 5);
    const newTimestamp = Timestamp.fromDate(newDate);

    onRenew(book.id, newTimestamp);
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
        {hasBeenRenewed && (
          <p className="text-red-500">
            Este libro ya ha sido renovado y no puede renovarse nuevamente.
          </p>
        )}
      </div>
      <DialogFooter>
        <Button type="submit" disabled={hasBeenRenewed}>
          Confirmar Renovación
        </Button>
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
    renewalCount: PropTypes.number, // Añadir esta prop
  }).isRequired,
  onRenew: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};
