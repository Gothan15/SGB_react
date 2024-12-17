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
import { ThemeToggle } from "@/components/ui/theme-toggle";

const Home = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen w-full sm:w-[100%] md:w-[1920px] bg-opacity-30 bg-black flex flex-col">
      <header className="bg-white shadow-md shadow-black bg-opacity-90">
        <div className="container mx-auto px-4 py-6 flex flex-col md:flex-row justify-between items-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-black font-serif flex items-center">
            <BookOpen className="mr-2" />
            Sistema de Gestión de Biblioteca
          </h1>
          <nav>
            <ul className="flex space-x-2 sm:space-x-4">
              <li>
                <Button
                  onClick={() => navigate("/register")}
                  className="xl:absolute   xl:top-10 xl:right-5 border-0 pr-6 shadow-md shadow-black font-semibold hover:border-2 text-black hover:border-black hover:bg-white hover:bg-opacity-100 bg-white bg-opacity-70"
                  variant="outline"
                >
                  Acceso
                  <LuArrowBigRightDash
                    className="text-black ml-2 text-lg"
                    size={20}
                  />
                </Button>
              </li>
              {/* <li>
                <ThemeToggle />
              </li> */}
            </ul>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 flex-grow">
        <section className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
            Bienvenido a tu Biblioteca Digital
          </h2>
          <p className="backdrop:blur-sm bg-[#fffff] bg-opacity-70 rounded-lg indent-4 sm:indent-6 text-[#f5f5f5] font-serif text-xl sm:text-2xl md:text-3xl font-medium leading-tight">
            Descubre un mundo de conocimiento al alcance de tus manos. Gestiona
            tus préstamos, reservas y más con nuestro sistema intuitivo.
          </p>
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12">
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

        <section className="text-center mb-8 sm:mb-12">
          <h3 className="text-xl sm:text-2xl font-bold mb-4">
            ¿Listo para empezar?
          </h3>
          <div className="flex justify-center space-x-2 sm:space-x-4">
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

      <footer className="bg-gray-100 py-4 sm:py-6 w-full">
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
