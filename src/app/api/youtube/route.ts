import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

// YouTube Data API v3 interface
interface YouTubeSearchItem {
  id: {
    videoId: string;
  };
  snippet: {
    title: string;
    thumbnails: {
      medium: {
        url: string;
      };
    };
  };
  contentDetails?: {
    duration: string;
  };
}

interface YouTubeVideoDetails {
  items: {
    contentDetails: {
      duration: string;
    };
  }[];
}

// Convert ISO 8601 duration to readable format (PT4M13S -> 4:13)
function parseDuration(duration: string): string {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return '0:00';
  
  const [, hours, minutes, seconds] = match;
  const h = parseInt(hours || '0');
  const m = parseInt(minutes || '0');
  const s = parseInt(seconds || '0');
  
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');
  const type = searchParams.get('type') || 'instrumental';

  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
  }

  // Check if YouTube API key is configured
  const apiKey = process.env.YOUTUBE_API_KEY || process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
  console.log('YouTube API Debug - Environment check:', {
    hasApiKey: !!apiKey,
    keyLength: apiKey?.length || 0,
    allYoutubeEnvVars: Object.keys(process.env).filter(key => key.includes('YOUTUBE'))
  });
  
  if (!apiKey) {
    console.warn('YouTube API key not configured, returning mock data');
    // Return mock data for development
    return NextResponse.json([
      {
        id: 'mock1',
        title: `${query} (${type.charAt(0).toUpperCase() + type.slice(1)})`,
        duration: '3:45',
        thumbnail: `https://img.youtube.com/vi/mock1/mqdefault.jpg`
      },
      {
        id: 'mock2',
        title: `${query} ${type} version`,
        duration: '4:12',
        thumbnail: `https://img.youtube.com/vi/mock2/mqdefault.jpg`
      }
    ]);
  }

  try {
    // Build search query based on type with better terms
    const searchQuery = type === 'acapella' 
      ? `${query} acapella vocals only -karaoke -cover`
      : `${query} instrumental -karaoke -cover -lyrics -acapella`;

    // Search for videos
    const searchResponse = await axios.get('https://www.googleapis.com/youtube/v3/search', {
      params: {
        part: 'snippet',
        q: searchQuery,
        type: 'video',
        maxResults: 5, // Reduced from 20 to save quota
        key: apiKey,
        videoCategoryId: '10', // Music category
        order: 'relevance',
        videoEmbeddable: 'true', // Only get embeddable videos
        videoSyndicated: 'true'  // Only get videos that can be played outside YouTube
      }
    });

    const videos = searchResponse.data.items as YouTubeSearchItem[];
    
    if (videos.length === 0) {
      return NextResponse.json([]);
    }

    // Filter and prioritize videos based on quality indicators
    const filteredVideos = videos.filter(video => {
      const title = video.snippet.title.toLowerCase();
      
      if (type === 'instrumental') {
        // For instrumental: exclude acapella, lyrics videos, and low-quality indicators
        return !title.includes('acapella') && 
               !title.includes('lyrics') && 
               !title.includes('reaction') &&
               !title.includes('review');
      } else {
        // For acapella: must include acapella/vocals terms
        return (title.includes('acapella') || title.includes('vocals only')) &&
               !title.includes('instrumental') &&
               !title.includes('reaction') &&
               !title.includes('review');
      }
    });

    // Sort by quality indicators
    const sortedVideos = filteredVideos.sort((a, b) => {
      const aTitle = a.snippet.title.toLowerCase();
      const bTitle = b.snippet.title.toLowerCase();
      
      if (type === 'instrumental') {
        // Prioritize official instrumentals over karaoke
        const aOfficial = aTitle.includes('official') || aTitle.includes('instrumental');
        const bOfficial = bTitle.includes('official') || bTitle.includes('instrumental');
        const aKaraoke = aTitle.includes('karaoke');
        const bKaraoke = bTitle.includes('karaoke');
        
        if (aOfficial && !bOfficial) return -1;
        if (!aOfficial && bOfficial) return 1;
        if (!aKaraoke && bKaraoke) return -1;
        if (aKaraoke && !bKaraoke) return 1;
      } else {
        // For acapella, prioritize official and high-quality versions
        const aOfficial = aTitle.includes('official') || aTitle.includes('studio');
        const bOfficial = bTitle.includes('official') || bTitle.includes('studio');
        
        if (aOfficial && !bOfficial) return -1;
        if (!aOfficial && bOfficial) return 1;
      }
      
      return 0;
    });

    // Take the best results (limit to 5 for quota efficiency)
    const bestVideos = sortedVideos.slice(0, 5);

    // Get video details for durations
    const videoIds = bestVideos.map(video => video.id.videoId).join(',');
    const detailsResponse = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
      params: {
        part: 'contentDetails',
        id: videoIds,
        key: apiKey
      }
    });

    const videoDetails = detailsResponse.data as YouTubeVideoDetails;

    // Combine search results with duration data
    const result = bestVideos.map((video, index) => ({
      id: video.id.videoId,
      title: video.snippet.title,
      duration: videoDetails.items[index] 
        ? parseDuration(videoDetails.items[index].contentDetails.duration)
        : '0:00',
      thumbnail: video.snippet.thumbnails.medium.url
    }));

    return NextResponse.json(result);

  } catch (error) {
    console.error('YouTube API error:', error);
    
    // Check if it's a rate limiting or quota issue
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const errorData = error.response?.data;
      
      console.error('YouTube API Error Details:', {
        status,
        statusText: error.response?.statusText,
        errorData,
        isQuotaExceeded: status === 403 && errorData?.error?.errors?.[0]?.reason === 'quotaExceeded',
        isDailyLimitExceeded: status === 403 && errorData?.error?.errors?.[0]?.reason === 'dailyLimitExceeded'
      });
      
      if (status === 403) {
        console.warn('YouTube API quota/rate limit exceeded, using mock data');
      }
    }
    
    // Return mock data as fallback
    return NextResponse.json([
      {
        id: `mock_${Date.now()}_1`,
        title: `${query} (${type.charAt(0).toUpperCase() + type.slice(1)}) - Mock`,
        duration: '3:45',
        thumbnail: `https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg`
      },
      {
        id: `mock_${Date.now()}_2`,
        title: `${query} ${type} version - Mock`,
        duration: '4:12',
        thumbnail: `https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg`
      }
    ]);
  }
}