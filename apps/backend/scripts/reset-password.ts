#!/usr/bin/env npx ts-node
/**
 * Resetea la contraseña de un usuario directamente en la BD.
 * Uso: npx ts-node scripts/reset-password.ts <email> <nueva-contraseña>
 */
import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import path from 'path'
import dotenv from 'dotenv'

dotenv.config({ path: path.resolve(__dirname, '../.env.development') })

const [, , email, newPassword] = process.argv

if (!email || !newPassword) {
  console.error('Uso: npx ts-node scripts/reset-password.ts <email> <nueva-contraseña>')
  process.exit(1)
}

if (newPassword.length < 8) {
  console.error('La contraseña debe tener al menos 8 caracteres')
  process.exit(1)
}

async function main() {
  await mongoose.connect(process.env['MONGODB_URI']!)

  const passwordHash = await bcrypt.hash(newPassword, 12)
  const result = await mongoose.connection.db!
    .collection('users')
    .updateOne(
      { email: email.toLowerCase() },
      {
        $set: { passwordHash, loginAttempts: 0 },
        $unset: { lockedUntil: '' },
      },
    )

  if (result.matchedCount === 0) {
    console.error(`No se encontró ningún usuario con email: ${email}`)
    process.exit(1)
  }

  console.log(`✓ Contraseña actualizada para ${email}`)
  await mongoose.disconnect()
}

main().catch((err) => {
  console.error('Error:', err)
  process.exit(1)
})
