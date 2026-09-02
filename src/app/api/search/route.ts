import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const origin = searchParams.get('origin') || searchParams.get('departure');
  const destination = searchParams.get('destination') || searchParams.get('arrival');
  const date = searchParams.get('date');
  const departureTime = searchParams.get('departure_time') || '00:00:00';
  const limit = searchParams.get('limit') || '20';

  try {
    const backendUrl = `https://trainnomad-sql.onrender.com/search?origin=${encodeURIComponent(origin || '')}&destination=${encodeURIComponent(destination || '')}&date=${date}&departure_time=${encodeURIComponent(departureTime)}&limit=${limit}`;
    
    const response = await fetch(backendUrl);
    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error("Erreur proxy API:", error);
    return NextResponse.json({ error: "Erreur lors de la récupération" }, { status: 500 });
  }
}