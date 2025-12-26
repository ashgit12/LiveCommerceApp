import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Facebook, Youtube, Instagram, CheckCircle, XCircle, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const ConnectAccountsPage = () => {
  const navigate = useNavigate();
  const [connections, setConnections] = useState({
    facebook: { connected: false, pageId: '', pageName: '' },
    youtube: { connected: false, channelId: '', channelName: '' },
    instagram: { connected: false, username: '' }
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkConnections();
  }, []);

  const checkConnections = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/social/connections`);
      setConnections(response.data);
    } catch (error) {
      console.error('Failed to check connections:', error);
    }
  };

  const connectFacebook = () => {
    const clientId = '123456789'; // Replace with actual Facebook App ID
    const redirectUri = `${window.location.origin}/oauth/facebook/callback`;
    const scope = 'pages_manage_posts,pages_read_engagement,pages_show_list,publish_video';
    
    const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&response_type=code`;
    
    window.location.href = authUrl;
  };

  const connectYouTube = () => {
    const clientId = 'YOUR_GOOGLE_CLIENT_ID'; // Replace with actual Google Client ID
    const redirectUri = `${window.location.origin}/oauth/youtube/callback`;
    const scope = 'https://www.googleapis.com/auth/youtube https://www.googleapis.com/auth/youtube.force-ssl';
    
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&response_type=code&access_type=offline&prompt=consent`;
    
    window.location.href = authUrl;
  };

  const connectInstagram = () => {
    const clientId = '123456789'; // Instagram uses Facebook OAuth
    const redirectUri = `${window.location.origin}/oauth/instagram/callback`;
    const scope = 'instagram_basic,instagram_content_publish';
    
    const authUrl = `https://api.instagram.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&response_type=code`;
    
    window.location.href = authUrl;
  };

  const disconnectAccount = async (platform) => {
    try {
      await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/social/disconnect/${platform}`);
      toast.success(`${platform} disconnected successfully`);
      checkConnections();
    } catch (error) {
      toast.error(`Failed to disconnect ${platform}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-3xl font-bold heading-font text-primary">Connect Accounts</h1>
          <p className="text-sm text-gray-600 mt-1">Link your social media accounts for live streaming</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Facebook */}
          <Card data-testid="facebook-connection">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Facebook className="h-8 w-8 text-blue-600" />
                  <div>
                    <CardTitle>Facebook Page</CardTitle>
                    <CardDescription>
                      {connections.facebook.connected 
                        ? `Connected: ${connections.facebook.pageName}`
                        : 'Connect your Facebook Page for live streaming'
                      }
                    </CardDescription>
                  </div>
                </div>
                {connections.facebook.connected ? (
                  <CheckCircle className="h-6 w-6 text-green-600" />
                ) : (
                  <XCircle className="h-6 w-6 text-gray-400" />
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg text-sm">
                  <p className="font-semibold mb-2">Required Permissions:</p>
                  <ul className="space-y-1 text-gray-700">
                    <li>• Manage and publish content to your Page</li>
                    <li>• Access Page insights and engagement</li>
                    <li>• Create live videos</li>
                  </ul>
                </div>
                {connections.facebook.connected ? (
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={() => connectFacebook()}>
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Reconnect
                    </Button>
                    <Button variant="destructive" onClick={() => disconnectAccount('facebook')}>
                      Disconnect
                    </Button>
                  </div>
                ) : (
                  <Button onClick={connectFacebook} className="w-full btn-hover-lift" data-testid="connect-facebook-btn">
                    <Facebook className="mr-2 h-4 w-4" />
                    Connect Facebook Page
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* YouTube */}
          <Card data-testid="youtube-connection">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Youtube className="h-8 w-8 text-red-600" />
                  <div>
                    <CardTitle>YouTube Channel</CardTitle>
                    <CardDescription>
                      {connections.youtube.connected 
                        ? `Connected: ${connections.youtube.channelName}`
                        : 'Connect your YouTube Channel for live streaming'
                      }
                    </CardDescription>
                  </div>
                </div>
                {connections.youtube.connected ? (
                  <CheckCircle className="h-6 w-6 text-green-600" />
                ) : (
                  <XCircle className="h-6 w-6 text-gray-400" />
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-red-50 p-4 rounded-lg text-sm">
                  <p className="font-semibold mb-2">Required Permissions:</p>
                  <ul className="space-y-1 text-gray-700">
                    <li>• Manage your YouTube channel</li>
                    <li>• Upload and manage videos</li>
                    <li>• Create and manage live streams</li>
                  </ul>
                </div>
                {connections.youtube.connected ? (
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={() => connectYouTube()}>
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Reconnect
                    </Button>
                    <Button variant="destructive" onClick={() => disconnectAccount('youtube')}>
                      Disconnect
                    </Button>
                  </div>
                ) : (
                  <Button onClick={connectYouTube} className="w-full btn-hover-lift" data-testid="connect-youtube-btn">
                    <Youtube className="mr-2 h-4 w-4" />
                    Connect YouTube Channel
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Instagram */}
          <Card data-testid="instagram-connection">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Instagram className="h-8 w-8 text-pink-600" />
                  <div>
                    <CardTitle>Instagram Account</CardTitle>
                    <CardDescription>
                      {connections.instagram.connected 
                        ? `Connected: @${connections.instagram.username}`
                        : 'Connect your Instagram account for live streaming'
                      }
                    </CardDescription>
                  </div>
                </div>
                {connections.instagram.connected ? (
                  <CheckCircle className="h-6 w-6 text-green-600" />
                ) : (
                  <XCircle className="h-6 w-6 text-gray-400" />
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-pink-50 p-4 rounded-lg text-sm">
                  <p className="font-semibold mb-2">Required Permissions:</p>
                  <ul className="space-y-1 text-gray-700">
                    <li>• Access basic account information</li>
                    <li>• Publish content and stories</li>
                    <li>• Go live on Instagram</li>
                  </ul>
                </div>
                {connections.instagram.connected ? (
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={() => connectInstagram()}>
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Reconnect
                    </Button>
                    <Button variant="destructive" onClick={() => disconnectAccount('instagram')}>
                      Disconnect
                    </Button>
                  </div>
                ) : (
                  <Button onClick={connectInstagram} className="w-full btn-hover-lift" data-testid="connect-instagram-btn">
                    <Instagram className="mr-2 h-4 w-4" />
                    Connect Instagram Account
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => navigate('/settings')}>
              Back to Settings
            </Button>
            <Button onClick={() => navigate('/go-live')} disabled={!connections.facebook.connected && !connections.youtube.connected && !connections.instagram.connected}>
              Continue to Go Live
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ConnectAccountsPage;