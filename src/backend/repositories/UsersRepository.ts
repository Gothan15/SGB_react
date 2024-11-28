import { collection, CollectionReference, doc, DocumentData, DocumentReference, Firestore, getDocs, QuerySnapshot } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import {injected} from "brandi"

export interface IUserRepository{
  getAll(): CollectionReference<DocumentData, DocumentData>
  getById(id: string): DocumentReference<DocumentData, DocumentData>
}

export class UserRepository implements IUserRepository{
  private db: Firestore;
  
  contructor() {
    this.db = db
  }

  getAll() {
    return collection(db, "users");
  }

  getById(id: string) {
    return doc(db, "users", id);
  }
}

injected(UserRepository);
