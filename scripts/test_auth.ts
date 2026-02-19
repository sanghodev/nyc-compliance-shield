
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })
dotenv.config({ path: '.env' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function testAuth() {
    const timestamp = Date.now()
    const email = `test_user_${timestamp}@example.com`
    const password = 'password123'

    console.log(`🧪 Testing Sign Up with: ${email}`)

    // 1. Sign Up
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                role: 'tenant'
            }
        }
    })

    if (signUpError) {
        console.error('❌ Sign Up Failed:', signUpError.message)
        return
    }

    console.log('✅ Sign Up Successful!')
    console.log(`   User ID: ${signUpData.user?.id}`)
    console.log(`   Email Confirmed: ${signUpData.user?.email_confirmed_at ? 'Yes' : 'No'}`)

    if (signUpData.session) {
        console.log('🎉 Session created immediately! (Auto-login works)')
    } else {
        console.log('⚠️ No session returned. Email confirmation is likely required.')
    }

    // 2. Try Login
    console.log('\n🔐 Testing Login...')
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
    })

    if (signInError) {
        console.log(`❌ Login Failed (Expected if verify needed): ${signInError.message}`)
    } else {
        console.log('✅ Login Successful!')
        console.log(`   Role: ${signInData.user?.user_metadata.role}`)
    }
}

testAuth()
