import bookRepository from "../repositories/bookRepository";

class BookService {
  async getAllBooks() {
    return await bookRepository.getAllBooks();
  }

  async getBookById(id) {
    return await bookRepository.getBookById(id);
  }

  async addBook(book) {
    return await bookRepository.addBook(book);
  }

  async updateBook(id, book) {
    await bookRepository.updateBook(id, book);
  }

  async deleteBook(id) {
    await bookRepository.deleteBook(id);
  }
}

export default new BookService();
