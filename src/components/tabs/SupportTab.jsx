import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  updateDoc,
  doc,
  writeBatch,
  getDocs,
} from "firebase/firestore";
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
import {
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Trash2Icon,
} from "lucide-react";
import Searchbar from "../ui/searchbutton";
import { useOutletContext } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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

  const handleClearTickets = async () => {
    if (tickets.length === 0) {
      toast.warning("No hay solicitudes que limpiar");
      return;
    }

    if (
      !confirm(
        "¿Estás seguro de eliminar todas las solicitudes de soporte resueltas?"
      )
    ) {
      return;
    }

    try {
      const ticketsRef = collection(db, "support_tickets");
      const querySnapshot = await getDocs(ticketsRef);
      const batch = writeBatch(db);

      querySnapshot.docs.forEach((doc) => {
        if (doc.data().status === "resuelto") {
          batch.delete(doc.ref);
        }
      });

      await batch.commit();
      toast.success("Solicitudes resueltas eliminadas exitosamente");
    } catch (error) {
      console.error("Error al limpiar solicitudes:", error);
      toast.error("Error al eliminar las solicitudes");
    }
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
    initialState: {
      pagination: {
        pageSize: 6,
      },
    },
  });

  return (
    <Card className="bg-gradient-to-br from-white to-gray-200 bg-opacity-100 shadow-black shadow-lg backdrop:blur-sm bg-white">
      <CardHeader className="p-4 md:p-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <CardTitle className="text-lg md:text-xl">
              Centro de Soporte
            </CardTitle>
            <CardDescription className="text-sm md:text-base">
              Gestiona y da seguimiento a los reportes de usuarios
            </CardDescription>
          </div>
        </div>
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
            <div>
              <div className="flex justify-between items-center mb-4">
                <Searchbar
                  value={globalFilter}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Buscar en reportes..."
                />
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button onClick={handleClearTickets}>
                        <Trash2Icon className="mr-2 h-4 w-4" />
                        Limpiar Resueltos
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Eliminar todas las solicitudes resueltas</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="overflow-x-auto -mx-2 md:mx-0">
                {renderTable(table, "tickets")}
              </div>
              <div className="sticky bottom-0 bg-white/90 backdrop-blur-sm py-4">
                {table.getPageCount() > 1 && (
                  <div className="flex justify-center gap-2 pb-8">
                    <Button
                      variant="outline"
                      onClick={() => table.previousPage()}
                      disabled={!table.getCanPreviousPage()}
                      className="text-gray-700 border-gray-300 hover:bg-gray-100"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="flex items-center gap-2">
                      {Array.from(
                        { length: table.getPageCount() },
                        (_, i) => i + 1
                      ).map((page) => (
                        <Button
                          key={page}
                          variant={
                            table.getState().pagination.pageIndex + 1 === page
                              ? "default"
                              : "outline"
                          }
                          onClick={() => table.setPageIndex(page - 1)}
                          className={`w-10 ${
                            table.getState().pagination.pageIndex + 1 === page
                              ? "bg-black text-white hover:bg-black"
                              : "text-gray-700 border-gray-300 hover:bg-gray-100"
                          }`}
                        >
                          {page}
                        </Button>
                      ))}
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => table.nextPage()}
                      disabled={!table.getCanNextPage()}
                      className="text-gray-700 border-gray-300 hover:bg-gray-100"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SupportTab;
