import { PrismaClient } from "@prisma/client";

export const ROLE_NAMES = {
  ADMIN: "Admin",
  CUSTOMER: "Customer",
} as const;

const prisma = new PrismaClient();

async function main(): Promise<void> {
  for (const name of Object.values(ROLE_NAMES)) {
    await prisma.role.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    // eslint-disable-next-line no-console
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
