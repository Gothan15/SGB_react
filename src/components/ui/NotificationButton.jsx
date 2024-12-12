import { BellIcon, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import PropTypes from "prop-types";
import Bubble from "./Bubble";
import { collection, getDocs, writeBatch } from "firebase/firestore";
import { auth, db } from "@/firebaseConfig";
import { useCallback } from "react";

const NotificationButton = ({ notifications, setNotifications }) => {
  const clearNotifications = useCallback(async () => {
    if (!auth.currentUser) return;
    try {
      const notificationsRef = collection(
        db,
        "users",
        auth.currentUser.uid,
        "notifications"
      );
      const snapshot = await getDocs(notificationsRef);

      const batch = writeBatch(db);
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      setNotifications([]);
    } catch (error) {
      console.error("Error al limpiar notificaciones:", error);
    }
  }, [setNotifications]);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="border-0 absolute  right-[15px]  shadow-md shadow-black font-semibold hover:border-2 text-black hover:border-black hover:bg-white hover:bg-opacity-100 transition-colors duration-300 bg-white bg-opacity-70"
        >
          <BellIcon className="h-6 w-6" />
          {notifications.length > 0 && <Bubble count={notifications.length} />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <div className="flex justify-between items-center p-2">
          <DropdownMenuLabel>Notificaciones</DropdownMenuLabel>
          {notifications.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearNotifications}
              className="hover:bg-red-100"
            >
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />
        {notifications.length > 0 ? (
          notifications.map((notification) => (
            <DropdownMenuItem key={notification.id}>
              {notification.message}
            </DropdownMenuItem>
          ))
        ) : (
          <DropdownMenuItem>No hay notificaciones</DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

NotificationButton.propTypes = {
  notifications: PropTypes.array.isRequired,
  setNotifications: PropTypes.func.isRequired,
};

export default NotificationButton;
