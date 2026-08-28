import { PrismaClient } from "@prisma/client";
import { ROLE_NAMES } from "../src/dtos/user.dto";

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
