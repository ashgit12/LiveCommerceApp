import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { liveService } from '../services/api';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Checkbox } from '../components/ui/checkbox';
import { Video, Youtube, Facebook, Instagram, Radio } from 'lucide-react';
import { toast } from 'sonner';

const GoLivePage = () => {
  const navigate = useNavigate();
  const [platforms, setPlatforms] = useState({
    facebook: false,
    youtube: false,
    instagram: false
  });
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);

  const handleStartLive = async () => {
    const selectedPlatforms = Object.keys(platforms).filter(p => platforms[p]);
    
    if (selectedPlatforms.length === 0) {
      toast.error('Please select at least one platform');
      return;
    }
    
    if (!title.trim()) {
      toast.error('Please enter a title for your live session');
      return;
    }

    setLoading(true);
    try {
      const response = await liveService.createSession({
        platforms: selectedPlatforms,
        title: title.trim()
      });
      
      toast.success('Live session started!');
      navigate(`/live-control/${response.data.id}`);
    } catch (error) {
      toast.error('Failed to start live session');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-3xl font-bold heading-font text-primary">Go Live</h1>
          <p className="text-sm text-gray-600 mt-1">Start broadcasting to your customers</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Live Session Setup</CardTitle>
            <CardDescription>Select platforms and configure your live session</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Session Title */}
            <div>
              <label className="text-sm font-medium mb-2 block">Session Title *</label>
              <Input
                placeholder="e.g., New Collection Launch - Silk Sarees"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                data-testid="live-title"
              />
            </div>

            {/* Platform Selection */}
            <div>
              <label className="text-sm font-medium mb-3 block">Select Platforms *</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Facebook */}
                <Card className={`cursor-pointer transition-all ${platforms.facebook ? 'ring-2 ring-primary' : ''}`}
                  onClick={() => setPlatforms({...platforms, facebook: !platforms.facebook})}
                  data-testid="platform-facebook"
                >
                  <CardContent className="pt-6">
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        checked={platforms.facebook}
                        onCheckedChange={(checked) => setPlatforms({...platforms, facebook: checked})}
                      />
                      <Facebook className="h-8 w-8 text-blue-600" />
                      <div>
                        <p className="font-semibold">Facebook Live</p>
                        <p className="text-xs text-gray-500">Go live on Facebook</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* YouTube */}
                <Card className={`cursor-pointer transition-all ${platforms.youtube ? 'ring-2 ring-primary' : ''}`}
                  onClick={() => setPlatforms({...platforms, youtube: !platforms.youtube})}
                  data-testid="platform-youtube"
                >
                  <CardContent className="pt-6">
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        checked={platforms.youtube}
                        onCheckedChange={(checked) => setPlatforms({...platforms, youtube: checked})}
                      />
                      <Youtube className="h-8 w-8 text-red-600" />
                      <div>
                        <p className="font-semibold">YouTube Live</p>
                        <p className="text-xs text-gray-500">Stream on YouTube</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Instagram */}
                <Card className={`cursor-pointer transition-all ${platforms.instagram ? 'ring-2 ring-primary' : ''}`}
                  onClick={() => setPlatforms({...platforms, instagram: !platforms.instagram})}
                  data-testid="platform-instagram"
                >
                  <CardContent className="pt-6">
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        checked={platforms.instagram}
                        onCheckedChange={(checked) => setPlatforms({...platforms, instagram: checked})}
                      />
                      <Instagram className="h-8 w-8 text-pink-600" />
                      <div>
                        <p className="font-semibold">Instagram Live</p>
                        <p className="text-xs text-gray-500">Go live on Instagram</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Instructions */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-6">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Radio className="h-5 w-5 text-blue-600" />
                  Before You Go Live
                </h4>
                <ul className="text-sm space-y-2 text-gray-700">
                  <li>• Ensure your platform accounts are connected in Settings</li>
                  <li>• Have your sarees ready to showcase</li>
                  <li>• Good lighting and stable internet connection</li>
                  <li>• Start your live stream on the selected platforms</li>
                  <li>• Return here and click "Start Session" to begin tracking</li>
                </ul>
              </CardContent>
            </Card>

            {/* Action Button */}
            <div className="flex gap-4">
              <Button
                className="flex-1 btn-hover-lift"
                size="lg"
                onClick={handleStartLive}
                disabled={loading}
                data-testid="start-live-btn"
              >
                <Video className="mr-2 h-5 w-5" />
                {loading ? 'Starting...' : 'Start Live Session'}
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate('/dashboard')}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default GoLivePage;