import { useEffect, useState } from "react";
import { collection, onSnapshot, updateDoc, doc } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { toast } from "sonner";
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { MessageSquare } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useOutletContext } from "react-router-dom";

const SupportTab = () => {
  const [tickets, setTickets] = useState([]);
  const [globalFilter, setGlobalFilter] = useState("");

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "support_tickets"),
      (snapshot) => {
        const ticketsData = snapshot.docs.map((docSnapshot) => ({
          id: docSnapshot.id,
          ...docSnapshot.data(),
        }));
        setTickets(ticketsData);
      }
    );

    return () => unsubscribe();
  }, []);
  const { renderTable } = useOutletContext();
  //const tickets = data.supportTickets || [];

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
    <Card className="bg-gradient-to-br from-white to-gray-200 bg-opacity-100 shadow-black shadow-lg backdrop:blur-sm bg-white">
      <CardHeader className="p-4 md:p-6">
        <CardTitle className="text-lg md:text-xl">Centro de Soporte</CardTitle>
        <CardDescription className="text-sm md:text-base">
          Gestiona y da seguimiento a los reportes de usuarios
        </CardDescription>
      </CardHeader>
      <CardContent className="p-2 md:p-4 overflow-x-auto overflow-y-auto max-h-[70vh] md:max-h-[570px]">
        <div className="w-full min-w-[300px]">
          {tickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 md:py-12">
              <MessageSquare className="h-12 w-12 md:h-16 md:w-16 text-gray-400 mb-4" />
              <h3 className="text-lg md:text-xl font-semibold text-gray-600 mb-2 text-center">
                No hay reportes pendientes
              </h3>
              <p className="text-sm md:text-base text-gray-500 text-center px-4">
                Los nuevos reportes aparecerán aquí
              </p>
            </div>
          ) : (
            <>
              <div className="flex flex-col space-y-2 mb-4">
                <Input
                  placeholder="Buscar en reportes..."
                  value={globalFilter}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="overflow-x-auto -mx-2 md:mx-0">
                {renderTable(table, "tickets")}
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SupportTab;
