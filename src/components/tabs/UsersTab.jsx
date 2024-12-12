/* eslint-disable no-unused-vars */
import { useOutletContext } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  ChevronDown,
  ChevronsUpDown,
  ChevronUp,
  SearchIcon,
  Trash2Icon,
  UserPlus,
} from "lucide-react";
import LoadinSpinner from "../ui/LoadinSpinner";
import AddUserDialog from "../dialogs/AddUserDialog";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/firebaseConfig";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/firebaseConfig";

const UsersTab = () => {
  const { data, setData } = useOutletContext();

  const handleAddUserSuccess = (newUser) => {
    setData((prev) => ({
      ...prev,
      users: [...prev.users, newUser],
    }));
  };

  const handleDeleteUser = async (userId) => {
    const confirmPrompt = prompt(
      'Para eliminar el usuario, inserte la palabra "eliminar"'
    );
    if (confirmPrompt && confirmPrompt.toLowerCase() === "eliminar") {
      try {
        const batch = writeBatch(db);
        const userDocRef = doc(db, "users", userId);
        const userDoc = await getDoc(userDocRef);
        const userData = userDoc.data();

        // Eliminar usuario
        batch.delete(userDocRef);

        // Crear notificación para administradores
        const adminsSnapshot = await getDocs(
          query(collection(db, "users"), where("role", "==", "admin"))
        );
        const timestamp = Timestamp.fromDate(new Date());

        adminsSnapshot.docs.forEach((adminDoc) => {
          const notificationRef = doc(
            collection(db, "users", adminDoc.id, "notifications")
          );
          batch.set(notificationRef, {
            title: "Usuario Eliminado",
            message: `Usuario ${userData.name} (${userData.email}) ha sido eliminado del sistema.`,
            type: "error",
            createdAt: timestamp,
            read: false,
          });
        });

        await batch.commit();
        setData((prev) => ({
          ...prev,
          users: prev.users.filter((user) => user.id !== userId),
        }));
      } catch (error) {
        console.error("Error al eliminar el usuario:", error);
        toast.error("Error al eliminar el usuario");
      }
    }
  };

  // Corregir handleStatusChange para manejar el caso de usuario
  const handleChangeRole = async (userId, newRole) => {
    if (confirm(`¿Estás seguro de cambiar el rol del usuario?`)) {
      try {
        const batch = writeBatch(db);
        const userRef = doc(db, "users", userId);
        const userDoc = await getDoc(userRef);
        const userData = userDoc.data();

        // Actualizar rol
        batch.update(userRef, { role: newRole });

        // Crear notificaciones
        const timestamp = Timestamp.fromDate(new Date());

        // Notificación para el usuario afectado
        const userNotificationRef = doc(
          collection(db, "users", userId, "notifications")
        );
        batch.set(userNotificationRef, {
          title: "Rol Actualizado",
          message: `Tu rol ha sido actualizado a: ${newRole}`,
          type: "info",
          createdAt: timestamp,
          read: false,
        });

        // Notificación para administradores
        const adminsSnapshot = await getDocs(
          query(collection(db, "users"), where("role", "==", "admin"))
        );
        adminsSnapshot.docs.forEach((adminDoc) => {
          if (adminDoc.id !== userId) {
            // Evitar duplicar notificación si el usuario es admin
            const notificationRef = doc(
              collection(db, "users", adminDoc.id, "notifications")
            );
            batch.set(notificationRef, {
              title: "Rol de Usuario Actualizado",
              message: `Rol actualizado para ${userData.name}: ${newRole}`,
              type: "info",
              createdAt: timestamp,
              read: false,
            });
          }
        });

        await batch.commit();
        setData((prev) => ({
          ...prev,
          users: prev.users.map((user) =>
            user.id === userId ? { ...user, role: newRole } : user
          ),
        }));
      } catch (error) {
        console.error("Error al cambiar el rol:", error);
        toast.error("Error al cambiar el rol");
      }
    }
  };

  const handleStatusChange = async (itemId, newValue, itemType) => {
    console.log(`Cambiando estado de ${itemType} ${itemId} a ${newValue}`); // Console log agregado
    try {
      switch (itemType) {
        case "user":
          await handleChangeRole(itemId, newValue);
          break;
        case "book": {
          const bookRef = doc(db, "books", itemId);
          await updateDoc(bookRef, { status: newValue });
          setData((prev) => ({
            ...prev,
            books: prev.books.map((book) =>
              book.id === itemId ? { ...book, status: newValue } : book
            ),
          }));
          break;
        }
      }
    } catch (error) {
      console.error(`Error al cambiar estado de ${itemType}:`, error);
    }
  };

  // Definición de columnas para la tabla de usuarios
  const userColumns = [
    // {
    //   accessorKey: "id",
    //   header: "ID",
    //   enableSorting: false,
    // },
    {
      accessorKey: "name",
      header: "Nombre",
      enableSorting: true,
    },
    {
      accessorKey: "email",
      header: "Email",
    },
    {
      accessorKey: "role",
      header: "Rol",
      cell: ({ row }) => (
        <Select
          value={row.original.role}
          onValueChange={(value) =>
            handleStatusChange(row.original.id, value, "user")
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Cambiar rol" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="admin">Administrador</SelectItem>
            <SelectItem value="student">Estudiante</SelectItem>
            <SelectItem value="atm">Bibliotecario</SelectItem>
          </SelectContent>
        </Select>
      ),
    },
    {
      id: "actions",
      header: "Acciones",
      cell: ({ row }) => (
        // <button
        //   onClick={() => handleDeleteUser(row.original.id)}
        //   className="text-red-500 hover:text-red-700"
        // >
        //   <MdDeleteForever className="h-6 w-6" />
        // </button>
        <Button onClick={() => handleDeleteUser(row.original.id)}>
          <Trash2Icon className="mr-2 h-4 w-4" />
          Eliminar Usuario
        </Button>
      ),
    },
  ];

  const handleSearch = (value, tableType) => {
    if (tableType === "users") {
      usersTable.setGlobalFilter(value);
    }
  };

  const usersTable = useReactTable({
    data: data.users,
    columns: userColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: {
      globalFilter: "",
      pagination: {
        pageSize: 8,
      },
    },
  });

  // Reemplazar el renderizado de las tablas existentes con el nuevo formato
  function getSortIcon(column) {
    const sorted = column.getIsSorted();
    if (!sorted) return <ChevronsUpDown className="ml-2 h-4 w-4" />;
    if (sorted === "asc") return <ChevronUp className="ml-2 h-4 w-4" />;
    return <ChevronDown className="ml-2 h-4 w-4" />;
  }

  const renderTable = (table, tableType) => (
    <>
      {tableType !== "tickets" && (
        <div className="flex items-center space-x-2 mb-4">
          <Input
            placeholder={`Buscar ${
              tableType === "users" ? "usuario" : "libro"
            }...`}
            className="max-w-sm"
            value={table.getState().globalFilter ?? ""}
            onChange={(e) => handleSearch(e.target.value, tableType)}
          />
        </div>
      )}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.column.getCanSort() ? (
                      <div
                        className="flex cursor-pointer items-center"
                        onClick={() => header.column.toggleSorting()}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {getSortIcon(header.column)}
                      </div>
                    ) : (
                      flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Anterior
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Siguiente
        </Button>
      </div>
    </>
  );

  if (!usersTable) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <LoadinSpinner />
      </div>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-white to-gray-200 bg-opacity-100 shadow-black shadow-lg backdrop:blur-sm bg-white">
      <CardHeader>
        <CardTitle>Gestión de Usuarios</CardTitle>
        <CardDescription>
          Administra los usuarios del sistema de la biblioteca.
        </CardDescription>
      </CardHeader>
      <AddUserDialog onSuccess={handleAddUserSuccess} />
      <CardContent>{renderTable(usersTable, "users")}</CardContent>
    </Card>
  );
};

export default UsersTab;
