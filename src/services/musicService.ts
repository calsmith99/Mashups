import axios from 'axios';
import { Song, SearchResult, YouTubeVideo } from '@/types';

// Spotify API interfaces
interface SpotifyTrack {
  id: string;
  name: string;
  artists: Array<{
    id: string;
    name: string;
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
    total: number;
    limit: number;
    offset: number;
  };
}

interface SpotifyAudioFeatures {
  id: string;
  tempo: number; // BPM
  key: number; // Pitch class (0-11)
  mode: number; // 0 = minor, 1 = major
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

// Spotify API configuration
const SPOTIFY_CLIENT_ID = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

// Key mapping for Spotify's pitch class notation
const PITCH_CLASSES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Cache for Spotify token
let spotifyToken: string | null = null;
let tokenExpiresAt: number = 0;

// Get Spotify access token
const getSpotifyToken = async (): Promise<string> => {
  // Return cached token if still valid
  if (spotifyToken && Date.now() < tokenExpiresAt) {
    return spotifyToken;
  }

  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
    throw new Error('Spotify credentials not configured. Please set NEXT_PUBLIC_SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET');
  }

  try {
    const response = await axios.post<SpotifyTokenResponse>(
      'https://accounts.spotify.com/api/token',
      'grant_type=client_credentials',
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${btoa(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`)}`
        }
      }
    );

    spotifyToken = response.data.access_token;
    tokenExpiresAt = Date.now() + (response.data.expires_in * 1000) - 60000; // Refresh 1 minute early
    
    return spotifyToken;
  } catch (error) {
    console.error('Failed to get Spotify token:', error);
    throw new Error('Failed to authenticate with Spotify');
  }
};

// Generate realistic fallback key and BPM based on artist/title patterns
const generateFallbackFeatures = (title: string, artist: string): { bpm: number; key: string } => {
  // Common musical keys
  const keys = [
    'C major', 'G major', 'D major', 'A major', 'E major', 'B major', 'F# major',
    'C# major', 'F major', 'Bb major', 'Eb major', 'Ab major', 'Db major',
    'A minor', 'E minor', 'B minor', 'F# minor', 'C# minor', 'G# minor',
    'D# minor', 'D minor', 'G minor', 'C minor', 'F minor', 'Bb minor'
  ];
  
  // Create a simple hash from title + artist for consistent results
  const hash = (title + artist).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  // Generate BPM between 60-180 based on hash
  const bpm = 60 + (hash % 121);
  
  // Generate key based on hash
  const keyIndex = hash % keys.length;
  const key = keys[keyIndex];
  
  return { bpm, key };
};

// Convert Spotify track to Song format
const convertSpotifyTrackToSong = async (track: SpotifyTrack, token: string): Promise<Song> => {
  try {
    // Get audio features for BPM and key
    const audioFeaturesResponse = await axios.get<SpotifyAudioFeatures>(
      `https://api.spotify.com/v1/audio-features/${track.id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    const features = audioFeaturesResponse.data;
    const keyNote = PITCH_CLASSES[features.key] || 'Unknown';
    const keyMode = features.mode === 1 ? 'major' : 'minor';
    const key = `${keyNote} ${keyMode}`;

    return {
      id: track.id,
      title: track.name,
      artist: track.artists.map(artist => artist.name).join(', '),
      bpm: Math.round(features.tempo),
      key,
      duration: Math.round(track.duration_ms / 1000),
      spotify_id: track.id,
      youtube_id: undefined,
      dataSource: 'musicbrainz' // Using Spotify as the real data source
    };
  } catch (error) {
    console.error('Failed to get audio features for track:', track.id, error);
    
    // Fallback without audio features
    const fallbackFeatures = generateFallbackFeatures(track.name, track.artists[0]?.name || 'Unknown');
    
    return {
      id: track.id,
      title: track.name,
      artist: track.artists.map(artist => artist.name).join(', '),
      bpm: fallbackFeatures.bpm,
      key: fallbackFeatures.key,
      duration: Math.round(track.duration_ms / 1000),
      spotify_id: track.id,
      youtube_id: undefined,
      dataSource: 'fallback'
    };
  }
};

// Mock data fallback for when Spotify API fails or credentials are missing
const FALLBACK_SONGS: Song[] = [
  {
    id: '1',
    title: 'Blinding Lights',
    artist: 'The Weeknd',
    bpm: 171,
    key: 'F# minor',
    duration: 200,
    youtube_id: '4NRXx6U8ABQ',
    dataSource: 'fallback'
  },
  {
    id: '2',
    title: 'Watermelon Sugar',
    artist: 'Harry Styles',
    bpm: 95,
    key: 'C major',
    duration: 174,
    youtube_id: 'E07s5ZYygMg',
    dataSource: 'fallback'
  },
  {
    id: '3',
    title: 'Levitating',
    artist: 'Dua Lipa',
    bpm: 103,
    key: 'B major',
    duration: 203,
    youtube_id: 'TUVcZfQe-Kw',
    dataSource: 'fallback'
  },
  {
    id: '4',
    title: 'Good 4 U',
    artist: 'Olivia Rodrigo',
    bpm: 166,
    key: 'A major',
    duration: 178,
    youtube_id: 'gNi_6U5Pm_o',
    dataSource: 'fallback'
  },
  {
    id: '5',
    title: 'Stay',
    artist: 'The Kid LAROI & Justin Bieber',
    bpm: 95,
    key: 'C major',
    duration: 141,
    youtube_id: 'kTJczUoc26U',
    dataSource: 'fallback'
  },
  {
    id: '6',
    title: 'Bad Habits',
    artist: 'Ed Sheeran',
    bpm: 126,
    key: 'B minor',
    duration: 231,
    youtube_id: 'orJSJGHjBLI',
    dataSource: 'fallback'
  },
  {
    id: '7',
    title: 'Industry Baby',
    artist: 'Lil Nas X ft. Jack Harlow',
    bpm: 150,
    key: 'D minor',
    duration: 212,
    youtube_id: 'UTHLKHL_whs',
    dataSource: 'fallback'
  },
  {
    id: '8',
    title: 'Heat Waves',
    artist: 'Glass Animals',
    bpm: 80,
    key: 'E minor',
    duration: 238,
    youtube_id: 'mRD0-GxqHVo',
    dataSource: 'fallback'
  }
];

export const musicService = {
  async searchSongs(query: string, page: number = 1, limit: number = 10): Promise<SearchResult> {
    try {
      console.log('Searching for:', query);
      
      const response = await axios.get(`/api/search?q=${encodeURIComponent(query)}`);
      
      if (response.data.tracks) {
        console.log(`Found ${response.data.tracks.length} tracks from Spotify API`);
        return {
          songs: response.data.tracks,
          total: response.data.tracks.length,
          page
        };
      }

      // If no tracks found, return empty result
      return {
        songs: [],
        total: 0,
        page
      };

    } catch (error) {
      console.error('Search failed, using fallback data:', error);
      
      // Fallback to local data if API fails
      const filtered = FALLBACK_SONGS.filter(song => 
        song.title.toLowerCase().includes(query.toLowerCase()) ||
        song.artist.toLowerCase().includes(query.toLowerCase())
      );
      
      const start = (page - 1) * limit;
      const end = start + limit;
      const songs = filtered.slice(start, end);
      
      return {
        songs,
        total: filtered.length,
        page
      };
    }
  },

  async getSongsByBpmAndKey(bpm: number, key: string, excludeId?: string, genre?: string, searchTerms?: string): Promise<Song[]> {
    try {
      console.log(`Searching for compatible tracks: BPM ${bpm}, Key ${key}, Genre: ${genre || 'any'}, Search: ${searchTerms || 'any'}`);
      
      const params = new URLSearchParams({
        bpm: bpm.toString(),
      });
      
      if (key) {
        params.append('key', key);
      }
      
      if (excludeId) {
        params.append('excludeId', excludeId);
      }
      
      if (genre) {
        params.append('genre', genre);
      }
      
      if (searchTerms) {
        params.append('search', searchTerms);
      }
      
      const response = await axios.get(`/api/compatible?${params}`);
      
      if (response.data.tracks) {
        console.log(`Found ${response.data.tracks.length} compatible tracks from Spotify`);
        return response.data.tracks;
      }

      return [];
    } catch (error) {
      console.error('Compatible tracks search failed:', error);
      
      // Return fallback data if API fails
      const filtered = FALLBACK_SONGS.filter(song => 
        song.bpm === bpm && 
        (!key || song.key === key) && 
        song.id !== excludeId
      );
      
      return filtered.slice(0, 10);
    }
  },

  async searchYouTubeVideos(query: string, type: 'instrumental' | 'acapella' = 'instrumental'): Promise<YouTubeVideo[]> {
    try {
      // Track quota usage on client side
      if (typeof window !== 'undefined') {
        const event = new CustomEvent('youtube-quota-used', { detail: { units: 30 } });
        window.dispatchEvent(event);
      }
      
      const response = await axios.get('/api/youtube', {
        params: {
          q: query,
          type: type
        }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to search YouTube videos:', error);
      return [];
    }
  }
};

// Utility functions
export const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const getCompatibleKeys = (key: string): string[] => {
  // Musical theory for compatible keys (Circle of Fifths relationships)
  const keyCompatibility: { [key: string]: string[] } = {
    // Major keys
    'C major': ['A minor', 'F major', 'G major', 'D minor', 'E minor'],
    'G major': ['E minor', 'C major', 'D major', 'A minor', 'B minor'],
    'D major': ['B minor', 'G major', 'A major', 'E minor', 'F# minor'],
    'A major': ['F# minor', 'D major', 'E major', 'B minor', 'C# minor'],
    'E major': ['C# minor', 'A major', 'B major', 'F# minor', 'G# minor'],
    'B major': ['G# minor', 'E major', 'F# major', 'C# minor', 'D# minor'],
    'F# major': ['D# minor', 'B major', 'C# major', 'G# minor', 'A# minor'],
    'C# major': ['A# minor', 'F# major', 'G# major', 'D# minor', 'F minor'],
    'F major': ['D minor', 'C major', 'Bb major', 'A minor', 'G minor'],
    'Bb major': ['G minor', 'F major', 'Eb major', 'D minor', 'C minor'],
    'Eb major': ['C minor', 'Bb major', 'Ab major', 'G minor', 'F minor'],
    'Ab major': ['F minor', 'Eb major', 'Db major', 'C minor', 'Bb minor'],
    'Db major': ['Bb minor', 'Ab major', 'Gb major', 'F minor', 'Eb minor'],
    
    // Minor keys
    'A minor': ['C major', 'F major', 'G major', 'D minor', 'E minor'],
    'E minor': ['G major', 'C major', 'D major', 'A minor', 'B minor'],
    'B minor': ['D major', 'G major', 'A major', 'E minor', 'F# minor'],
    'F# minor': ['A major', 'D major', 'E major', 'B minor', 'C# minor'],
    'C# minor': ['E major', 'A major', 'B major', 'F# minor', 'G# minor'],
    'G# minor': ['B major', 'E major', 'F# major', 'C# minor', 'D# minor'],
    'D# minor': ['F# major', 'B major', 'C# major', 'G# minor', 'A# minor'],
    'A# minor': ['C# major', 'F# major', 'D# major', 'D# minor', 'F minor'],
    'D minor': ['F major', 'C major', 'Bb major', 'A minor', 'G minor'],
    'G minor': ['Bb major', 'F major', 'Eb major', 'D minor', 'C minor'],
    'C minor': ['Eb major', 'Bb major', 'Ab major', 'G minor', 'F minor'],
    'F minor': ['Ab major', 'Eb major', 'Db major', 'C minor', 'Bb minor'],
    'Bb minor': ['Db major', 'Ab major', 'Gb major', 'F minor', 'Eb minor'],
  };
  
  return keyCompatibility[key] || [key];
};