
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })
dotenv.config({ path: '.env' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function testInsert() {
    console.log('🧪 Testing Insert Permission...')

    const newProp = {
        address: "TEST_INSERT_ADDRESS",
        borough: "Manhattan",
        units: 10,
        status: "Good",
        violations: 0,
        lat: 40.7128,
        lng: -74.0060,
        image: "https://example.com/img.jpg"
    }

    const { data, error } = await supabase.from('properties').insert(newProp).select()

    if (error) {
        console.error('❌ Insert Failed:', error.message)
        console.error('Details:', error.details)
        console.error('Hint:', error.hint)
        if (error.code === '42501') {
            console.log('\n🔒 [RLS Policy Error] This is a Row Level Security issue.')
            console.log('To fix this, go to Supabase Dashboard -> Authentication -> Policies.')
            console.log('Create a policy for "properties" table to allow INSERT for authenticated users (or anon if appropriate).')
        }
    } else {
        console.log('✅ Insert Successful! Data:', data)
    }
}

testInsert()
