import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AuthUser } from "../types";

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function verifyToken(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Please log in to continue." });
  }
  try {
    const payload = jwt.verify(header.slice(7), process.env.JWT_SECRET as string) as jwt.JwtPayload;
    req.user = { id: String(payload.sub), name: payload.name, email: payload.email };
    next();
  } catch {
    return res.status(401).json({ message: "Your session has expired. Please log in again." });
  }
}
