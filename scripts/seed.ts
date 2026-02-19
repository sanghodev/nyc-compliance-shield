
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })
dotenv.config({ path: '.env' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! // Or service key if available

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Key')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

const properties = [
    {
        address: "123 Broadway, NY",
        borough: "Manhattan",
        units: 12,
        status: "Critical",
        violations: 5,
        lat: 40.7128,
        lng: -74.0060,
        image: "https://images.unsplash.com/photo-1460317442991-0ec209397118?auto=format&fit=crop&w=400",
        compliance_score: "C-",
        open_tickets: 5
    },
    {
        address: "450 5th Ave, NY",
        borough: "Manhattan",
        units: 45,
        status: "Warning",
        violations: 2,
        lat: 40.7527,
        lng: -73.9822,
        image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=400",
        compliance_score: "B",
        open_tickets: 2
    },
    {
        address: "789 Bedford Ave, BK",
        borough: "Brooklyn",
        units: 8,
        status: "Good",
        violations: 0,
        lat: 40.6960,
        lng: -73.9575,
        image: "https://images.unsplash.com/photo-1574958269340-fa927503f3dd?auto=format&fit=crop&w=400",
        compliance_score: "A+",
        open_tickets: 0
    }
]

const contractors = [
    { name: "Mario Bros Plumbing", type: "Plumbing", rating: 4.9, status: "Available", jobs: 12, avatar: "Mario" },
    { name: "Sparky Electric", type: "Electrical", rating: 4.7, status: "Busy", jobs: 8, avatar: "Sparky" },
    { name: "NYC Fix-It All", type: "General", rating: 4.5, status: "Available", jobs: 24, avatar: "Fix" },
    { name: "Legal Eagles LLP", type: "Legal", rating: 5.0, status: "Connected", jobs: 5, avatar: "Legal" }
]

const requests = [
    { tenant_name: "Sarah Jenkins", unit: "4B (123 Broadway)", issue: "Leaking faucet in bathroom", type: "Repair", status: "Pending", priority: "Medium" },
    { tenant_name: "Mike Ross", unit: "2A (450 5th Ave)", issue: "Heater making loud noise", type: "Repair", status: "Assigned", priority: "High" }
]

async function seed() {
    console.log('Seeding properties...')
    const { error: pError } = await supabase.from('properties').upsert(properties, { onConflict: 'address' })
    if (pError) console.error('Error seeding properties:', pError)
    else console.log('Properties seeded.')

    console.log('Seeding contractors...')
    const { error: cError } = await supabase.from('contractors').upsert(contractors, { onConflict: 'name' })
    if (cError) console.error('Error seeding contractors:', cError)
    else console.log('Contractors seeded.')

    console.log('Seeding requests...')
    // Requests usually don't have unique constraint for upsert easily without ID, so just insert
    const { error: rError } = await supabase.from('requests').insert(requests)
    if (rError) console.error('Error seeding requests:', rError)
    else console.log('Requests seeded.')
}

seed()
