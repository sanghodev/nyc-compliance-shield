import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const text = searchParams.get('text');

  if (!text) {
    return NextResponse.json({ error: 'Query parameter "text" is required' }, { status: 400 });
  }

  try {
    const apiUrl = `https://geosearch.planninglabs.nyc/v2/search?text=${encodeURIComponent(text)}`;
    const response = await fetch(apiUrl, {
      headers: {
        'Accept': 'application/json',
      },
      // Adding a reasonable timeout for server-side fetch
      signal: AbortSignal.timeout(10000), 
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`GeoSearch API error (${response.status}):`, errorText);
      return NextResponse.json({ error: 'Failed to fetch from NYC GeoSearch API' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('GeoSearch Proxy error:', error);
    return NextResponse.json({ 
      error: 'Internal server error during GeoSearch',
      message: error.message 
    }, { status: 500 });
  }
}
