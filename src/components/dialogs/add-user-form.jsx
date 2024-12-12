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
import { Loader2, RefreshCw } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import * as z from "zod";
import PropTypes from "prop-types";

// Definir el esquema de validación
const formSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  role: z.string().min(1, "El rol es requerido"),
});

const generateRandomPassword = (length = 12) => {
  const charset =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+{}[]";
  let password = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  return password;
};

const AddUserForm = ({ onSave }) => {
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: generateRandomPassword(),
      role: "student",
    },
  });

  const handleSubmit = async (formData) => {
    console.log("Datos del formulario:", formData); // Para debugging

    const validatedData = {
      name: formData.name,
      email: formData.email,
      password: formData.password,
      role: formData.role,
    };

    if (Object.values(validatedData).some((value) => !value)) {
      console.error("Datos incompletos:", validatedData);
      return;
    }

    try {
      await onSave(validatedData);
      form.reset({
        ...form.formState.defaultValues,
        password: generateRandomPassword(),
      });
    } catch (error) {
      console.error("Error en el formulario:", error);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nombre</Label>
          <Input
            id="name"
            placeholder="Nombre del usuario"
            {...form.register("name")}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Correo electrónico</Label>
          <Input
            id="email"
            type="email"
            placeholder="correo@ejemplo.com"
            {...form.register("email")}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="role">Rol</Label>
          <Controller
            name="role"
            control={form.control}
            defaultValue="student"
            render={({ field }) => (
              <Select
                onValueChange={field.onChange}
                value={field.value}
                defaultValue="student"
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Estudiante</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="atm">Bibliotecario</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Contraseña generada</Label>
          <div className="flex space-x-2">
            <Input
              id="password"
              type="text"
              {...form.register("password")}
              readOnly
              className="flex-grow"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                form.setValue("password", generateRandomPassword())
              }
              className="flex-shrink-0"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Esta contraseña se generó automáticamente. El usuario deberá
            cambiarla en su primer inicio de sesión.
          </p>
        </div>
      </div>
      <DialogFooter>
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Agregando usuario...
            </>
          ) : (
            "Agregar usuario"
          )}
        </Button>
      </DialogFooter>
    </form>
  );
};
AddUserForm.propTypes = {
  onSave: PropTypes.func.isRequired,
};

export default AddUserForm;
