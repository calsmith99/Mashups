## MusicBrainz API Integration

This application now uses the MusicBrainz API for real music data! Here's what you need to know:

### Features Added
- **Real Music Search**: Search through MusicBrainz's extensive database of songs and artists
- **Audio Analysis**: Attempts to get BPM and key data from AcousticBrainz
- **Fallback System**: Falls back to mock data if APIs are unavailable

### API Information

#### MusicBrainz
- **No API Key Required**: MusicBrainz is open and free to use
- **Rate Limiting**: 1 request per second for anonymous users
- **Coverage**: Over 1.5 million artists and 20 million recordings

#### AcousticBrainz
- **Audio Analysis**: Provides BPM, key signature, and other acoustic features
- **Limited Coverage**: Not all tracks have audio analysis data
- **Free Access**: No authentication required

### Usage Guidelines
1. **Be Respectful**: Don't abuse the free APIs with excessive requests
2. **User-Agent**: The app includes proper User-Agent headers as requested by MusicBrainz
3. **Caching**: Consider implementing caching for production use to reduce API calls

### Known Limitations
- AcousticBrainz data is not available for all tracks
- BPM and key matching relies on available data or fallback values
- Search results may vary in quality compared to commercial APIs

### Future Improvements
- Add result caching to reduce API calls
- Integrate additional sources for BPM/key data
- Implement user feedback system for data accuracy