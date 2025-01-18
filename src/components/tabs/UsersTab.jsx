import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  ChevronUp,
  Trash2Icon,
} from "lucide-react";
import LoadinSpinner from "../ui/LoadinSpinner";
import AddUserDialog from "../dialogs/AddUserDialog";
import DeleteUserDialog from "../dialogs/DeleteUserDialog";
import { toast } from "sonner";

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
import { functions } from "@/firebaseConfig"; // Asegúrate de exportar functions desde firebaseConfig
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Searchbar from "../ui/searchbutton";

const UsersTab = () => {
  const { data, setData } = useOutletContext();
  const [deleteDialogState, setDeleteDialogState] = useState({
    isOpen: false,
    userData: null,
  });

  const handleAddUserSuccess = (newUser) => {
    setData((prev) => ({
      ...prev,
      users: [...prev.users, newUser],
    }));
  };

  const handleDeleteUser = async (userId) => {
    const userToDelete = data.users.find((user) => user.id === userId);
    setDeleteDialogState({
      isOpen: true,
      userData: userToDelete,
    });
  };

  const handleConfirmDelete = async () => {
    const userId = deleteDialogState.userData.id;
    try {
      const deleteUserFunction = httpsCallable(functions, "deleteUser");
      await deleteUserFunction({ userId });

      setData((prev) => ({
        ...prev,
        users: prev.users.filter((user) => user.id !== userId),
      }));

      toast.success("Usuario eliminado con éxito");
      setDeleteDialogState({ isOpen: false, userData: null });
    } catch (error) {
      console.error("Error al eliminar el usuario:", error);
      toast.error("Error al eliminar el usuario");
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
    {
      accessorKey: "photoURL",
      header: "Avatar",
      enableSorting: false,
      cell: ({ row }) => (
        <Avatar>
          <AvatarImage src={row.original.photoURL} alt={row.original.name} />
          <AvatarFallback>
            {row.original.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      ),
    },
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

  const handleSearch = (e) => {
    usersTable.setGlobalFilter(e.target.value);
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
        pageSize: 6,
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
        <div className="flex flex-col gap-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Searchbar
                value={table.getState().globalFilter ?? ""}
                onChange={(e) => handleSearch(e)}
                placeholder="Buscar usuario..."
              />
            </div>
          </div>
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
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={userColumns.length}
                  className="h-24 text-center"
                >
                  No se encontraron resultados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between space-x-2 py-4">
        <div className="flex items-center gap-4">
          <Select
            value={table.getState().pagination.pageSize.toString()}
            onValueChange={(value) => {
              table.setPageSize(Number(value));
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Registros por página" />
            </SelectTrigger>
            <SelectContent>
              {[6, 12, 24, 48, 86].map((pageSize) => (
                <SelectItem key={pageSize} value={pageSize.toString()}>
                  Mostrar {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="text-sm text-muted-foreground">
            Mostrando {table.getState().pagination.pageSize} de{" "}
            {table.getFilteredRowModel().rows.length} registro(s)
          </div>
        </div>
        <div className="flex items-center space-x-6 lg:space-x-8">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center justify-center text-sm font-medium">
              Página {table.getState().pagination.pageIndex + 1} de{" "}
              {table.getPageCount()}
            </div>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
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
      <DeleteUserDialog
        isOpen={deleteDialogState.isOpen}
        onClose={() => setDeleteDialogState({ isOpen: false, userData: null })}
        onConfirm={handleConfirmDelete}
        userData={deleteDialogState.userData}
      />
      <CardContent className="overflow-y-auto max-h-[570px]">
        {renderTable(usersTable, "users")}
      </CardContent>
    </Card>
  );
};

export default UsersTab;
