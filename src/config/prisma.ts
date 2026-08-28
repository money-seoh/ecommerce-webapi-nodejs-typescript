import { PrismaClient } from "@prisma/client";

// Single shared PrismaClient instance for the whole application runtime.
// Repositories must receive this instance via constructor injection instead
// of instantiating their own PrismaClient.
export const prisma = new PrismaClient();
