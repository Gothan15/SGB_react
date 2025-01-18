// src/components/BooksList.jsx
import { useEffect, useState } from "react";
import { fetchBooks } from "../../backend/src/services/bookService.js";
import { fetchUsers } from "../../backend/src/services/userService";

const BooksList = () => {
  const [books, setBooks] = useState([]);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const getBooks = async () => {
      try {
        const fetchedBooks = await fetchBooks();
        setBooks(fetchedBooks);
      } catch (error) {
        console.error("Error loading books:", error);
      }
    };
    getBooks();
  }, []);

  useEffect(() => {
    const getUsers = async () => {
      try {
        const fectchedUsers = await fetchUsers();
        setUsers(fectchedUsers);
      } catch (error) {
        console.error("error loading books:", error);
      }
    };
    getUsers();
  }, []);

  return (
    <div>
      <h1>Lista de Libros</h1>
      <ul>
        {books.map((book) => (
          <li key={book.id}>
            {book.title} - {book.author} ({book.status})
          </li>
        ))}
      </ul>
      <h2>Lista usuarios</h2>
      <ul>
        {users.map((user) => (
          <li key={user.id}>
            {user.name} - {user.email}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default BooksList;
