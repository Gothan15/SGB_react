"use client";
import PropTypes from "prop-types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BookOpenIcon } from "lucide-react";
import { useState } from "react";
import { Loader2 } from "lucide-react";

export default function BookReturnForm({ book, onReturn }) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsProcessing(true);
    onReturn(book);
    setTimeout(() => {
      setIsProcessing(false);
    }, 3000);
  };

  return (
    <Card className="w-full max-w-md border-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpenIcon className="h-6 w-6" />
          Confirmación de Devolución
        </CardTitle>
        <CardDescription>
          ¿Estás seguro de que deseas devolver este libro?
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p>
            <strong>Título:</strong> {book.title}
          </p>
          <p>
            <strong>Autor:</strong> {book.author}
          </p>
        </div>
      </CardContent>
      <CardFooter>
        <Button
          className="w-full"
          onClick={handleSubmit}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Procesando...
            </>
          ) : (
            "Confirmar Devolución"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}

BookReturnForm.propTypes = {
  book: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    author: PropTypes.string.isRequired,
  }).isRequired,
  onReturn: PropTypes.func.isRequired,
};
