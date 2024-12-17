import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState } from "react";
import SupportForm from "../dialogs/support-form";

const ChatButton = () => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          className="fixed bottom-20 md:bottom-4 right-4 md:left-4 rounded-full p-3 md:p-4 
          shadow-lg shadow-black hover:shadow-xl 
          bg-white bg-opacity-70 backdrop-blur 
          text-black hover:bg-white hover:bg-opacity-100 
          transition-all duration-300 z-50"
          size="icon"
          aria-label="Soporte"
        >
          <MessageSquare className="h-5 w-5 md:h-6 md:w-6" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reportar un Problema</DialogTitle>
        </DialogHeader>
        <SupportForm onClose={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
};

export default ChatButton;
