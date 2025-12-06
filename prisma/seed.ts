import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const email = 'rakshitjain7rj@gmail.com'
  const password = 'Rakshit@8872227878'
  const hashedPassword = await hash(password, 10)

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      role: 'DEVELOPER', // Ensure role is correct if user exists
      password: hashedPassword, // Ensure password is updated if user exists
    },
    create: {
      email,
      name: 'Rakshit Jain',
      password: hashedPassword,
      role: 'DEVELOPER',
    },
  })
  console.log({ user })
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
