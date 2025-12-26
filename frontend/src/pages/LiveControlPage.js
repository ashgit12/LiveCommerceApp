import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { liveService, sareeService } from '../services/api';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Radio, StopCircle, Pin, MessageSquare, ShoppingBag, TrendingUp, Camera, Eye } from 'lucide-react';
import { toast } from 'sonner';

const LiveControlPage = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const [session, setSession] = useState(null);
  const [sarees, setSarees] = useState([]);
  const [comments, setComments] = useState([]);
  const [sareeCode, setSareeCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [stream, setStream] = useState(null);

  useEffect(() => {
    fetchData();
    startCamera();
    const interval = setInterval(fetchComments, 3000);
    return () => {
      clearInterval(interval);
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [sessionId]); // eslint-disable-line react-hooks/exhaustive-deps

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: true
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Camera access error:', error);
    }
  };

  const fetchData = async () => {
    try {
      const [sessionRes, sareesRes] = await Promise.all([
        liveService.getSessions(),
        sareeService.getAll()
      ]);
      
      const currentSession = sessionRes.data.find(s => s.id === sessionId);
      setSession(currentSession);
      setSarees(sareesRes.data);
      
      if (!currentSession) {
        toast.error('Session not found');
        navigate('/dashboard');
      }
    } catch (error) {
      toast.error('Failed to load session data');
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const response = await liveService.getComments(sessionId);
      setComments(response.data);
    } catch (error) {
      console.error('Failed to fetch comments');
    }
  };

  const pinSaree = async () => {
    if (!sareeCode.trim()) {
      toast.error('Please enter a saree code');
      return;
    }

    try {
      await liveService.pinSaree(sessionId, sareeCode.toUpperCase());
      toast.success(`Saree ${sareeCode.toUpperCase()} pinned!`);
      setSareeCode('');
    } catch (error) {
      toast.error('Failed to pin saree');
    }
  };

  const endSession = async () => {
    if (!window.confirm('Are you sure you want to end this live session?')) return;

    try {
      await liveService.endSession(sessionId);
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      toast.success('Live session ended');
      navigate('/dashboard');
    } catch (error) {
      toast.error('Failed to end session');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading live session...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Premium Header with Live Indicator */}
      <header className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border-b border-red-500/30 backdrop-blur-xl">
        <div className="max-w-[1920px] mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="live-indicator bg-red-600 rounded-full h-4 w-4 shadow-lg shadow-red-500/50"></div>
                  <div className="absolute inset-0 bg-red-600 rounded-full animate-ping opacity-75"></div>
                </div>
                <span className="font-bold text-red-500 uppercase text-lg tracking-wider">Live</span>
              </div>
              <div className="h-8 w-px bg-gray-700"></div>
              <h1 className="text-2xl font-bold text-white">{session?.title}</h1>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Eye className="h-4 w-4" />
                <span>Live viewers tracking...</span>
              </div>
            </div>
            <Button
              size="lg"
              className="bg-red-600 hover:bg-red-700 border-0 shadow-lg shadow-red-500/30"
              onClick={endSession}
              data-testid="end-live-btn"
            >
              <StopCircle className="mr-2 h-5 w-5" />
              End Live
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-[1920px] mx-auto px-6 py-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Live Video Preview - Center */}
          <div className="col-span-12 lg:col-span-7">
            <Card className="bg-gradient-to-br from-gray-900 to-black border-gray-800 shadow-2xl">
              <CardContent className="p-0">
                <div className="aspect-video bg-black rounded-t-lg overflow-hidden relative group">
                  {stream ? (
                    <>
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                        data-testid="live-preview"
                      />
                      <div className="absolute top-4 left-4 bg-red-600/90 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-2">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                        <span className="text-white text-sm font-semibold">YOU&apos;RE LIVE</span>
                      </div>
                      <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="bg-black/70 backdrop-blur-sm px-4 py-2 rounded-lg text-sm">
                          <Camera className="inline h-4 w-4 mr-2" />
                          Live Preview
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500">
                      <Camera className="h-20 w-20 mb-4" />
                    </div>
                  )}
                </div>

                {/* Pin Saree Control */}
                <div className="p-6 bg-gradient-to-r from-gray-900 to-gray-800">
                  <div className="flex items-center gap-3 mb-4">
                    <Pin className="h-5 w-5 text-secondary" />
                    <h3 className="text-lg font-semibold">Pin Saree</h3>
                  </div>
                  <div className="flex gap-3">
                    <Input
                      placeholder="Enter saree code (e.g., SAR001)"
                      value={sareeCode}
                      onChange={(e) => setSareeCode(e.target.value.toUpperCase())}
                      onKeyPress={(e) => e.key === 'Enter' && pinSaree()}
                      className="bg-black/50 border-gray-700 text-white text-lg"
                      data-testid="pin-saree-input"
                    />
                    <Button onClick={pinSaree} size="lg" className="bg-gradient-to-r from-primary to-secondary" data-testid="pin-saree-btn">
                      <Pin className="h-5 w-5 mr-2" />
                      Pin
                    </Button>
                  </div>
                  <div className="mt-4 grid grid-cols-4 gap-2">
                    {sarees.slice(0, 8).map(saree => (
                      <Button
                        key={saree.id}
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSareeCode(saree.saree_code);
                          pinSaree();
                        }}
                        className="bg-gray-800/50 border-gray-700 hover:bg-gray-700 hover:border-primary"
                        data-testid={`quick-pin-${saree.saree_code}`}
                      >
                        {saree.saree_code}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Stats & Comments - Right Side */}
          <div className="col-span-12 lg:col-span-5 space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-4">
              <StatCard icon={ShoppingBag} value={session?.total_orders || 0} label="Orders" color="blue" />
              <StatCard icon={TrendingUp} value={`₹${session?.total_revenue || 0}`} label="Revenue" color="green" />
              <StatCard icon={MessageSquare} value={comments.length} label="Comments" color="purple" />
            </div>

            {/* Live Comments Feed */}
            <Card className="bg-gradient-to-br from-gray-900 to-black border-gray-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Live Comments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-[calc(100vh-500px)] overflow-y-auto custom-scrollbar" data-testid="comments-feed">
                  {comments.length === 0 ? (
                    <div className="text-center py-12">
                      <MessageSquare className="mx-auto h-12 w-12 text-gray-700 mb-3" />
                      <p className="text-gray-500">Comments will appear here in real-time</p>
                    </div>
                  ) : (
                    comments.map((comment, idx) => (
                      <div key={idx} className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50 hover:border-primary/30 transition-all">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-semibold text-sm text-white">{comment.username}</p>
                            <p className="text-gray-300 text-sm mt-1">{comment.comment_text}</p>
                          </div>
                          {comment.matched_keyword && (
                            <span className="px-3 py-1 bg-gradient-to-r from-green-500 to-green-600 text-white text-xs rounded-full font-bold shadow-lg">
                              {comment.matched_keyword}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
                          <span className="px-2 py-1 bg-gray-900 rounded">{comment.platform}</span>
                          <span>•</span>
                          <span>{new Date(comment.timestamp).toLocaleTimeString()}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

const StatCard = ({ icon: Icon, value, label, color }) => {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600'
  };

  return (
    <Card className="bg-gradient-to-br from-gray-900 to-black border-gray-800">
      <CardContent className="pt-6 text-center">
        <div className={`w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center shadow-lg`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <p className="text-2xl font-bold text-white">{value}</p>
        <p className="text-xs text-gray-500 mt-1">{label}</p>
      </CardContent>
    </Card>
  );
};

export default LiveControlPage;