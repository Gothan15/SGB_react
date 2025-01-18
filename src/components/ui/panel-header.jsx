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
import PropTypes from "prop-types";
//import CardSoc from "./socials";

const iconMap = {
  "Panel de Administración de la Biblioteca": LayoutDashboard,
  "Panel de Usuario": Users,
  "Gestión de Libros": Book,
  "Informes y Estadísticas": BarChart,
  "Libros Reservados": BookOpenIcon,
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
    <Card className="w-[60vw] border-0 rounded-md bg-gradient-to-r from-primary to-primary-foreground shadow-lg">
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Sección Principal */}
          <div className="flex items-center space-x-4">
            <div className="bg-white p-3 rounded-full shadow-md">
              <Icon className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{panelName}</h1>
              <div className="flex items-center text-white/80 space-x-2">
                <IconLocation className="h-4 w-4" />
                <span>/ {locationName}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

PanelHeader.propTypes = {
  panelName: PropTypes.string.isRequired,
  locationName: PropTypes.string.isRequired,
};
