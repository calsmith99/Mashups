'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import YouTube, { YouTubeProps } from 'react-youtube';
import { YouTubeVideo } from '@/types';
import { musicService } from '@/services/musicService';
import { Play, Loader2, ChevronDown, ChevronUp } from 'lucide-react';

interface YouTubePlayerProps {
  song: {
    title: string;
    artist: string;
  };
  type: 'instrumental' | 'acapella';
  className?: string;
  isVisible?: boolean; // Only search when actually visible
  autoSearch?: boolean; // Whether to automatically search or wait for user action
}

// Global cache to persist across component re-renders
const videoCache = new Map<string, YouTubeVideo[]>();

export default function YouTubePlayer({ song, type, className = '', isVisible = true, autoSearch = false }: YouTubePlayerProps) {
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<YouTubeVideo | null>(null);
  const [loading, setLoading] = useState(false);
  const [showOtherVideos, setShowOtherVideos] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const performSearch = useCallback(async () => {
    // Create cache key
    const cacheKey = `${song.title}-${song.artist}-${type}`;
    
    // Check cache first
    if (videoCache.has(cacheKey)) {
      console.log(`Using cached YouTube results for ${cacheKey}`);
      const cachedVideos = videoCache.get(cacheKey)!;
      setVideos(cachedVideos);
      if (cachedVideos.length > 0) {
        setSelectedVideo(cachedVideos[0]);
      }
      setHasSearched(true);
      return;
    }

    setLoading(true);
    try {
      console.log(`Searching YouTube for: ${song.title} by ${song.artist} (${type}) - API call will use ~30 quota units`);
      const query = `${song.title} ${song.artist}`;
      const results = await musicService.searchYouTubeVideos(query, type);
      
      // Cache the results
      videoCache.set(cacheKey, results);
      
      setVideos(results);
      if (results.length > 0) {
        setSelectedVideo(results[0]);
      }
      setHasSearched(true);
    } catch (error) {
      console.error('Failed to search YouTube videos:', error);
      // Don't cache errors, allow retry
    } finally {
      setLoading(false);
    }
  }, [song.title, song.artist, type]);

  useEffect(() => {
    // Clear any pending searches
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Reset search state when song or type changes
    setHasSearched(false);
    setVideos([]);
    setSelectedVideo(null);

    // Only auto-search if enabled, visible and we have a song
    if (!autoSearch || !isVisible || !song?.title || !song?.artist) {
      return;
    }

    // Debounce the search to avoid rapid API calls
    searchTimeoutRef.current = setTimeout(() => {
      performSearch();
    }, 500); // Wait 500ms before searching

    // Cleanup timeout on unmount
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [song.title, song.artist, type, isVisible, autoSearch, performSearch]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-2" />
          <p className="text-sm text-gray-500">Loading videos...</p>
        </div>
      </div>
    );
  }

  // Show search prompt if we haven't searched yet and auto-search is disabled
  if (!hasSearched && !autoSearch && song?.title && song?.artist) {
    const cacheKey = `${song.title}-${song.artist}-${type}`;
    const hasCachedResults = videoCache.has(cacheKey);
    
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <div className="text-center p-6">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
            <Play className="w-8 h-8 text-gray-500" />
          </div>
          <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
            {hasCachedResults ? 'Load Cached Videos' : 'Search YouTube'}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            {hasCachedResults 
              ? 'We have cached results for this song'
              : `Find ${type} versions of "${song.title}"`
            }
          </p>
          <button
            onClick={performSearch}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            {hasCachedResults 
              ? '📋 Load Cached Results (No API usage)'
              : '🔍 Search Videos (~30 quota units)'
            }
          </button>
        </div>
      </div>
    );
  }

  const youtubeOptions: YouTubeProps['opts'] = {
    height: '200',
    width: '100%',
    playerVars: {
      autoplay: 0,
      modestbranding: 1,
      rel: 0,
      showinfo: 0,
    },
  };

  const handleVideoReady = () => {
    // Video is ready to play
  };

  const handleVideoStateChange = (event: { data: number }) => {
    // 1 = playing, 2 = paused
    setIsPlaying(event.data === 1);
  };

  const selectVideo = (video: YouTubeVideo) => {
    setSelectedVideo(video);
    setIsPlaying(false);
  };

  return (
    <div className={`bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 min-h-0 flex flex-col ${className}`}>
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 capitalize">
          {type} Version
        </h3>
        <Play className={`w-4 h-4 ${isPlaying ? 'text-green-500' : 'text-gray-600 dark:text-gray-400'}`} />
      </div>

      {loading && (
        <div className="flex items-center justify-center h-48 bg-gray-100 dark:bg-gray-800 rounded flex-shrink-0">
          <Loader2 className="w-6 h-6 animate-spin text-gray-600 dark:text-gray-400" />
        </div>
      )}

      {!loading && videos.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded flex-shrink-0">
          No {type} versions found
        </div>
      )}

      {!loading && selectedVideo && (
        <div className="space-y-3 min-h-0 flex-1 flex flex-col">
          {/* YouTube Player */}
          <div className="aspect-video bg-gray-900 rounded overflow-hidden flex-shrink-0 w-full max-w-full">
            {selectedVideo.id.startsWith('mock') ? (
              // Fallback for mock data when YouTube API is not configured
              <div className="w-full h-full flex items-center justify-center bg-gray-800">
                <div className="text-center text-white">
                  <Play className="w-12 h-12 mx-auto mb-2" />
                  <p className="text-sm">YouTube API not configured</p>
                  <p className="text-xs opacity-70">Add YOUTUBE_API_KEY to .env.local</p>
                </div>
              </div>
            ) : (
              <YouTube
                videoId={selectedVideo.id}
                opts={youtubeOptions}
                onReady={handleVideoReady}
                onStateChange={handleVideoStateChange}
                className="w-full h-full"
              />
            )}
          </div>

          {/* Video Info */}
          <div className="flex-shrink-0">
            <h4 className="font-medium text-sm text-gray-900 dark:text-gray-100 line-clamp-2">
              {selectedVideo.title}
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Duration: {selectedVideo.duration}
            </p>
          </div>

          {/* Video Options */}
          {videos.length > 1 && (
            <div className="space-y-2 flex-shrink-0">
              <button
                onClick={() => setShowOtherVideos(!showOtherVideos)}
                className="flex items-center justify-between w-full text-xs text-gray-600 dark:text-gray-400 font-medium hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                <span>Other versions ({videos.length - 1})</span>
                {showOtherVideos ? (
                  <ChevronUp className="w-3 h-3" />
                ) : (
                  <ChevronDown className="w-3 h-3" />
                )}
              </button>
              
              {showOtherVideos && (
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {videos.slice(1).map((video) => (
                    <button
                      key={video.id}
                      onClick={() => selectVideo(video)}
                      className={`w-full text-left p-2 text-xs rounded border transition-colors ${
                        selectedVideo?.id === video.id
                          ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-600'
                          : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                      }`}
                    >
                      <div className="truncate text-gray-900 dark:text-gray-100">{video.title}</div>
                      <div className="text-gray-500 dark:text-gray-400">{video.duration}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}