import { useOutletContext } from "react-router-dom";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
} from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { MessageSquare } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";

const SupportTab = () => {
  const { data, renderTable } = useOutletContext();
  const tickets = data.supportTickets || [];
  const [globalFilter, setGlobalFilter] = useState("");

  const handleStatusChange = async (ticketId, newStatus) => {
    try {
      await updateDoc(doc(db, "support_tickets", ticketId), {
        status: newStatus,
      });
      toast.success("Estado actualizado");
    } catch (error) {
      toast.error("Error al actualizar el estado");
      console.error(error);
    }
  };

  const getStatusBadge = (status) => {
    const statusStyles = {
      resuelto: "bg-green-500 hover:bg-green-600",
      EnProceso: "bg-black hover:bg-gray-600",
      pendiente: "bg-red-500 hover:bg-red-600",
      default: "bg-gray-500 hover:bg-gray-600",
    };
    return statusStyles[status] || statusStyles.default;
  };

  const handleSearch = (value) => {
    setGlobalFilter(value);
    table.setGlobalFilter(value);
  };

  const columns = [
    {
      accessorKey: "userName",
      header: "Nombre del Usuario",
      cell: ({ row }) => (
        <div>{row.original.userName || "Usuario sin nombre"}</div>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "subject",
      header: "Asunto del Reporte",
      enableSorting: true,
    },
    {
      accessorKey: "message",
      header: "Descripción",
      cell: ({ row }) => (
        <div className="max-w-[300px] truncate" title={row.original.message}>
          {row.original.message}
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Estado",
      cell: ({ row }) => (
        <Badge className={getStatusBadge(row.original.status)}>
          {row.original.status}
        </Badge>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Fecha de Creación",
      cell: ({ row }) => {
        const date = row.original.createdAt?.toDate();
        return date ? (
          <div>
            {date.toLocaleDateString()} - {date.toLocaleTimeString()}
          </div>
        ) : (
          "Fecha no disponible"
        );
      },
    },
    {
      id: "actions",
      header: "Acciones",
      cell: ({ row }) => (
        <Select
          defaultValue={row.original.status}
          onValueChange={(value) => handleStatusChange(row.original.id, value)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Cambiar estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pendiente">Pendiente</SelectItem>
            <SelectItem value="en proceso">En proceso</SelectItem>
            <SelectItem value="resuelto">Resuelto</SelectItem>
          </SelectContent>
        </Select>
      ),
    },
  ];

  const table = useReactTable({
    data: tickets,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      globalFilter,
    },
  });

  return (
    <Card className="bg-gradient-to-br from-white to-gray-200  bg-opacity-100 shadow-black shadow-lg backdrop:blur-sm bg-white">
      <CardHeader>
        <CardTitle>Centro de Soporte y Reportes</CardTitle>
        <CardDescription>
          Gestiona y da seguimiento a los reportes de problemas enviados por los
          usuarios.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {tickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <MessageSquare className="h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              No hay reportes pendientes
            </h3>
            <p className="text-gray-500 text-center">
              Los nuevos reportes de soporte aparecerán aquí cuando los usuarios
              los envíen.
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center space-x-2 mb-4">
              <Input
                placeholder="Buscar en reportes..."
                value={globalFilter}
                onChange={(e) => handleSearch(e.target.value)}
                className="max-w-sm"
              />
            </div>
            {renderTable(table, "tickets")}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default SupportTab;
