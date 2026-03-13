import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { access_code, unit } = body

        if (!access_code || !unit) {
            return NextResponse.json({ error: 'Access Code and Unit are required.' }, { status: 400 })
        }

        // 1. Verify Property Access Code
        const { data: property, error: propError } = await supabaseAdmin
            .from('properties')
            .select('id, status, address')
            .eq('access_code', access_code)
            .single()

        if (propError || !property) {
            return NextResponse.json({ error: 'Invalid Access Code.' }, { status: 400 })
        }

        if (property.status === 'Pending Verification' || property.status === 'Rejected') {
            return NextResponse.json({ error: 'This property is not yet verified or active for tenant registration.' }, { status: 400 })
        }

        // 2. Prevent Duplicate Units
        const { data: existingTenant, error: tenantError } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .eq('property_id', property.id)
            .eq('unit', unit)
            .neq('status', 'Suspended') // Allow if old tenant was deleted/suspended
            .maybeSingle()

        if (existingTenant) {
            return NextResponse.json({ error: `Unit ${unit} is already registered by another tenant.` }, { status: 400 })
        }

        // 3. Success -> Return property id
        return NextResponse.json({ success: true, property_id: property.id, address: property.address }, { status: 200 })

    } catch (e: any) {
        console.error('Tenant Validation Error:', e)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
