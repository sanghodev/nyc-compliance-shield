
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
// IMPORTANT: This requires the SERVICE_ROLE_KEY (not Anon key) to bypass rate limits
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Error: Missing SUPABASE_SERVICE_ROLE_KEY in .env file.')
    console.error('Please add SUPABASE_SERVICE_ROLE_KEY=eyJh... to your .env file.')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createManager() {
    const email = process.argv[2]
    const password = process.argv[3] || 'password123'
    const name = process.argv[4] || 'New Manager'

    if (!email) {
        console.log('Usage: npx ts-node scripts/admin_create_user.ts <email> [password] [name]')
        process.exit(1)
    }

    console.log(`Creating manager: ${email} ...`)

    const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Auto-confirm email
        user_metadata: {
            role: 'manager',
            status: 'Active', // Auto-activate (Skip manual approval for dev speed)
            full_name: name
        }
    })

    if (error) {
        console.error('Error creating user:', error.message)
    } else {
        console.log('------------------------------------------------')
        console.log(`✅ User created successfully!`)
        console.log(`   ID: ${data.user.id}`)
        console.log(`   Email: ${data.user.email}`)
        console.log(`   Role: Manager (Active)`)
        console.log(`   Password: ${password}`)
        console.log('------------------------------------------------')
        console.log('You can now log in immediately.')
    }
}

createManager()
