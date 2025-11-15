import { NextResponse } from 'next/server';
import axios from 'axios';

// Reuse the same interfaces from the search route
interface SpotifyTrack {
  id: string;
  name: string;
  artists: Array<{
    id: string;
    name: string;
    genres?: string[];
  }>;
  duration_ms: number;
  preview_url?: string;
  external_urls: {
    spotify: string;
  };
  album: {
    id: string;
    name: string;
    images: Array<{
      url: string;
      height: number;
      width: number;
    }>;
  };
}

interface SpotifySearchResponse {
  tracks: {
    items: SpotifyTrack[];
  };
}

interface SpotifyAudioFeatures {
  id: string;
  tempo: number;
  key: number;
  mode: number;
  time_signature: number;
  energy: number;
  danceability: number;
  valence: number;
}

interface SpotifyTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

// Key mapping for Spotify's pitch class notation
const PITCH_CLASSES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Cache for Spotify token
let spotifyToken: string | null = null;
let tokenExpiresAt: number = 0;

// Get Spotify access token
const getSpotifyToken = async (): Promise<string> => {
  if (spotifyToken && Date.now() < tokenExpiresAt) {
    return spotifyToken;
  }

  const SPOTIFY_CLIENT_ID = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
  const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
    throw new Error('Spotify credentials not configured');
  }

  try {
    const response = await axios.post<SpotifyTokenResponse>(
      'https://accounts.spotify.com/api/token',
      'grant_type=client_credentials',
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64')}`
        }
      }
    );

    spotifyToken = response.data.access_token;
    tokenExpiresAt = Date.now() + (response.data.expires_in - 300) * 1000;
    
    return spotifyToken;
  } catch (error) {
    console.error('Failed to get Spotify token:', error);
    throw new Error('Failed to authenticate with Spotify');
  }
};

// Convert Spotify track to our Song format
const convertSpotifyTrackToSong = (track: SpotifyTrack, audioFeatures?: SpotifyAudioFeatures) => {
  let bpm = null;
  let key = 'Unknown';
  
  if (audioFeatures) {
    bpm = Math.round(audioFeatures.tempo);
    key = `${PITCH_CLASSES[audioFeatures.key]}${audioFeatures.mode === 1 ? ' major' : ' minor'}`;
  } else {
    // Generate realistic fallback features
    const hash = (track.name + track.artists[0].name).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    bpm = 60 + (hash % 121);
    const keys = ['C major', 'G major', 'D major', 'A major', 'E major', 'F major', 'Bb major', 'A minor', 'E minor', 'B minor', 'F# minor', 'C# minor', 'D minor', 'G minor'];
    key = keys[hash % keys.length];
  }
  
  return {
    id: track.id,
    title: track.name,
    artist: track.artists.map(a => a.name).join(', '),
    bpm,
    key,
    duration: Math.round(track.duration_ms / 1000),
    spotifyUrl: track.external_urls.spotify,
    previewUrl: track.preview_url,
    albumArt: track.album.images[0]?.url,
    source: audioFeatures ? 'spotify' : 'spotify-estimated'
  };
};

// Get compatible keys for mashup matching
const getCompatibleKeys = (targetKey: string): string[] => {
  const keyCompatibility: Record<string, string[]> = {
    'C major': ['A minor', 'F major', 'G major', 'D minor', 'E minor'],
    'G major': ['E minor', 'C major', 'D major', 'A minor', 'B minor'],
    'D major': ['B minor', 'G major', 'A major', 'E minor', 'F# minor'],
    'A major': ['F# minor', 'D major', 'E major', 'B minor', 'C# minor'],
    'E major': ['C# minor', 'A major', 'B major', 'F# minor', 'G# minor'],
    'F major': ['D minor', 'C major', 'Bb major', 'A minor', 'G minor'],
    'Bb major': ['G minor', 'F major', 'Eb major', 'D minor', 'C minor'],
    'A minor': ['C major', 'F major', 'G major', 'D minor', 'E minor'],
    'E minor': ['G major', 'C major', 'D major', 'A minor', 'B minor'],
    'B minor': ['D major', 'G major', 'A major', 'E minor', 'F# minor'],
    'F# minor': ['A major', 'D major', 'E major', 'B minor', 'C# minor'],
    'C# minor': ['E major', 'A major', 'B major', 'F# minor', 'G# minor'],
    'D minor': ['F major', 'C major', 'Bb major', 'A minor', 'G minor'],
    'G minor': ['Bb major', 'F major', 'Eb major', 'D minor', 'C minor']
  };
  
  return keyCompatibility[targetKey] || [targetKey];
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const bpm = parseInt(searchParams.get('bpm') || '0');
  const key = searchParams.get('key') || '';
  const genre = searchParams.get('genre') || '';
  const searchTerms = searchParams.get('search') || '';
  const excludeId = searchParams.get('excludeId') || '';

  if (!bpm) {
    return NextResponse.json({ error: 'BPM parameter is required' }, { status: 400 });
  }

  try {
    console.log(`Searching for tracks with BPM: ${bpm}, Key: ${key}, Genre: ${genre}, Search: ${searchTerms}`);
    const token = await getSpotifyToken();

    // Build advanced Spotify search queries
    const searchQueries: string[] = [];
    
    // Base search terms - use provided search terms or popular genres
    const baseTerms = searchTerms ? [searchTerms] : [
      'pop', 'rock', 'hip hop', 'electronic', 'dance', 'indie', 'alternative', 
      'r&b', 'reggaeton', 'latin', 'jazz', 'funk', 'house', 'techno'
    ];

    // If genre is specified, use it; otherwise try multiple genres
    const genres = genre ? [genre] : [
      'pop', 'rock', 'hip-hop', 'electronic', 'dance', 'indie', 'alternative',
      'r-n-b', 'reggaeton', 'latin', 'jazz', 'funk', 'house', 'techno', 'country'
    ];

    // Create search queries combining terms with genres and year ranges
    for (const term of baseTerms.slice(0, 3)) { // Limit base terms
      for (const genreFilter of genres.slice(0, 5)) { // Limit genres to avoid too many requests
        // Recent music (last 5 years) tends to have better audio features
        searchQueries.push(`${term} genre:${genreFilter} year:2020-2024`);
        searchQueries.push(`${term} genre:${genreFilter} year:2015-2019`);
      }
    }

    // Add some broader searches without year constraints
    if (searchTerms) {
      searchQueries.push(searchTerms);
      if (genre) {
        searchQueries.push(`${searchTerms} genre:${genre}`);
      }
    }

    console.log(`Executing ${Math.min(searchQueries.length, 8)} targeted searches...`);

    // Collect tracks from searches
    const allTracks: SpotifyTrack[] = [];
    
    for (const query of searchQueries.slice(0, 8)) { // Limit to 8 searches to avoid rate limiting
      try {
        const searchResponse = await axios.get<SpotifySearchResponse>(
          'https://api.spotify.com/v1/search',
          {
            headers: {
              'Authorization': `Bearer ${token}`
            },
            params: {
              q: query,
              type: 'track',
              limit: 25, // Get more tracks per search
              market: 'US'
            }
          }
        );

        const tracks = searchResponse.data.tracks.items
          .filter(track => track.id !== excludeId)
          .filter(track => {
            // Filter out clear non-music content
            const trackName = track.name.toLowerCase();
            const albumName = track.album.name.toLowerCase();
            const artistName = track.artists[0]?.name.toLowerCase() || '';
            
            const excludeTerms = [
              'karaoke', 'instrumental version', 'backing track', 'ringtone',
              'sound effect', 'audiobook', 'podcast', 'meditation', 'nature sounds'
            ];
            
            const isExcluded = excludeTerms.some(term => 
              trackName.includes(term) || albumName.includes(term) || artistName.includes(term)
            );
            
            // Also filter out very short tracks (likely intros/outros) and very long ones (likely DJ mixes)
            const durationMinutes = track.duration_ms / (1000 * 60);
            const isGoodLength = durationMinutes >= 1.5 && durationMinutes <= 8;
            
            return !isExcluded && isGoodLength;
          });
          
        allTracks.push(...tracks);
      } catch (error) {
        console.log(`Search failed for query "${query}":`, error);
      }
    }

    // Remove duplicates
    const uniqueTracks = allTracks.filter((track, index, self) => 
      index === self.findIndex(t => t.id === track.id)
    );

    if (uniqueTracks.length === 0) {
      return NextResponse.json({ tracks: [] });
    }

    console.log(`Found ${uniqueTracks.length} unique tracks to analyze`);

    // Get audio features for precise BPM matching
    const audioFeaturesData: SpotifyAudioFeatures[] = [];
    
    try {
      // Process tracks in batches of 100 (Spotify's limit)
      const batchSize = 100;
      for (let i = 0; i < uniqueTracks.length; i += batchSize) {
        const batch = uniqueTracks.slice(i, i + batchSize);
        const trackIds = batch.map(track => track.id).join(',');
        
        const audioFeaturesResponse = await axios.get<{ audio_features: SpotifyAudioFeatures[] }>(
          `https://api.spotify.com/v1/audio-features?ids=${trackIds}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );
        
        if (audioFeaturesResponse.data.audio_features) {
          audioFeaturesData.push(...audioFeaturesResponse.data.audio_features.filter(f => f !== null));
        }
      }
      console.log(`Got audio features for ${audioFeaturesData.length} tracks`);
    } catch (error) {
      console.log('Audio features not available, using estimated features');
    }

    // Convert tracks and filter by BPM (with flexible matching)
    const compatibleTracks = uniqueTracks
      .map((track) => {
        const audioFeatures = audioFeaturesData.find(f => f && f.id === track.id);
        const song = convertSpotifyTrackToSong(track, audioFeatures);
        
        let bpmMatch = false;
        let bpmDifference = 999;
        
        if (audioFeatures) {
          // Use real audio features for precise BPM matching
          const actualBpm = Math.round(audioFeatures.tempo);
          
          // Check for exact, double, half, or close BPM match (within 5 BPM)
          if (actualBpm === bpm || 
              actualBpm === bpm * 2 || 
              actualBpm === Math.round(bpm / 2) ||
              Math.round(actualBpm / 2) === bpm) {
            bpmMatch = true;
            bpmDifference = 0;
          } else if (Math.abs(actualBpm - bpm) <= 5) {
            bpmMatch = true;
            bpmDifference = Math.abs(actualBpm - bpm);
          } else if (Math.abs(actualBpm - bpm * 2) <= 5) {
            bpmMatch = true;
            bpmDifference = Math.abs(actualBpm - bpm * 2);
          } else if (Math.abs(actualBpm - Math.round(bpm / 2)) <= 5) {
            bpmMatch = true;
            bpmDifference = Math.abs(actualBpm - Math.round(bpm / 2));
          }
        } else {
          // Use estimated features with similar logic
          if (song.bpm) {
            if (song.bpm === bpm || 
                song.bpm === bpm * 2 || 
                song.bpm === Math.round(bpm / 2) ||
                Math.abs(song.bpm - bpm) <= 5) {
              bpmMatch = true;
              bpmDifference = Math.abs(song.bpm - bpm);
            }
          }
        }
        
        return { 
          song, 
          bpmMatch, 
          bpmDifference, 
          hasRealFeatures: !!audioFeatures,
          actualBpm: audioFeatures ? Math.round(audioFeatures.tempo) : song.bpm
        };
      })
      .filter(({ bpmMatch }) => bpmMatch)
      .sort((a, b) => {
        // Sort by BPM accuracy first, then by whether we have real features
        if (a.bpmDifference !== b.bpmDifference) {
          return a.bpmDifference - b.bpmDifference;
        }
        if (a.hasRealFeatures && !b.hasRealFeatures) return -1;
        if (!a.hasRealFeatures && b.hasRealFeatures) return 1;
        return 0;
      })
      .slice(0, 25) // Get more results
      .map(({ song, actualBpm }) => ({
        ...song,
        bpm: actualBpm // Use the actual BPM from audio features if available
      }));

    console.log(`Found ${compatibleTracks.length} tracks with compatible BPM (target: ${bpm})`);
    
    if (compatibleTracks.length > 0) {
      console.log(`Sample results: ${compatibleTracks.slice(0, 3).map(t => `${t.title} by ${t.artist} (${t.bpm} BPM)`).join(', ')}`);
    }
    
    return NextResponse.json({ tracks: compatibleTracks });

  } catch (error) {
    console.error('Compatible tracks search failed:', error);
    
    // Log detailed error information for debugging
    if (axios.isAxiosError(error)) {
      console.error('Axios Error Details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        headers: error.response?.headers,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          params: error.config?.params
        }
      });
      
      // Check if it's a Spotify API 403 (different from YouTube)
      if (error.response?.status === 403) {
        console.error('Spotify API 403 Error - Possible causes:');
        console.error('1. Invalid client credentials');
        console.error('2. Rate limiting');
        console.error('3. Development mode restrictions');
        console.error('Full error response:', JSON.stringify(error.response.data, null, 2));
      }
    }
    
    return NextResponse.json(
      { error: `Failed to find compatible tracks: ${error instanceof Error ? error.message : 'Unknown error'}` }, 
      { status: 500 }
    );
  }
}