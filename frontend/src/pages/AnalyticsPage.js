import React, { useEffect, useState } from 'react';
import { liveService, orderService, sareeService } from '../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { BarChart3, TrendingUp, Package, Video, IndianRupee } from 'lucide-react';

const AnalyticsPage = () => {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalLiveSessions: 0,
    avgOrderValue: 0,
    topSarees: [],
    recentSessions: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const [ordersRes, sessionsRes, sareesRes] = await Promise.all([
        orderService.getAll(),
        liveService.getSessions(),
        sareeService.getAll()
      ]);

      const orders = ordersRes.data;
      const sessions = sessionsRes.data;
      const sarees = sareesRes.data;

      // Calculate total revenue from paid orders
      const totalRevenue = orders
        .filter(o => o.payment_status === 'completed')
        .reduce((sum, o) => sum + o.amount, 0);

      // Calculate average order value
      const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;

      // Calculate top selling sarees
      const sareeOrderCounts = {};
      orders.forEach(order => {
        sareeOrderCounts[order.saree_code] = (sareeOrderCounts[order.saree_code] || 0) + 1;
      });

      const topSarees = Object.entries(sareeOrderCounts)
        .map(([code, count]) => {
          const saree = sarees.find(s => s.saree_code === code);
          return {
            code,
            count,
            revenue: orders
              .filter(o => o.saree_code === code && o.payment_status === 'completed')
              .reduce((sum, o) => sum + o.amount, 0),
            saree
          };
        })
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      setStats({
        totalRevenue,
        totalOrders: orders.length,
        totalLiveSessions: sessions.length,
        avgOrderValue,
        topSarees,
        recentSessions: sessions.slice(0, 5)
      });
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-3xl font-bold heading-font text-primary">Analytics</h1>
          <p className="text-sm text-gray-600 mt-1">Track your performance and insights</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="text-center py-12">Loading analytics...</div>
        ) : (
          <>
            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card data-testid="total-revenue-card">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Total Revenue</CardTitle>
                  <IndianRupee className="h-5 w-5 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">₹{stats.totalRevenue.toLocaleString()}</div>
                  <p className="text-xs text-gray-500 mt-1">From completed orders</p>
                </CardContent>
              </Card>

              <Card data-testid="total-orders-card">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Total Orders</CardTitle>
                  <Package className="h-5 w-5 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.totalOrders}</div>
                  <p className="text-xs text-gray-500 mt-1">All time</p>
                </CardContent>
              </Card>

              <Card data-testid="avg-order-value-card">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Avg Order Value</CardTitle>
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">₹{Math.round(stats.avgOrderValue)}</div>
                  <p className="text-xs text-gray-500 mt-1">Per order</p>
                </CardContent>
              </Card>

              <Card data-testid="live-sessions-card">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Live Sessions</CardTitle>
                  <Video className="h-5 w-5 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.totalLiveSessions}</div>
                  <p className="text-xs text-gray-500 mt-1">Total broadcasts</p>
                </CardContent>
              </Card>
            </div>

            {/* Top Selling Sarees */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card data-testid="top-sarees">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Top Selling Sarees
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {stats.topSarees.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No sales data yet</p>
                  ) : (
                    <div className="space-y-4">
                      {stats.topSarees.map((item, idx) => (
                        <div key={item.code} className="flex items-center justify-between border-b pb-3">
                          <div className="flex items-center gap-3">
                            <div className="bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
                              {idx + 1}
                            </div>
                            <div>
                              <p className="font-semibold">{item.code}</p>
                              <p className="text-sm text-gray-500">
                                {item.saree?.fabric} • {item.saree?.color}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">{item.count} orders</p>
                            <p className="text-sm text-green-600">₹{item.revenue}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Live Sessions */}
              <Card data-testid="recent-sessions">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Video className="h-5 w-5" />
                    Recent Live Sessions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {stats.recentSessions.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No live sessions yet</p>
                  ) : (
                    <div className="space-y-4">
                      {stats.recentSessions.map((session) => (
                        <div key={session.id} className="border-b pb-3">
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-semibold">{session.title}</p>
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              session.status === 'active' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {session.status}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <div className="text-gray-500">
                              {session.platforms.join(', ')}
                            </div>
                            <div className="flex gap-4">
                              <span className="text-gray-600">{session.total_orders} orders</span>
                              <span className="text-green-600 font-semibold">₹{session.total_revenue}</span>
                            </div>
                          </div>
                          <p className="text-xs text-gray-400 mt-2">
                            {new Date(session.start_time).toLocaleString('en-IN')}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default AnalyticsPage;