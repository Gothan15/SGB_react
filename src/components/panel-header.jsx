import { Card, CardContent } from "@/components/ui/card";
import {
  LayoutDashboard,
  Book,
  Users,
  BarChart,
  CalendarIcon,
  UserIcon,
  BookOpenIcon,
  BookIcon,
  UsersIcon,
  MessageSquare,
} from "lucide-react";

const iconMap = {
  "Panel de Administración de la Biblioteca": LayoutDashboard,
  "Panel de Usuario": Users,
  "Gestión de Libros": Book,
  "Informes y Estadísticas": BarChart,
  "Libros Prestados": BookOpenIcon,
  "Libros Disponibles": BookIcon,
  "Historial de Reservas": CalendarIcon,
  "Mi Cuenta": UserIcon,
  Informes: BarChart,
  Soporte: MessageSquare,
  Libros: BookIcon,
  Reservas: CalendarIcon,
  Usuarios: UsersIcon,
};

export default function PanelHeader({ panelName, locationName }) {
  const Icon = iconMap[panelName] || LayoutDashboard;
  const IconLocation = iconMap[locationName] || LayoutDashboard;

  return (
    <Card className="border-0 rounded-md  bg-gradient-to-r from-primary to-primary-foreground shadow-lg">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-white p-3 rounded-full shadow-md">
              <Icon className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{panelName}</h1>
              <p className="text-sm text-white/80">
                Bienvenido al panel de control
              </p>
            </div>
          </div>
          <div className="hidden mt-8 sm:flex items-center space-x-2 text-white/80">
            <IconLocation className="ml-2 text-black h-4 w-4" />
            <span className="text-sm text-black">/ {locationName}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
