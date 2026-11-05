import { ObjectId } from "mongodb";

export const isValidId = (id: string) => ObjectId.isValid(id) && String(new ObjectId(id)) === id;

export const toCopies = (value: unknown): number | null => {
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 && n <= 1000 ? n : null;
};

export const LIMITS = { title: 150, author: 100, category: 50, description: 3000, image: 1000 } as const;

export function tooLong(fields: Record<string, unknown>): string | null {
  for (const [key, max] of Object.entries(LIMITS)) {
    const value = fields[key];
    if (typeof value === "string" && value.trim().length > max) {
      return `The ${key} must be ${max} characters or fewer.`;
    }
  }
  return null;
}
