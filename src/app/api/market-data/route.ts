import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get('address');
  const bbl = searchParams.get('bbl');
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');

  if (!address && !bbl) {
    return NextResponse.json({ error: 'Address or BBL is required' }, { status: 400 });
  }

  const RENTCAST_API_KEY = process.env.RENTCAST_API_KEY;
  const CENSUS_API_KEY = process.env.CENSUS_API_KEY;

  // 1. Check Cache first (Supabase)
  let cachedData = null;
  if (address || bbl) {
    const query = supabase.from('properties').select('market_value, rent_estimate, market_data_updated_at, lat, lng');
    if (bbl) query.eq('bbl', bbl);
    else if (address) query.eq('address', address);
    
    const { data } = await query.single();
    if (data && data.market_data_updated_at) {
      const updatedAt = new Date(data.market_data_updated_at);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      if (updatedAt > thirtyDaysAgo) {
        cachedData = {
          price: data.market_value,
          rent_estimate: data.rent_estimate,
          lat: data.lat,
          lng: data.lng
        };
      }
    }
  }

  // 2. Fetch Property Data from RentCast if not cached
  let rentCastData = cachedData;
  if (!rentCastData && RENTCAST_API_KEY) {
    try {
      const url = new URL('https://api.rentcast.io/v1/properties');
      if (address) url.searchParams.append('address', address);
      
      const response = await fetch(url.toString(), {
        headers: { 'X-Api-Key': RENTCAST_API_KEY, 'Accept': 'application/json' },
      });

      if (response.ok) {
        const data = await response.json();
        const raw = data.length > 0 ? data[0] : null;
        if (raw) {
          rentCastData = {
            price: raw.price,
            rent_estimate: raw.rent_estimate,
            lat: raw.latitude,
            lng: raw.longitude
          };

          // Update Cache asynchronously
          const updateObj: any = {
            market_value: raw.price,
            rent_estimate: raw.rent_estimate,
            market_data_updated_at: new Date().toISOString()
          };
          // Also update lat/lng if missing
          if (raw.latitude) updateObj.lat = raw.latitude;
          if (raw.longitude) updateObj.lng = raw.longitude;

          if (bbl) supabase.from('properties').update(updateObj).eq('bbl', bbl).then();
          else if (address) supabase.from('properties').update(updateObj).eq('address', address).then();
        }
      }
    } catch (error) { console.error('RentCast API Error:', error); }
  }

  // 3. Fetch Real Census Data (FCC -> Census ACS)
  let neighborhoodData = { median_income: 0, rent_trend: 'Stable', market_status: 'Dynamic' };
  const currentLat = lat || rentCastData?.lat;
  const currentLng = lng || rentCastData?.lng;

  if (currentLat && currentLng) {
    try {
      // Step A: FCC Lookup for FIPS
      const fccUrl = `https://geo.fcc.gov/api/census/block/find?latitude=${currentLat}&longitude=${currentLng}&format=json`;
      const fccRes = await fetch(fccUrl);
      const fccData = await fccRes.json();
      const fips = fccData?.Block?.FIPS; // 15 digits: SSCCCTTTTTTBBBB

      if (fips) {
        const state = fips.substring(0, 2);
        const county = fips.substring(2, 5);
        const tract = fips.substring(5, 11);

        // Step B: US Census ACS lookup (2022 5-year estimate)
        // Variable B19013_001E is Median Household Income
        let censusUrl = `https://api.census.gov/data/2022/acs/acs5?get=B19013_001E&for=tract:${tract}&in=state:${state}%20county:${county}`;
        if (CENSUS_API_KEY) censusUrl += `&key=${CENSUS_API_KEY}`;
        
        const censusRes = await fetch(censusUrl);
        if (censusRes.ok) {
          const cData = await censusRes.json();
          // Census Response: [["B19013_001E", "state", "county", "tract"], ["85000", "36", "061", "001200"]]
          if (cData.length > 1) {
            neighborhoodData.median_income = parseInt(cData[1][0]) || 0;
            neighborhoodData.rent_trend = neighborhoodData.median_income > 75000 ? 'Rising' : 'Stable';
          }
        }
      }
    } catch (e) { console.error("Census Fetch Error:", e); }
  }

  return NextResponse.json({
    property: rentCastData || { price: 0, rent_estimate: 0, message: 'Data unavailable' },
    neighborhood: neighborhoodData,
    attribution: 'Data provided by RentCast, FCC, and US Census Bureau',
    cached: !!cachedData
  });
}
