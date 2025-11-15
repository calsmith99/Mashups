'use client';

import { useState } from 'react';
import { Song } from '@/types';
import YouTubePlayer from './YouTubePlayer';
import { ArrowLeftRight, Music, X } from 'lucide-react';

interface MashupWorkspaceProps {
  leftSong: Song | null;
  rightSong: Song | null;
  onClearSong: (side: 'left' | 'right') => void;
  className?: string;
}

interface SongDisplayProps {
  song: Song | null;
  side: 'left' | 'right';
  type: 'instrumental' | 'acapella';
  onClearSong: (side: 'left' | 'right') => void;
  onTypeChange: (type: 'instrumental' | 'acapella') => void;
}

function SongDisplay({ 
  song, 
  side, 
  type,
  onClearSong,
  onTypeChange
}: SongDisplayProps) {
  return (
    <div className="space-y-4">
      {/* Track Type Selector */}
      <div className="flex items-center justify-between bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
          {song ? `${song.title} - ${song.artist}` : 'No track selected'}
        </label>
        <div className="flex items-center gap-2 flex-shrink-0">
          {song && (
            <button
              onClick={() => onClearSong(side)}
              className="p-1 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <select
            value={type}
            onChange={(e) => onTypeChange(e.target.value as 'instrumental' | 'acapella')}
            className="text-sm border border-gray-300 dark:border-gray-600 rounded px-3 py-1 bg-white dark:bg-gray-700 dark:text-gray-200 min-w-[110px]"
            disabled={!song}
          >
            <option value="instrumental">Instrumental</option>
            <option value="acapella">Acapella</option>
          </select>
        </div>
      </div>

      {/* Embedded Video Player */}
      <div className="h-[300px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        {song ? (
          <YouTubePlayer 
            song={song} 
            type={type}
            className="h-full"
            isVisible={true}
            autoSearch={false} // Require manual search to save API quota
          />
        ) : (
          <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900/50">
            <div className="text-center text-gray-400 dark:text-gray-500">
              <div className="w-16 h-16 mx-auto mb-3 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                <Music className="w-8 h-8" />
              </div>
              <p className="text-sm">Video will appear here</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MashupWorkspace({ 
  leftSong, 
  rightSong, 
  onClearSong, 
  className = '' 
}: MashupWorkspaceProps) {
  const [leftType, setLeftType] = useState<'instrumental' | 'acapella'>('instrumental');
  const [rightType, setRightType] = useState<'instrumental' | 'acapella'>('acapella');

  const swapTypes = () => {
    setLeftType(rightType);
    setRightType(leftType);
  };

  return (
    <div className={`${className}`}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SongDisplay 
          song={leftSong} 
          side="left" 
          type={leftType}
          onClearSong={onClearSong}
          onTypeChange={setLeftType}
        />
        
        <SongDisplay 
          song={rightSong} 
          side="right" 
          type={rightType}
          onClearSong={onClearSong}
          onTypeChange={setRightType}
        />
      </div>
      
      {leftSong && rightSong && (
        <div className="flex justify-center mt-4">
          <button
            onClick={swapTypes}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
            title="Swap instrumental/acapella"
          >
            <ArrowLeftRight className="w-4 h-4" />
            Swap Types
          </button>
        </div>
      )}
    </div>
  );
}