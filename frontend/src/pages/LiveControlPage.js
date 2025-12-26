import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { liveService, sareeService } from '../services/api';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Radio, StopCircle, Pin, MessageSquare, ShoppingBag, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

const LiveControlPage = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [sarees, setSarees] = useState([]);
  const [comments, setComments] = useState([]);
  const [sareeCode, setSareeCode] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchComments, 3000);
    return () => clearInterval(interval);
  }, [sessionId]);

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
      toast.success('Live session ended');
      navigate('/dashboard');
    } catch (error) {
      toast.error('Failed to end session');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="live-indicator bg-red-600 rounded-full h-3 w-3"></div>
                <span className="font-bold text-red-500 uppercase text-sm">Live</span>
              </div>
              <h1 className="text-xl font-bold">{session?.title}</h1>
            </div>
            <Button
              variant="destructive"
              onClick={endSession}
              data-testid="end-live-btn"
            >
              <StopCircle className="mr-2 h-4 w-4" />
              End Live
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Stats */}
          <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-gray-800 border-gray-700" data-testid="live-stats">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Total Orders</p>
                    <p className="text-3xl font-bold text-white">{session?.total_orders || 0}</p>
                  </div>
                  <ShoppingBag className="h-10 w-10 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Revenue</p>
                    <p className="text-3xl font-bold text-white">₹{session?.total_revenue || 0}</p>
                  </div>
                  <TrendingUp className="h-10 w-10 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Live Comments</p>
                    <p className="text-3xl font-bold text-white">{comments.length}</p>
                  </div>
                  <MessageSquare className="h-10 w-10 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Pin Saree */}
          <div className="lg:col-span-2">
            <Card className="bg-gray-800 border-gray-700 mb-6">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Pin className="h-5 w-5" />
                  Pin Saree
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter saree code"
                    value={sareeCode}
                    onChange={(e) => setSareeCode(e.target.value.toUpperCase())}
                    onKeyPress={(e) => e.key === 'Enter' && pinSaree()}
                    className="bg-gray-700 border-gray-600 text-white"
                    data-testid="pin-saree-input"
                  />
                  <Button onClick={pinSaree} data-testid="pin-saree-btn">
                    <Pin className="h-4 w-4 mr-2" />
                    Pin
                  </Button>
                </div>
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {sarees.slice(0, 8).map(saree => (
                    <Button
                      key={saree.id}
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSareeCode(saree.saree_code);
                        pinSaree();
                      }}
                      className="bg-gray-700 border-gray-600 hover:bg-gray-600 text-white"
                      data-testid={`quick-pin-${saree.saree_code}`}
                    >
                      {saree.saree_code}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Comments Feed */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Live Comments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto" data-testid="comments-feed">
                  {comments.length === 0 ? (
                    <p className="text-gray-400 text-center py-8">No comments yet. Comments will appear here in real-time.</p>
                  ) : (
                    comments.map((comment, idx) => (
                      <div key={idx} className="bg-gray-700 rounded-lg p-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold text-sm">{comment.username}</p>
                            <p className="text-gray-300 text-sm mt-1">{comment.comment_text}</p>
                          </div>
                          {comment.matched_keyword && (
                            <span className="px-2 py-1 bg-green-600 text-white text-xs rounded-full">
                              {comment.matched_keyword}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          {comment.platform} • {new Date(comment.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Saree List */}
          <div>
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Available Sarees</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {sarees.map(saree => (
                    <div key={saree.id} className="bg-gray-700 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">{saree.saree_code}</p>
                          <p className="text-sm text-gray-400">{saree.fabric} • {saree.color}</p>
                          <p className="text-sm font-bold text-secondary mt-1">₹{saree.price}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSareeCode(saree.saree_code);
                            pinSaree();
                          }}
                          className="bg-gray-600 border-gray-500 hover:bg-gray-500"
                        >
                          Pin
                        </Button>
                      </div>
                      <div className="mt-2 text-xs text-gray-400">
                        Stock: {saree.stock_quantity}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LiveControlPage;