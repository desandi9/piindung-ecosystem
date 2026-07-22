import { PrismaClient } from "@prisma/client"
import { validateAssignmentOptions, createAssignment } from "../lib/gorut/assignment.mjs"

const checked = validateAssignmentOptions({ flags: process.argv.slice(2), env: process.env })
if (!checked.ok) {
  console.error(checked.error)
  process.exit(1)
}

const prisma = new PrismaClient()

try {
  const result = await createAssignment({ options: checked.options, prisma })
  console.log(JSON.stringify(result, null, 2))
} catch (error) {
  console.error("Failed to create assignment:", error.message)
  process.exit(1)
} finally {
  await prisma.$disconnect()
}
