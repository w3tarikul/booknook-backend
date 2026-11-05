import { ObjectId } from "mongodb";

export interface Book {
  _id?: ObjectId;
  title: string;
  author: string;
  category: string;
  image: string;
  description: string;
  totalCopies: number;
  availableCopies: number;
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  createdAt: Date;
}

export interface Borrow {
  _id?: ObjectId;
  bookId: string;
  userId: string;
  userName: string;
  userEmail: string;
  title: string;
  image: string;
  borrowDate: Date;
  returnDate: Date;
  status: "active";
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
}
