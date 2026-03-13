
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient, supabaseAdmin } from './supabaseClient'

/**
 * Verifies if the request is made by an authorized user and optionally checks for a specific role.
 */
export async function verifyAuth(req: NextRequest, requiredRole?: 'admin' | 'manager' | 'tenant') {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return { user: null, error: 'Missing Authorization header', status: 401 }
  }

  const supabase = getSupabaseServerClient(authHeader)
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return { user: null, error: 'Invalid or expired token', status: 401 }
  }

  if (requiredRole) {
    // Check role in profiles table via admin client (RLS might block reading own profile if not configured yet)
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || profile.role !== requiredRole) {
      return { user, error: `Unauthorized: Required role ${requiredRole}`, status: 403 }
    }
  }

  return { user, error: null }
}

/**
 * Verifies if the authenticated user owns or manages a specific property.
 */
export async function verifyPropertyAccess(userId: string, propertyId: number, userRole: string) {
  if (userRole === 'admin') return true

  if (userRole === 'manager') {
    const { data, error } = await supabaseAdmin
      .from('properties')
      .select('id')
      .eq('id', propertyId)
      .eq('manager_id', userId)
      .single()
    
    return !!data && !error
  }

  if (userRole === 'tenant') {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('property_id')
      .eq('id', userId)
      .single()
    
    return !!data && data.property_id === propertyId && !error
  }

  return false
}
