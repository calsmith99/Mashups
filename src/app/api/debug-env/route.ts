import { NextResponse } from 'next/server';

export async function GET() {
  const youtubeKey = process.env.YOUTUBE_API_KEY || process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
  
  return NextResponse.json({
    hasYoutubeKey: !!youtubeKey,
    keyLength: youtubeKey?.length || 0,
    keyPreview: youtubeKey ? `${youtubeKey.substring(0, 8)}...` : 'not found',
    foundAs: youtubeKey === process.env.YOUTUBE_API_KEY ? 'YOUTUBE_API_KEY' : 
             youtubeKey === process.env.NEXT_PUBLIC_YOUTUBE_API_KEY ? 'NEXT_PUBLIC_YOUTUBE_API_KEY' : 
             'not found',
    allYoutubeEnvVars: Object.keys(process.env).filter(key => key.includes('YOUTUBE')),
    envFileExists: !!process.env.NODE_ENV,
    recommendation: youtubeKey === process.env.NEXT_PUBLIC_YOUTUBE_API_KEY ? 
      'SECURITY WARNING: Rename NEXT_PUBLIC_YOUTUBE_API_KEY to YOUTUBE_API_KEY to keep it server-side only' : 
      'Configuration looks good'
  });
}