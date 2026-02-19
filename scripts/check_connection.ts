
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })
dotenv.config({ path: '.env' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    console.log('❌ Error: Missing Supabase URL or Key in .env file.')
    process.exit(1)
}

console.log('🔄 Checking Supabase connection...')
console.log(`📡 URL: ${supabaseUrl}`)

const supabase = createClient(supabaseUrl, supabaseKey)

async function check() {
    try {
        const { data, error } = await supabase.from('properties').select('count', { count: 'exact', head: true })

        if (error) {
            console.log('❌ Connection Failed:', error.message)
        } else {
            console.log('✅ Connection Successful!')
            console.log(`📊 Found ${data} items using HEAD request (indicates database is reachable).`)

            // Try fetching one property
            const { data: props } = await supabase.from('properties').select('address').limit(1)
            if (props && props.length > 0) {
                console.log(`🏠 Sample Data: "${props[0].address}" (Read successfully)`)
            } else {
                console.log('⚠️ Connected, but "properties" table seems empty.')
            }
        }
    } catch (err: any) {
        console.log('❌ Unexpected Error:', err.message)
    }
}

check()
