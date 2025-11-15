'use client';

import { useState } from 'react';
import { Song } from '@/types';
import SearchPanel from '@/components/SearchPanel';
import MashupWorkspace from '@/components/MashupWorkspace';
import ThemeToggle from '@/components/ThemeToggle';
import { Music, Headphones } from 'lucide-react';

export default function Home() {
  const [leftSong, setLeftSong] = useState<Song | null>(null);
  const [rightSong, setRightSong] = useState<Song | null>(null);

  const handleClearSong = (side: 'left' | 'right') => {
    if (side === 'left') {
      setLeftSong(null);
    } else {
      setRightSong(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-200">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                <Music className="w-8 h-8" />
                <Headphones className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Mashup Discovery Tool</h1>
                <p className="text-gray-600 dark:text-gray-400">Find songs with matching BPM and key for perfect mashups</p>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-col h-[calc(100vh-120px)]">
        {/* Mashup Workspace */}
        {(leftSong || rightSong) && (
          <div className="h-1/2 flex-shrink-0 border-b border-gray-200 dark:border-gray-700">
            <MashupWorkspace
              leftSong={leftSong}
              rightSong={rightSong}
              onClearSong={handleClearSong}
              className="h-full"
            />
          </div>
        )}

        {/* Search Panels */}
        <div className={`flex flex-col lg:flex-row ${(leftSong || rightSong) ? 'h-1/2' : 'h-full'} transition-all duration-300`}>
          {/* Left Search Panel */}
          <div className="w-full lg:w-1/2 border-r border-gray-200 dark:border-gray-700">
            <SearchPanel
              title="Track Selection"
              selectedSong={leftSong}
              onSongSelect={setLeftSong}
              className="h-full"
            />
          </div>

          {/* Right Search Panel */}
          <div className="w-full lg:w-1/2">
            <SearchPanel
              title="BPM Compatible Tracks"
              selectedSong={rightSong}
              onSongSelect={setRightSong}
              filterBpm={leftSong?.bpm}
              filterKey={leftSong?.key}
              excludeSongId={leftSong?.id}
              className="h-full"
            />
          </div>
        </div>
      </div>

      {/* Instructions */}
      {!leftSong && !rightSong && (
        <div className="p-8 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">How to Use</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="text-blue-600 font-semibold mb-2">1. Search for a Track</div>
                <p className="text-gray-600 text-sm">
                  Use the left panel to search for songs or artists to find your base track.
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="text-blue-600 font-semibold mb-2">2. Find Compatible Tracks</div>
                <p className="text-gray-600 text-sm">
                  The right panel will automatically show tracks with matching BPM and key.
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="text-blue-600 font-semibold mb-2">3. Create Your Mashup</div>
                <p className="text-gray-600 text-sm">
                  Preview instrumental and acapella versions to plan your perfect mashup.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}