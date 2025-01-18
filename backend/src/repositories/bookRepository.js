import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "@/firebaseConfig";

class BookRepository {
  constructor() {
    this.booksCollection = collection(db, "books");
  }

  async getAllBooks() {
    const snapshot = await getDocs(this.booksCollection);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  }

  async getBookById(id) {
    const bookDoc = await getDoc(doc(this.booksCollection, id));
    if (!bookDoc.exists()) return null;
    return { id: bookDoc.id, ...bookDoc.data() };
  }

  async addBook(book) {
    const docRef = await addDoc(this.booksCollection, book);
    return docRef.id;
  }

  async updateBook(id, updatedBook) {
    const bookRef = doc(this.booksCollection, id);
    await updateDoc(bookRef, updatedBook);
  }

  async deleteBook(id) {
    await deleteDoc(doc(this.booksCollection, id));
  }
}

export default new BookRepository();
