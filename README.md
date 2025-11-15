# Mashup Discovery Tool

A self-hosted web application for discovering mashup ideas by finding songs with matching BPM and key signatures.

![Mashup Discovery Tool](https://via.placeholder.com/800x400/4F46E5/FFFFFF?text=Mashup+Discovery+Tool)

## Features

- **Spotify Integration**: Search through Spotify's curated database of popular songs
- **Real Audio Analysis**: Get actual BPM and key data from Spotify's audio features API
- **Dual-Panel Search Interface**: Search for songs on the left, automatically find compatible tracks on the right
- **BPM and Key Matching**: Automatically filter tracks with identical BPM and key signatures
- **YouTube Integration**: Preview instrumental and acapella versions with embedded YouTube players
- **Real YouTube Search**: Automatically searches for instrumental and acapella versions of your selected tracks
- **Responsive Design**: Optimized for both desktop and mobile devices
- **Self-Hosting Ready**: Easy to deploy and run on your own server
- **Real-time Compatibility Check**: Visual indicators for track compatibility
- **Professional Data**: Uses Spotify's curated music database for better quality results

## Tech Stack

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type safety and better development experience
- **Tailwind CSS** - Utility-first CSS framework for responsive design
- **Lucide React** - Beautiful and consistent icons
- **Axios** - HTTP client for API requests
- **Spotify Web API** - Professional music database with accurate metadata
- **Spotify Audio Features** - Real BPM and key detection from audio analysis

## Getting Started

### Prerequisites

- Node.js 18.18 or later
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd mashup-discovery
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure API credentials**
   ```bash
   cp env.example .env.local
   ```
   
   Edit `.env.local` and add your API credentials:
   ```env
   SPOTIFY_CLIENT_ID=your_spotify_client_id_here
   SPOTIFY_CLIENT_SECRET=your_spotify_client_secret_here
   YOUTUBE_API_KEY=your_youtube_api_key_here
   ```
   
   **Spotify API Setup:**
   - Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
   - Create a new app
   - Copy your Client ID and Client Secret
   
   **YouTube API Setup (Optional):**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing
   - Enable the YouTube Data API v3
   - Create credentials (API Key)
   - Copy your API key
   
   *Note: If YouTube API is not configured, the app will use mock data for video previews*

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000) to see the application.

## Usage Guide

### 1. Search for Your Base Track
- Use the left panel "Track Selection" to search for songs or artists
- **Now powered by MusicBrainz**: Search through 20+ million real recordings
- Results include actual song metadata and audio analysis when available
- Click on any track to select it as your base track
- View track details including BPM, key signature, and duration

### 2. Find Compatible Tracks
- Once you select a track, the right panel automatically shows compatible tracks
- Compatible tracks have the same BPM and key signature
- Browse through the suggestions to find potential mashup partners

### 3. Preview and Plan Your Mashup
- Select a track from the compatible list to activate the Mashup Workspace
- Choose which track should be instrumental and which should be acapella
- Use the "Swap" button to quickly exchange track types
- Preview YouTube versions of both tracks
- Check compatibility indicators for guidance

### 4. Track Compatibility
- ✅ **Green indicator**: Tracks are perfectly compatible (same BPM and key)
- ⚠️ **Red indicator**: Tracks need adjustment (different BPM or key)
- Yellow warnings provide guidance for incompatible tracks

## Deployment

### Self-Hosting with Vercel
```bash
npm run build
npx vercel --prod
```

### Self-Hosting with Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Traditional Server Deployment
```bash
npm run build
npm start
```

## Music Data APIs

### MusicBrainz Integration
The application now uses real music data from MusicBrainz, the open music encyclopedia:

- **No API Key Required**: MusicBrainz is completely free to use
- **Extensive Database**: Over 1.5 million artists and 20 million recordings
- **Real Metadata**: Actual song titles, artists, durations, and release information
- **Rate Limiting**: Respectful 1 request per second limit for anonymous users

### AcousticBrainz Integration
Audio analysis data is provided by AcousticBrainz:

- **BPM Detection**: Automatic tempo detection for compatible tracks
- **Key Analysis**: Musical key signature detection
- **Free Access**: No authentication required
- **Limited Coverage**: Not all tracks have audio analysis data

### Fallback System
When APIs are unavailable or don't have data:

- Falls back to curated sample data for demonstration
- Provides reasonable BPM estimates for audio analysis gaps
- Ensures the application remains functional even offline

## Configuration

### Music Data Source
The application currently uses mock data for demonstration. To integrate with real music APIs:

1. **Spotify API Integration**
   - Replace mock data in `src/services/musicService.ts`
   - Add Spotify Web API calls for track search and audio features
   - Configure environment variables for API credentials

2. **Last.fm API Integration**
   - Alternative music metadata source
   - Good for BPM and key information

3. **YouTube API Integration**
   - Replace mock YouTube search with real YouTube Data API
   - Add your YouTube API key to environment variables

### Environment Variables
Create a `.env.local` file:
```env
NEXT_PUBLIC_YOUTUBE_API_KEY=your_youtube_api_key
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
```

## Project Structure

```
src/
├── app/
│   ├── page.tsx          # Main application page
│   ├── layout.tsx        # App layout and metadata
│   └── globals.css       # Global styles
├── components/
│   ├── SongCard.tsx      # Individual song display card
│   ├── SearchPanel.tsx   # Search interface panel
│   ├── MashupWorkspace.tsx # Track comparison workspace
│   └── YouTubePlayer.tsx # YouTube video preview
├── services/
│   └── musicService.ts   # Music data and API services
└── types/
    └── index.ts          # TypeScript type definitions
```

## API Endpoints

The application is designed to work with various music APIs:

- **Search**: `/api/search?q={query}` - Search for tracks
- **Track Details**: `/api/track/{id}` - Get detailed track information
- **Compatible Tracks**: `/api/compatible?bpm={bpm}&key={key}` - Find matching tracks

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Troubleshooting

### Common Issues

**Development server won't start**
- Ensure Node.js 18.18+ is installed
- Delete `node_modules` and `package-lock.json`, then run `npm install`

**Search not returning results**
- Currently using mock data - this is expected behavior
- Integrate with real music APIs for actual search functionality

**YouTube videos not loading**
- Add a valid YouTube API key to environment variables
- Check browser console for CORS or API errors

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Inspired by the need for better mashup discovery tools
- Built with modern web technologies for optimal self-hosting
- Thanks to the open-source community for the amazing tools and libraries
