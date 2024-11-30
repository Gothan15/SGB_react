import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { db, auth } from "../../firebaseConfig";
import {
  addDoc,
  collection,
  serverTimestamp,
  getDoc,
  doc,
} from "firebase/firestore";
import { toast } from "sonner";
import PropTypes from "prop-types";

const SupportForm = ({ onClose }) => {
  const [formData, setFormData] = useState({
    subject: "",
    message: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
      const userData = userDoc.data();

      await addDoc(collection(db, "support_tickets"), {
        userId: auth.currentUser.uid,
        userEmail: auth.currentUser.email,
        userName:
          userData.name || auth.currentUser.displayName || "Usuario sin nombre",
        subject: formData.subject,
        message: formData.message,
        status: "pendiente",
        createdAt: serverTimestamp(),
      });

      toast.success("Reporte enviado exitosamente");
      onClose();
    } catch (error) {
      toast.error("Error al enviar el reporte");
      console.error(error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="subject">Asunto</Label>
        <Input
          id="subject"
          value={formData.subject}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, subject: e.target.value }))
          }
          required
        />
      </div>
      <div>
        <Label htmlFor="message">Mensaje</Label>
        <Textarea
          id="message"
          value={formData.message}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, message: e.target.value }))
          }
          required
          className="min-h-[100px]"
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit">Enviar</Button>
      </div>
    </form>
  );
};
SupportForm.propTypes = {
  onClose: PropTypes.func.isRequired,
};

export default SupportForm;
