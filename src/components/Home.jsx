/* eslint-disable no-unused-vars */
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LuArrowBigRightDash } from "react-icons/lu";
import {
  BookOpen,
  Users,
  Calendar,
  Search,
  BookPlus,
  ArrowRightCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import ComponenteMio from "./componente";

const Home = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen w-[1920px]  bg-opacity-30 bg-black ">
      <header className="bg-white shadow-md shadow-black bg-opacity-90">
        <div className="container mx-auto px-4 py-6 flex justify-between items-center">
          <h1 className="text-6xl font-bold text-black font-serif flex items-center">
            <BookOpen className="mr-2" />
            Sistema de Gestión de Biblioteca
          </h1>
          <nav>
            <ul className="flex space-x-4">
              <li>
                <Button
                  onClick={() => navigate("/register")}
                  className="border-0 absolute top-10  right-10 pr-6 shadow-md shadow-black font-semibold h hover:border-2 text-black hover:border-black hover:bg-white hover:bg-opacity-100 bg-white bg-opacity-70"
                  variant="outline"
                >
                  Acceso
                  <LuArrowBigRightDash
                    className="text-black absolute right-1 text-lg "
                    size={20}
                  />
                </Button>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <section className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">
            Bienvenido a tu Biblioteca Digital
          </h2>
          <p className="backdrop:blur-sm bg-[#fffff] bg-opacity-30 rounded-lg indent-8 text-[#f5f5f5] font-serif text-3xl font-medium leading-tight">
            Descubre un mundo de conocimiento al alcance de tus manos. Gestiona
            tus préstamos, reservas y más con nuestro sistema intuitivo.
          </p>
        </section>

        <section className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Search className="mr-2" />
                Búsqueda Avanzada
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                Encuentra rápidamente los libros que buscas con nuestro potente
                motor de búsqueda.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="mr-2" />
                Gestión de Préstamos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                Realiza préstamos, devoluciones y renovaciones de forma sencilla
                y eficiente.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BookPlus className="mr-2" />
                Reservas Online
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                Reserva tus libros favoritos desde la comodidad de tu hogar u
                oficina.
              </p>
            </CardContent>
          </Card>
        </section>

        <section className="text-center mb-12">
          <h3 className="text-2xl font-bold mb-4">¿Listo para empezar?</h3>
          <div className="flex justify-center space-x-4">
            <Button
              size="lg"
              className="flex items-center hover:bg-white hover:bg-opacity-100 hover:text-black hover:shadow-md hover:shadow-black hover:border-2 hover:border-black transition-colors duration-300"
              onClick={() => navigate("/register")}
            >
              Acceso
              <ArrowRightCircle className="ml-2" />
            </Button>
          </div>
        </section>
      </main>

      <footer className="bg-gray-100 py-6 absolute w-[1879px] bottom-0">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p>
            &copy; 2024 Sistema de Gestión de Biblioteca. Todos los derechos
            reservados.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
