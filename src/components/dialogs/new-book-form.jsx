/* eslint-disable no-unused-vars */
import { useState, useEffect, useCallback } from "react";
import { db } from "../../firebaseConfig";
import { collection, getDocs, addDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BookPlus } from "lucide-react";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

const initialFormState = {
  title: "",
  author: "",
  isbn: "",
  publicationDate: "",
  status: "",
  quantity: "",
};

const ManageBooks = () => {
  const [books, setBooks] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [formData, setFormData] = useState(initialFormState);

  const fetchBooks = useCallback(async () => {
    try {
      const booksSnapshot = await getDocs(collection(db, "books"));
      const booksList = booksSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setBooks(booksList);
    } catch (err) {
      console.error("Error al cargar libros:", err);
      setError("Error al cargar los libros");
    }
  }, []);

  const handleChange = ({ target: { id, value } }) => {
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleStatusChange = (value) => {
    setFormData((prev) => ({ ...prev, status: value }));
  };

  const handleIsbnChange = (value) => {
    // Solo permitir números
    const numbersOnly = value.replace(/[^0-9]/g, "");
    setFormData((prev) => ({ ...prev, isbn: numbersOnly }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.title ||
      !formData.author ||
      !formData.isbn ||
      !formData.quantity
    ) {
      setError("Por favor, complete todos los campos requeridos.");
      return;
    }

    try {
      await addDoc(collection(db, "books"), {
        ...formData,
        quantity: parseInt(formData.quantity),
        imageUrl: "default-book-image.jpg",
        reservations: [],
      });

      setSuccess("Libro agregado exitosamente");
      setFormData(initialFormState);
      fetchBooks();
    } catch (err) {
      console.error("Error al agregar libro:", err);
      setError("Error al agregar libro");
    }
  };

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        error ? setError("") : setSuccess("");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  return (
    <Card className="w-full  max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookPlus className="h-6 w-6" />
          Agregar Nuevo Libro
        </CardTitle>
        <CardDescription>
          Ingresa los detalles del nuevo libro para agregarlo al catálogo.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <div className="grid w-full items-center gap-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                placeholder="Ingresa el título del libro"
                value={formData.title}
                onChange={handleChange}
                required
              />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="author">Autor</Label>
              <Input
                id="author"
                placeholder="Ingresa el nombre del autor"
                value={formData.author}
                onChange={handleChange}
                required
              />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="isbn">ISBN (5 dígitos)</Label>
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
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="publicationDate">Fecha de Publicación</Label>
              <Input
                id="publicationDate"
                type="date"
                value={formData.publicationDate}
                onChange={handleChange}
                required
              />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="quantity">Cantidad</Label>
              <Input
                id="quantity"
                type="number"
                placeholder="Ingresa la cantidad de libros"
                value={formData.quantity}
                onChange={handleChange}
                required
              />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="status">Estado Inicial</Label>
              <Select
                value={formData.status}
                onValueChange={handleStatusChange}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Selecciona el estado del libro" />
                </SelectTrigger>
                <SelectContent position="popper">
                  <SelectItem value="Disponible">Disponible</SelectItem>
                  <SelectItem value="Prestado">Prestado</SelectItem>
                  <SelectItem value="En reparación">En reparación</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button className="w-full mt-6" type="submit">
            Agregar Libro
          </Button>
        </form>
      </CardContent>
      <CardFooter>
        {success && (
          <p className="border-2 absolute left-20 bg-green-600 text-center p-1 uppercase font-bold mt-3 mb-1 rounded-md text-white">
            {success}
          </p>
        )}
        {error && (
          <p className="bg-red-800 text-white text-center p-1 uppercase font-bold mt-3 mb-1 rounded-md">
            {error}
          </p>
        )}
      </CardFooter>
    </Card>
  );
};

export default ManageBooks;
