import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import PropTypes from "prop-types";
import { Timestamp } from "firebase/firestore";

export default function ReservationRenewalForm({ book, onRenew, onClose }) {
  const handleSubmit = (e) => {
    e.preventDefault();

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
