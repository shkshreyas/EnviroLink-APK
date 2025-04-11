import Constants from 'expo-constants';

// YouTube API key from environment variables
const YOUTUBE_API_KEY = Constants.expoConfig?.extra?.EXPO_PUBLIC_YOUTUBE_API_KEY || 
                      process.env.EXPO_PUBLIC_YOUTUBE_API_KEY;

// Define video interface
export interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  channelTitle: string;
  publishedAt: string;
  viewCount?: string;
}

// Categories related to environmental sustainability
export const SUSTAINABILITY_CATEGORIES = [
  { id: 'renewable-energy', title: 'Renewable Energy', query: 'renewable energy sustainability' },
  { id: 'sustainable-living', title: 'Sustainable Living', query: 'sustainable living tips' },
  { id: 'climate-change', title: 'Climate Change', query: 'climate change solutions' },
  { id: 'waste-reduction', title: 'Zero Waste', query: 'zero waste sustainability' },
  { id: 'conservation', title: 'Conservation', query: 'environmental conservation' },
  { id: 'sustainable-tech', title: 'Green Technology', query: 'sustainable technology innovation' },
];

// Function to fetch videos by search query
export async function fetchVideosByQuery(query: string, maxResults: number = 10): Promise<YouTubeVideo[]> {
  try {
    if (!YOUTUBE_API_KEY) {
      console.error('YouTube API key is missing');
      return getMockVideos(query);
    }

    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=${maxResults}&q=${encodeURIComponent(
        query
      )}&type=video&key=${YOUTUBE_API_KEY}`
    );

    if (!response.ok) {
      console.error('Error fetching YouTube videos', await response.text());
      return getMockVideos(query);
    }

    const data = await response.json();
    
    if (!data.items || !Array.isArray(data.items)) {
      return getMockVideos(query);
    }

    // Transform the response into our YouTubeVideo interface
    return data.items.map((item: any) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnail: item.snippet.thumbnails.high.url,
      channelTitle: item.snippet.channelTitle,
      publishedAt: new Date(item.snippet.publishedAt).toLocaleDateString(),
    }));
  } catch (error) {
    console.error('Failed to fetch YouTube videos', error);
    return getMockVideos(query);
  }
}

// Function to get video details (view count, likes, etc.)
export async function getVideoDetails(videoId: string): Promise<any> {
  try {
    if (!YOUTUBE_API_KEY) {
      return null;
    }

    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoId}&key=${YOUTUBE_API_KEY}`
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.items && data.items.length > 0 ? data.items[0].statistics : null;
  } catch (error) {
    console.error('Failed to fetch video details', error);
    return null;
  }
}

// Generate mock data when API calls fail
function getMockVideos(query: string): YouTubeVideo[] {
  const topics = query.split(' ');
  const mainTopic = topics[0] || 'sustainability';
  
  return [
    {
      id: 'mock-1',
      title: `Understanding ${mainTopic} - A Comprehensive Guide`,
      description: `Learn about ${mainTopic} and how it impacts our environment and daily lives.`,
      thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
      channelTitle: 'EnviroLearn',
      publishedAt: new Date().toLocaleDateString(),
    },
    {
      id: 'mock-2',
      title: `5 Ways to Improve ${mainTopic} in Your Community`,
      description: `Practical tips on implementing ${mainTopic} solutions in your local area.`,
      thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
      channelTitle: 'GreenFuture',
      publishedAt: new Date().toLocaleDateString(),
    },
    {
      id: 'mock-3',
      title: `The Science of ${mainTopic} Explained`,
      description: `Scientific breakdown of how ${mainTopic} works and why it matters.`,
      thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
      channelTitle: 'ScienceMadeSimple',
      publishedAt: new Date().toLocaleDateString(),
    },
    {
      id: 'mock-4',
      title: `${mainTopic} and Its Impact on Climate Change`,
      description: `How ${mainTopic} relates to global climate issues and potential solutions.`,
      thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
      channelTitle: 'ClimateSolutions',
      publishedAt: new Date().toLocaleDateString(),
    },
    {
      id: 'mock-5',
      title: `Future of ${mainTopic}: Innovations and Trends`,
      description: `Explore cutting-edge developments in the field of ${mainTopic}.`,
      thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
      channelTitle: 'FutureTech',
      publishedAt: new Date().toLocaleDateString(),
    },
  ];
} 