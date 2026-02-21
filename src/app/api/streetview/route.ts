import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const address = searchParams.get('address');

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    try {
        let imageUrl = '';

        if (apiKey && (lat || address)) {
            // Use Google Street View Static API
            const location = lat && lng ? `${lat},${lng}` : address;
            imageUrl = `https://maps.googleapis.com/maps/api/streetview?size=600x400&location=${encodeURIComponent(location!)}&key=${apiKey}`;
        } else {
            // Fallback: A specific nice NYC building image from Unsplash
            imageUrl = `https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=600&auto=format&fit=crop`;
        }

        // Proxy the image to bypass CORS for html-to-image
        const imageResponse = await fetch(imageUrl);

        if (!imageResponse.ok) {
            throw new Error(`Failed to fetch image: ${imageResponse.statusText}`);
        }

        const imageBuffer = await imageResponse.arrayBuffer();

        // Set CORS headers so html-to-image (canvas) doesn't get tainted
        const headers = new Headers();
        headers.set('Content-Type', imageResponse.headers.get('content-type') || 'image/jpeg');
        headers.set('Cache-Control', 'public, max-age=86400');
        headers.set('Access-Control-Allow-Origin', '*');

        return new NextResponse(imageBuffer, {
            status: 200,
            headers,
        });
    } catch (error) {
        console.error('Error fetching streetview image:', error);
        return NextResponse.json({ error: 'Failed to fetch image' }, { status: 500 });
    }
}
