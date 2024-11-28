import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";

export default function DeleteBookConfirmation({
  bookTitle,
  onConfirm,
  onCancel,
}) {
  return (
    <div>
      <p className="text-center text-lg font-semibold mb-4">
        ¿Estás seguro de que quieres eliminar el libro "{bookTitle}"?
      </p>
      <p className="text-center mb-6">Esta acción no se puede deshacer.</p>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="button" variant="destructive" onClick={onConfirm}>
          Eliminar
        </Button>
      </DialogFooter>
    </div>
  );
}
