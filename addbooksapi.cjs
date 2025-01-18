const admin = require("firebase-admin");
const fetch = require("node-fetch");
const serviceAccount = require("./ebda-7e856-firebase-adminsdk-7s7tw-e317353f08.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://ebda-7e856-default-rtdb.firebaseio.com",
});

const db = admin.firestore();

async function importBooks(query) {
  try {
    const response = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(
        query
      )}`
    );
    const data = await response.json();

    const booksRef = db.collection("books");

    for (const item of data.items) {
      const book = {
        title: item.volumeInfo.title || "",
        author: item.volumeInfo.authors
          ? item.volumeInfo.authors.join(", ")
          : "",
        imageUrl: item.volumeInfo.imageLinks
          ? item.volumeInfo.imageLinks.thumbnail
          : "",
        description: item.volumeInfo.description || "",
        status: "Disponible",
        publicationDate: item.volumeInfo.publishedDate || "",
        quantity: 10,
        reservations: [],
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      const docRef = await booksRef.add(book);
      console.log(`Libro "${book.title}" importado con ID: ${docRef.id}`);
    }

    console.log("¡Importación completada exitosamente!");
    process.exit(0);
  } catch (error) {
    console.error("Error importando libros:", error);
    process.exit(1);
  }
}

importBooks("jardineria");
