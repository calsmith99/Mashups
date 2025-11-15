export interface Song {
  id: string;
  title: string;
  artist: string;
  bpm: number;
  key: string;
  duration: number;
  spotify_id?: string;
  youtube_id?: string;
  dataSource?: 'musicbrainz' | 'fallback' | 'generated';
}

export interface SearchResult {
  songs: Song[];
  total: number;
  page: number;
}

export interface YouTubeVideo {
  id: string;
  title: string;
  duration: string;
  thumbnail: string;
}

export interface MashupPair {
  left: Song | null;
  right: Song | null;
}