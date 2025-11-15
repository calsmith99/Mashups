import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Basic health check - ensure the app is running
    return NextResponse.json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      service: 'mashup-discovery-tool',
      version: '1.0.0'
    });
  } catch (error) {
    return NextResponse.json(
      { 
        status: 'unhealthy', 
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString() 
      }, 
      { status: 500 }
    );
  }
}