'use client';

import { useState, useEffect, useCallback } from 'react';
import { Song, SearchResult } from '@/types';
import { musicService } from '@/services/musicService';
import SongCard from './SongCard';
import { Search, Loader2, AlertCircle } from 'lucide-react';

interface SearchPanelProps {
  title: string;
  selectedSong: Song | null;
  onSongSelect: (song: Song) => void;
  filterBpm?: number;
  filterKey?: string;
  excludeSongId?: string;
  className?: string;
}

export default function SearchPanel({ 
  title, 
  selectedSong, 
  onSongSelect, 
  filterBpm, 
  filterKey, 
  excludeSongId,
  className = '' 
}: SearchPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [filteredSongs, setFilteredSongs] = useState<Song[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedGenre, setSelectedGenre] = useState<string>('');
  const [searchTerms, setSearchTerms] = useState<string>('');

  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults(null);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const results = await musicService.searchSongs(query);
      setSearchResults(results);
    } catch (err) {
      console.error('Search failed:', err);
      setError('Failed to search songs. Using fallback data.');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadFilteredSongs = useCallback(async () => {
    if (filterBpm) {
      setLoading(true);
      setError(null);
      try {
        const songs = await musicService.getSongsByBpmAndKey(
          filterBpm, 
          filterKey || '', 
          excludeSongId,
          selectedGenre || undefined,
          searchTerms || undefined
        );
        setFilteredSongs(songs);
      } catch (err) {
        console.error('Failed to load filtered songs:', err);
        setError('Failed to load compatible songs.');
      } finally {
        setLoading(false);
      }
    } else {
      setFilteredSongs([]);
    }
  }, [filterBpm, filterKey, excludeSongId, selectedGenre, searchTerms]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery) {
        performSearch(searchQuery);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, performSearch]);

  useEffect(() => {
    if (filterBpm) {
      loadFilteredSongs();
    }
  }, [filterBpm, loadFilteredSongs]);

  const displaySongs = filterBpm ? filteredSongs : (searchResults?.songs || []);
  const showingFiltered = !!filterBpm;

  return (
    <div className={`flex flex-col h-full ${className}`}>
      <div className="flex-shrink-0 p-4 border-b bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h2>
            {showingFiltered && (
              <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                {filterBpm} BPM (+ double/half tempo)
              </div>
            )}
          </div>
          
          {showingFiltered && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Search Terms (optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. rock, pop, dance..."
                  value={searchTerms}
                  onChange={(e) => setSearchTerms(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Genre (optional)
                </label>
                <select
                  value={selectedGenre}
                  onChange={(e) => setSelectedGenre(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">All Genres</option>
                  <option value="pop">Pop</option>
                  <option value="rock">Rock</option>
                  <option value="hip-hop">Hip-Hop</option>
                  <option value="electronic">Electronic</option>
                  <option value="jazz">Jazz</option>
                  <option value="blues">Blues</option>
                  <option value="country">Country</option>
                  <option value="r-n-b">R&B</option>
                  <option value="indie">Indie</option>
                  <option value="alternative">Alternative</option>
                  <option value="dance">Dance</option>
                  <option value="reggae">Reggae</option>
                  <option value="reggaeton">Reggaeton</option>
                  <option value="latin">Latin</option>
                  <option value="funk">Funk</option>
                  <option value="house">House</option>
                  <option value="techno">Techno</option>
                </select>
              </div>
            </div>
          )}
          
          {!showingFiltered && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
              <input
                type="text"
                placeholder="Search for songs or artists..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>
          )}
          
          {showingFiltered && (
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Showing songs that match {filterBpm} BPM (including double/half tempo)
              {filterKey && ` and ${filterKey}`}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 bg-white dark:bg-gray-900">
        {error && (
          <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{error}</span>
            </div>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500 dark:text-blue-400 mx-auto mb-2" />
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                {showingFiltered ? 'Finding compatible tracks...' : 'Searching...'}
              </p>
            </div>
          </div>
        )}

        {!loading && displaySongs.length === 0 && searchQuery && !showingFiltered && (
          <div className="text-center py-8 text-gray-500">
            No songs found for &quot;{searchQuery}&quot;
          </div>
        )}

        {!loading && displaySongs.length === 0 && showingFiltered && (
          <div className="text-center py-8 text-gray-500">
            No compatible songs found. Try different search terms or genres.
          </div>
        )}

        {!loading && displaySongs.length === 0 && !searchQuery && !showingFiltered && (
          <div className="text-center py-8">
            <div className="max-w-sm mx-auto text-gray-500">
              <Search className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <h3 className="font-medium text-gray-900 mb-2">Search for Music</h3>
              <p className="text-sm mb-3">
                Search through Spotify&apos;s massive music database
              </p>
              <p className="text-xs text-gray-400">
                Powered by Spotify Web API
              </p>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {displaySongs.map((song) => (
            <SongCard
              key={song.id}
              song={song}
              onClick={() => onSongSelect(song)}
              isSelected={selectedSong?.id === song.id}
            />
          ))}
        </div>
      </div>
    </div>
  );
}