import { db } from "../connector.js";
import { createBcryptPassword } from "../../helper/hashing.helper.js";

async function main() {
  await db.user.create({
    data: {
      name: "admin",
      email: "admin@gmail.com",
      password: await createBcryptPassword("rahasia"),
      role: "ADMIN",
      phone_number: "08123456789",
      address: "Jakarta",
      photo: "https://placehold.co/600x400/png",
    },
  });
}
main()
  .then(async () => {
    await db.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });
