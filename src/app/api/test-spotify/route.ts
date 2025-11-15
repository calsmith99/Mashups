import { NextResponse } from 'next/server';

export async function GET() {
  const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  return NextResponse.json({
    hasClientId: !!clientId,
    hasClientSecret: !!clientSecret,
    clientIdLength: clientId?.length || 0,
    clientSecretLength: clientSecret?.length || 0,
    // Don't expose actual values for security
    clientIdPreview: clientId ? `${clientId.substring(0, 4)}...` : 'undefined',
    clientSecretPreview: clientSecret ? `${clientSecret.substring(0, 4)}...` : 'undefined'
  });
}