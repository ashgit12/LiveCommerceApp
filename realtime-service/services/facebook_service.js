const axios = require('axios');

class FacebookLiveService {
  constructor(accessToken, pageId) {
    this.accessToken = accessToken;
    this.pageId = pageId;
    this.apiUrl = 'https://graph.facebook.com/v18.0';
  }
  
  async fetchLiveVideos() {
    try {
      const response = await axios.get(`${this.apiUrl}/${this.pageId}/live_videos`, {
        params: {
          access_token: this.accessToken,
          fields: 'id,title,status,live_views'
        }
      });
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching live videos:', error.message);
      return [];
    }
  }
  
  async fetchComments(videoId, since = null) {
    try {
      const params = {
        access_token: this.accessToken,
        fields: 'id,from{id,name},message,created_time',
        limit: 100
      };
      
      if (since) {
        params.since = since;
      }
      
      const response = await axios.get(`${this.apiUrl}/${videoId}/comments`, { params });
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching comments:', error.message);
      return [];
    }
  }
  
  async startPolling(videoId, callback, intervalMs = 3000) {
    let lastCommentTime = null;
    
    const poll = async () => {
      try {
        const comments = await this.fetchComments(videoId, lastCommentTime);
        
        for (const comment of comments) {
          const processedComment = {
            platform: 'facebook',
            username: comment.from.name,
            user_id: comment.from.id,
            comment_text: comment.message,
            comment_id: comment.id,
            timestamp: comment.created_time
          };
          
          callback(processedComment);
          lastCommentTime = comment.created_time;
        }
      } catch (error) {
        console.error('Polling error:', error.message);
      }
    };
    
    const intervalId = setInterval(poll, intervalMs);
    poll(); // Initial poll
    
    return intervalId;
  }
}

module.exports = FacebookLiveService;
