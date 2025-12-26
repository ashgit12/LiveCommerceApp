const axios = require('axios');

class YouTubeLiveService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.apiUrl = 'https://www.googleapis.com/youtube/v3';
  }
  
  async getLiveChatId(videoId) {
    try {
      const response = await axios.get(`${this.apiUrl}/videos`, {
        params: {
          key: this.apiKey,
          part: 'liveStreamingDetails',
          id: videoId
        }
      });
      
      const video = response.data.items?.[0];
      return video?.liveStreamingDetails?.activeLiveChatId || null;
    } catch (error) {
      console.error('Error getting live chat ID:', error.message);
      return null;
    }
  }
  
  async fetchChatMessages(liveChatId, pageToken = null) {
    try {
      const params = {
        key: this.apiKey,
        part: 'snippet,authorDetails',
        liveChatId: liveChatId,
        maxResults: 100
      };
      
      if (pageToken) {
        params.pageToken = pageToken;
      }
      
      const response = await axios.get(`${this.apiUrl}/liveChat/messages`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching chat messages:', error.message);
      return { items: [], nextPageToken: null, pollingIntervalMillis: 5000 };
    }
  }
  
  async startPolling(videoId, callback) {
    const liveChatId = await this.getLiveChatId(videoId);
    
    if (!liveChatId) {
      console.error('No active live chat found');
      return null;
    }
    
    let pageToken = null;
    let pollingInterval = 5000;
    
    const poll = async () => {
      try {
        const data = await this.fetchChatMessages(liveChatId, pageToken);
        
        for (const item of data.items || []) {
          const comment = {
            platform: 'youtube',
            username: item.authorDetails.displayName,
            user_id: item.authorDetails.channelId,
            comment_text: item.snippet.displayMessage,
            comment_id: item.id,
            timestamp: item.snippet.publishedAt
          };
          
          callback(comment);
        }
        
        pageToken = data.nextPageToken;
        pollingInterval = data.pollingIntervalMillis || 5000;
        
        setTimeout(poll, pollingInterval);
      } catch (error) {
        console.error('YouTube polling error:', error.message);
        setTimeout(poll, 10000); // Retry after 10s on error
      }
    };
    
    poll();
    return liveChatId;
  }
}

module.exports = YouTubeLiveService;
