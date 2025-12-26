import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { liveService, orderService, sareeService } from '../services/api';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Video, Package, TrendingUp, DollarSign, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';

const DashboardPage = () => {
  const { seller, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    activeLives: 0,
    totalSarees: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [ordersRes, sareesRes, sessionsRes] = await Promise.all([
        orderService.getAll(),
        sareeService.getAll(),
        liveService.getSessions(),
      ]);

      const orders = ordersRes.data;
      const sarees = sareesRes.data;
      const sessions = sessionsRes.data;

      const totalRevenue = orders
        .filter(o => o.payment_status === 'completed')
        .reduce((sum, o) => sum + o.amount, 0);
      
      const activeLives = sessions.filter(s => s.status === 'active').length;

      setStats({
        totalOrders: orders.length,
        totalRevenue,
        activeLives,
        totalSarees: sarees.length,
      });

      setRecentOrders(orders.slice(0, 5));
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold heading-font text-primary">SareeLive OS</h1>
              <p className="text-sm text-gray-600 mt-1">Welcome back, {seller?.business_name}</p>
            </div>
            <Button variant="outline" onClick={logout} data-testid="logout-btn">Logout</Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Actions */}
        <div className="mb-8">
          <Button 
            size="lg" 
            className="btn-hover-lift"
            onClick={() => navigate('/go-live')}
            data-testid="go-live-btn"
          >
            <Video className="mr-2 h-5 w-5" />
            Go Live Now
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="fade-in" data-testid="total-orders-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Orders</CardTitle>
              <ShoppingBag className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalOrders}</div>
              <p className="text-xs text-gray-500 mt-1">All time orders</p>
            </CardContent>
          </Card>

          <Card className="fade-in" data-testid="total-revenue-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Revenue</CardTitle>
              <TrendingUp className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">₹{stats.totalRevenue.toLocaleString()}</div>
              <p className="text-xs text-gray-500 mt-1">Confirmed payments</p>
            </CardContent>
          </Card>

          <Card className="fade-in" data-testid="active-lives-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Active Lives</CardTitle>
              <Video className="h-5 w-5 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.activeLives}</div>
              <p className="text-xs text-gray-500 mt-1">Currently broadcasting</p>
            </CardContent>
          </Card>

          <Card className="fade-in" data-testid="total-sarees-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Sarees</CardTitle>
              <Package className="h-5 w-5 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalSarees}</div>
              <p className="text-xs text-gray-500 mt-1">In your catalog</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/catalog')} data-testid="catalog-link">
            <CardHeader>
              <CardTitle className="text-lg">Saree Catalog</CardTitle>
              <CardDescription>Manage your products</CardDescription>
            </CardHeader>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/orders')} data-testid="orders-link">
            <CardHeader>
              <CardTitle className="text-lg">Orders</CardTitle>
              <CardDescription>Track and manage orders</CardDescription>
            </CardHeader>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/analytics')} data-testid="analytics-link">
            <CardHeader>
              <CardTitle className="text-lg">Analytics</CardTitle>
              <CardDescription>View performance metrics</CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Recent Orders */}
        <Card data-testid="recent-orders">
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>Your latest transactions</CardDescription>
          </CardHeader>
          <CardContent>
            {recentOrders.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No orders yet</p>
            ) : (
              <div className="space-y-4">
                {recentOrders.map((order) => (
                  <div key={order.order_id} className="flex items-center justify-between border-b pb-4">
                    <div>
                      <p className="font-medium">{order.order_id}</p>
                      <p className="text-sm text-gray-500">{order.customer_name} • {order.saree_code}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">₹{order.amount}</p>
                      <span className={`status-badge status-${order.order_status}`}>{order.order_status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default DashboardPage;
