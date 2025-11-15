// Test script to check what MusicBrainz and AcousticBrainz actually return
// Run this in browser console: node test-api.js

const testMusicBrainzAPI = async () => {
  try {
    // Test a simple search
    const searchUrl = 'https://musicbrainz.org/ws/2/recording/?query=Beatles&limit=1&fmt=json';
    console.log('Testing MusicBrainz URL:', searchUrl);
    
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'MashupDiscovery/1.0.0 (test@example.com)'
      }
    });
    
    const data = await response.json();
    console.log('MusicBrainz response:', data);
    
    if (data.recordings && data.recordings[0]) {
      const recording = data.recordings[0];
      console.log('First recording:', recording);
      console.log('Recording ID (MBID):', recording.id);
      
      // Now test AcousticBrainz with this ID
      const acousticUrl = `https://acousticbrainz.org/${recording.id}/high-level`;
      console.log('Testing AcousticBrainz URL:', acousticUrl);
      
      try {
        const acousticResponse = await fetch(acousticUrl);
        const acousticData = await acousticResponse.json();
        console.log('AcousticBrainz high-level response:', acousticData);
        
        // Try low-level too
        const lowLevelUrl = `https://acousticbrainz.org/${recording.id}/low-level`;
        console.log('Testing AcousticBrainz low-level URL:', lowLevelUrl);
        
        const lowLevelResponse = await fetch(lowLevelUrl);
        const lowLevelData = await lowLevelResponse.json();
        console.log('AcousticBrainz low-level response:', lowLevelData);
        
      } catch (acousticError) {
        console.error('AcousticBrainz error:', acousticError);
      }
    }
    
  } catch (error) {
    console.error('MusicBrainz error:', error);
  }
};

// Run the test
testMusicBrainzAPI();