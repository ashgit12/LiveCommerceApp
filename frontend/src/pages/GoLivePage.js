import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { liveService } from '../services/api';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Checkbox } from '../components/ui/checkbox';
import { Video, Youtube, Facebook, Instagram, Radio, Camera, Settings } from 'lucide-react';
import { toast } from 'sonner';

const GoLivePage = () => {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [platforms, setPlatforms] = useState({
    facebook: false,
    youtube: false,
    instagram: false
  });
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [streamKeys, setStreamKeys] = useState({
    facebook: '',
    youtube: '',
    instagram: ''
  });

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: true
      });
      
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setCameraEnabled(true);
      toast.success('Camera enabled!');
    } catch (error) {
      toast.error('Failed to access camera. Please check permissions.');
      console.error('Camera error:', error);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setCameraEnabled(false);
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }
  };

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

    if (!cameraEnabled) {
      toast.error('Please enable camera first');
      return;
    }

    setLoading(true);
    try {
      const response = await liveService.createSession({
        platforms: selectedPlatforms,
        title: title.trim()
      });
      
      toast.success('Live session started!');
      // Keep camera running and navigate to control panel
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

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Camera Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Camera Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden mb-4">
                {cameraEnabled ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                    data-testid="camera-preview"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                    <Camera className="h-16 w-16 mb-4" />
                    <p>Camera not enabled</p>
                  </div>
                )}
              </div>
              
              <div className="flex gap-2">
                {!cameraEnabled ? (
                  <Button
                    className="flex-1"
                    onClick={startCamera}
                    data-testid="enable-camera-btn"
                  >
                    <Camera className="mr-2 h-4 w-4" />
                    Enable Camera
                  </Button>
                ) : (
                  <Button
                    className="flex-1"
                    variant="outline"
                    onClick={stopCamera}
                    data-testid="stop-camera-btn"
                  >
                    Stop Camera
                  </Button>
                )}
              </div>
              
              <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm">
                <p className="font-semibold mb-2">📱 Mobile Users:</p>
                <ul className="space-y-1 text-gray-700">
                  <li>• Grant camera and microphone permissions</li>
                  <li>• Ensure stable internet connection</li>
                  <li>• Keep phone charged or plugged in</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Session Setup */}
          <Card>
            <CardHeader>
              <CardTitle>Live Session Setup</CardTitle>
              <CardDescription>Configure your broadcast settings</CardDescription>
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
                <div className="space-y-3">
                  {/* Facebook */}
                  <Card 
                    className={`cursor-pointer transition-all ${platforms.facebook ? 'ring-2 ring-blue-500' : ''}`}
                    onClick={() => setPlatforms({...platforms, facebook: !platforms.facebook})}
                    data-testid="platform-facebook"
                  >
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Checkbox
                            checked={platforms.facebook}
                            onCheckedChange={(checked) => setPlatforms({...platforms, facebook: checked})}
                          />
                          <Facebook className="h-6 w-6 text-blue-600" />
                          <div>
                            <p className="font-semibold">Facebook Live</p>
                            <p className="text-xs text-gray-500">Stream to Facebook Page</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* YouTube */}
                  <Card 
                    className={`cursor-pointer transition-all ${platforms.youtube ? 'ring-2 ring-red-500' : ''}`}
                    onClick={() => setPlatforms({...platforms, youtube: !platforms.youtube})}
                    data-testid="platform-youtube"
                  >
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Checkbox
                            checked={platforms.youtube}
                            onCheckedChange={(checked) => setPlatforms({...platforms, youtube: checked})}
                          />
                          <Youtube className="h-6 w-6 text-red-600" />
                          <div>
                            <p className="font-semibold">YouTube Live</p>
                            <p className="text-xs text-gray-500">Stream to YouTube Channel</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Instagram */}
                  <Card 
                    className={`cursor-pointer transition-all ${platforms.instagram ? 'ring-2 ring-pink-500' : ''}`}
                    onClick={() => setPlatforms({...platforms, instagram: !platforms.instagram})}
                    data-testid="platform-instagram"
                  >
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Checkbox
                            checked={platforms.instagram}
                            onCheckedChange={(checked) => setPlatforms({...platforms, instagram: checked})}
                          />
                          <Instagram className="h-6 w-6 text-pink-600" />
                          <div>
                            <p className="font-semibold">Instagram Live</p>
                            <p className="text-xs text-gray-500">Go live on Instagram</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Instructions */}
              <Card className="bg-amber-50 border-amber-200">
                <CardContent className="pt-4">
                  <h4 className="font-semibold mb-2 flex items-center gap-2 text-sm">
                    <Settings className="h-4 w-4 text-amber-600" />
                    Multi-Platform Streaming
                  </h4>
                  <p className="text-xs text-gray-700 mb-2">
                    This will broadcast to all selected platforms simultaneously. Make sure you have:
                  </p>
                  <ul className="text-xs space-y-1 text-gray-700">
                    <li>✓ Connected your accounts in Settings</li>
                    <li>✓ Valid streaming permissions on each platform</li>
                    <li>✓ Strong internet connection (5+ Mbps upload)</li>
                  </ul>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  className="flex-1 btn-hover-lift"
                  size="lg"
                  onClick={handleStartLive}
                  disabled={loading || !cameraEnabled}
                  data-testid="start-live-btn"
                >
                  <Radio className="mr-2 h-5 w-5" />
                  {loading ? 'Starting...' : 'Start Broadcasting'}
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
        </div>
      </main>
    </div>
  );
};

export default GoLivePage;