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
          className="fixed bottom-4 right-4 rounded-full p-4 shadow-lg hover:shadow-xl bg-white text-black hover:bg-black hover:text-white transition-all duration-300"
          size="icon"
        >
          <MessageSquare className="h-6 w-6" />
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
