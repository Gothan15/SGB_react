import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProfile } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { db, auth } from "../../firebaseConfig";
import PropTypes from "prop-types";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { uploadImage } from "../../utils/cloudinaryConfig";

export default function ProfileEditForm({ user, onSuccess, onClose }) {
  const [formData, setFormData] = useState({
    name: user?.displayName || "",
    phone: user?.phone || "",
    avatarUrl: user?.photoURL || "",
  });
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(user?.photoURL || "");

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      onSuccess("Error: Por favor seleccione un archivo de imagen válido");
      return;
    }

    try {
      setLoading(true);
      const imageUrl = await uploadImage(file);
      setFormData({ ...formData, avatarUrl: imageUrl });
      setPreviewUrl(imageUrl);
    } catch (error) {
      onSuccess("Error al subir la imagen: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUrlChange = (e) => {
    const url = e.target.value;
    setFormData({ ...formData, avatarUrl: url });
    setPreviewUrl(url);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Validar URL
      if (formData.avatarUrl && !isValidUrl(formData.avatarUrl)) {
        throw new Error("URL de avatar inválida");
      }

      // Limpiar el número de teléfono eliminando el código de región
      const cleanPhone = formData.phone.replace(/^\d{1,2}/, "");

      await updateProfile(auth.currentUser, {
        displayName: formData.name,
        photoURL: formData.avatarUrl,
      });

      const userDoc = doc(db, "users", auth.currentUser.uid);
      await updateDoc(userDoc, {
        name: formData.name,
        phone: cleanPhone, // Guardamos el número sin código de región
        photoURL: formData.avatarUrl,
        updatedAt: new Date(),
      });

      onSuccess("Perfil actualizado exitosamente");
      onClose();
    } catch (error) {
      console.error("Error actualizando perfil:", error);
      onSuccess("Error: " + error.message);
    }
  };

  // Función auxiliar para validar URLs
  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
      // eslint-disable-next-line no-unused-vars
    } catch (_) {
      return false;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nombre</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="avatar">Imagen de perfil</Label>
        <Input
          id="avatar"
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          disabled={loading}
        />
        {previewUrl && (
          <div className="mt-2">
            <Label>Vista previa:</Label>
            <div className="mt-1 flex items-center space-x-2">
              <Avatar>
                <AvatarImage
                  src={previewUrl}
                  alt="Vista previa"
                  onError={() => setPreviewUrl("")}
                />
                <AvatarFallback>{formData.name.charAt(0)}</AvatarFallback>
              </Avatar>
              {previewUrl && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setFormData({ ...formData, avatarUrl: "" });
                    setPreviewUrl("");
                  }}
                >
                  Eliminar
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">Teléfono</Label>
        <PhoneInput
          value={formData.phone}
          onChange={(phone) => setFormData({ ...formData, phone })}
          inputProps={{
            name: "phone",
            required: true,
          }}
          inputStyle={{ width: "100%" }}
          specialLabel={null}
          enableSearch={true}
          disableSearchIcon={false}
          placeholder="Ingrese número telefónico"
        />
      </div>
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit">Guardar Cambios</Button>
      </div>
    </form>
  );
}
ProfileEditForm.propTypes = {
  user: PropTypes.shape({
    displayName: PropTypes.string,
    phone: PropTypes.string,
    photoURL: PropTypes.string,
  }).isRequired,
  onSuccess: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};
