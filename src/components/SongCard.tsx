import { Song } from '../types'

interface SongCardProps {
  song: Song
  isSelected: boolean
  onClick: () => void
}

export default function SongCard({ song, isSelected, onClick }: SongCardProps) {
  return (
    <div
      onClick={onClick}
      className={`
        p-4 border rounded-lg cursor-pointer transition-all
        ${isSelected 
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400' 
          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800'
        }
        hover:shadow-md dark:hover:shadow-lg
      `}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
            {song.title}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
            {song.artist}
          </p>
        </div>
        <div className="flex flex-col items-end ml-4">
          <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded">
            {song.bpm} BPM
          </span>
          <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded mt-1">
            {song.key}
          </span>
        </div>
      </div>
      
      <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
        <span>
          Source: {song.dataSource === 'generated' || song.dataSource === 'fallback' ? (
            <span className="text-orange-600 dark:text-orange-400">Estimated</span>
          ) : (
            <span className="text-green-600 dark:text-green-400">Spotify</span>
          )}
        </span>
      </div>
    </div>
  )
}