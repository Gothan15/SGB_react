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
import { SearchIcon } from "lucide-react";
import LoadinSpinner from "../LoadinSpinner";

const UsersTab = () => {
  const { renderTable, usersTable } = useOutletContext();

  if (!usersTable) {
    return (
      <Card className="bg-opacity-100 shadow-black shadow-lg backdrop:blur-sm bg-white">
        <CardContent className="flex justify-center items-center min-h-[300px]">
          <LoadinSpinner />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-opacity-100 shadow-black shadow-lg backdrop:blur-sm bg-white">
      <CardHeader>
        <CardTitle>Gestión de Usuarios</CardTitle>
        <CardDescription>
          Administra los usuarios del sistema de la biblioteca.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* <div className="flex gap-2 mb-4">
          <Input placeholder="Buscar por nombre o email" />
          <Button>
            <SearchIcon className="h-4 w-4 mr-2" />
            Buscar
          </Button>
        </div> */}
        {renderTable(usersTable, "users")}
      </CardContent>
    </Card>
  );
};

export default UsersTab;
