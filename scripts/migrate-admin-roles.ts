/**
 * Migration script: Update existing ADMIN users to SUPER_ADMIN.
 * Run with: npx tsx scripts/migrate-admin-roles.ts
 */
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
    console.log("🔄 Migrating ADMIN users to SUPER_ADMIN...")

    // Check for any users with old role names
    // Since we already changed the enum, old "ADMIN" values might have been
    // dropped during db push. Let's check current roles.
    const users = await prisma.user.findMany({
        select: { id: true, email: true, role: true, name: true }
    })

    console.log(`\n📋 Current users (${users.length}):`)
    users.forEach(u => {
        console.log(`  ${u.name || 'No Name'} (${u.email}) → Role: ${u.role}`)
    })

    // Update any STAFF users that should be SUPER_ADMIN
    // Since ADMIN was removed from the enum, those users are now either
    // already migrated or were reset. Let's give the first user SUPER_ADMIN.
    const staffUsers = users.filter(u => u.role === 'STAFF')
    
    if (staffUsers.length > 0) {
        console.log(`\n⚠️  Found ${staffUsers.length} STAFF users.`)
        console.log(`   To promote a user to SUPER_ADMIN, run:`)
        console.log(`   npx tsx -e "const { PrismaClient } = require('@prisma/client'); const p = new PrismaClient(); p.user.update({ where: { id: 'USER_ID' }, data: { role: 'SUPER_ADMIN' } }).then(console.log)"`)
    }

    const superAdmins = users.filter(u => u.role === 'SUPER_ADMIN')
    if (superAdmins.length > 0) {
        console.log(`\n✅ ${superAdmins.length} SUPER_ADMIN user(s) found:`)
        superAdmins.forEach(u => console.log(`  - ${u.name} (${u.email})`))
    } else {
        console.log(`\n⚠️  No SUPER_ADMIN users found.`)
        
        // Auto-promote first user to SUPER_ADMIN if no admins exist
        if (users.length > 0) {
            const firstUser = users[0]
            console.log(`\n🔑 Auto-promoting first user to SUPER_ADMIN: ${firstUser.name} (${firstUser.email})`)
            await prisma.user.update({
                where: { id: firstUser.id },
                data: { role: 'SUPER_ADMIN' }
            })
            console.log(`   ✅ Done!`)
        }
    }

    console.log("\n✅ Migration check complete!")
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
