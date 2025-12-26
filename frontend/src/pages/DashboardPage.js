import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { liveService, orderService, sareeService } from '../services/api';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Video, Package, TrendingUp, ShoppingBag, Settings, LayoutGrid, ShoppingCart, BarChart3, Link2 } from 'lucide-react';
import { toast } from 'sonner';

const DashboardPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
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
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Modern Sidebar Navigation */}
      <div className="fixed left-0 top-0 h-full w-20 bg-gray-900/50 backdrop-blur-xl border-r border-gray-700/50 flex flex-col items-center py-6 z-50">
        <div className="mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
            <Video className="h-6 w-6 text-white" />
          </div>
        </div>
        
        <nav className="flex-1 space-y-4">
          <NavIcon icon={LayoutGrid} label="Dashboard" active={isActive('/dashboard')} onClick={() => navigate('/dashboard')} />
          <NavIcon icon={Package} label="Inventory" active={isActive('/inventory')} onClick={() => navigate('/inventory')} />
          <NavIcon icon={ShoppingCart} label="Orders" active={isActive('/orders')} onClick={() => navigate('/orders')} />
          <NavIcon icon={BarChart3} label="Analytics" active={isActive('/analytics')} onClick={() => navigate('/analytics')} />
          <NavIcon icon={Link2} label="Connect" active={isActive('/connect-accounts')} onClick={() => navigate('/connect-accounts')} />
          <NavIcon icon={Settings} label="Settings" active={isActive('/settings')} onClick={() => navigate('/settings')} />
        </nav>
      </div>

      {/* Main Content */}
      <div className="ml-20">
        {/* Header */}
        <header className="bg-gray-900/30 backdrop-blur-xl border-b border-gray-700/50 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-8 py-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-4xl font-bold heading-font bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">Dashboard</h1>
                <p className="text-gray-400 mt-2">Welcome to your Live Commerce Hub</p>
              </div>
              <Button 
                size="lg" 
                className="btn-hover-lift bg-gradient-to-r from-primary to-secondary border-0 shadow-lg shadow-primary/50"
                onClick={() => navigate('/go-live')}
                data-testid="go-live-btn"
              >
                <Video className="mr-2 h-5 w-5" />
                Go Live Now
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-8 py-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatsCard 
              icon={ShoppingBag}
              label="Total Orders"
              value={stats.totalOrders}
              subtitle="All time orders"
              color="blue"
              testId="total-orders-card"
            />
            <StatsCard 
              icon={TrendingUp}
              label="Total Revenue"
              value={`₹${stats.totalRevenue.toLocaleString()}`}
              subtitle="Confirmed payments"
              color="green"
              testId="total-revenue-card"
            />
            <StatsCard 
              icon={Video}
              label="Active Lives"
              value={stats.activeLives}
              subtitle="Currently broadcasting"
              color="red"
              testId="active-lives-card"
            />
            <StatsCard 
              icon={Package}
              label="Total Sarees"
              value={stats.totalSarees}
              subtitle="In your catalog"
              color="purple"
              testId="total-sarees-card"
            />
          </div>

          {/* Quick Links Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <QuickLinkCard
              icon={Package}
              title="Inventory"
              description="Stock levels and management"
              onClick={() => navigate('/inventory')}
              testId="inventory-link"
            />
            <QuickLinkCard
              icon={ShoppingCart}
              title="Orders"
              description="Track and manage orders"
              onClick={() => navigate('/orders')}
              testId="orders-link"
            />
            <QuickLinkCard
              icon={BarChart3}
              title="Analytics"
              description="View performance metrics"
              onClick={() => navigate('/analytics')}
              testId="analytics-link"
            />
          </div>

          {/* Recent Orders */}
          <Card className="bg-gray-800/50 backdrop-blur-xl border-gray-700/50" data-testid="recent-orders">
            <CardHeader>
              <CardTitle className="text-white">Recent Orders</CardTitle>
              <CardDescription className="text-gray-400">Your latest transactions</CardDescription>
            </CardHeader>
            <CardContent>
              {recentOrders.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="mx-auto h-16 w-16 text-gray-600 mb-4" />
                  <p className="text-gray-400 text-lg">No orders yet. Start by adding sarees to your catalog!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentOrders.map((order) => (
                    <div key={order.order_id} className="flex items-center justify-between bg-gray-900/50 rounded-lg p-4 border border-gray-700/50">
                      <div>
                        <p className="font-medium text-white">{order.order_id}</p>
                        <p className="text-sm text-gray-400">{order.customer_name} • {order.saree_code}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-white">₹{order.amount}</p>
                        <span className={`status-badge status-${order.order_status} text-xs`}>{order.order_status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
};

const NavIcon = ({ icon: Icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`w-14 h-14 rounded-xl flex items-center justify-center transition-all group relative ${
      active 
        ? 'bg-gradient-to-br from-primary to-secondary shadow-lg shadow-primary/50' 
        : 'bg-gray-800/50 hover:bg-gray-700/50'
    }`}
    title={label}
  >
    <Icon className={`h-6 w-6 ${active ? 'text-white' : 'text-gray-400 group-hover:text-white'}`} />
    <span className="absolute left-full ml-4 px-3 py-1 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
      {label}
    </span>
  </button>
);

const StatsCard = ({ icon: Icon, label, value, subtitle, color, testId }) => {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    red: 'from-red-500 to-red-600',
    purple: 'from-purple-500 to-purple-600'
  };

  return (
    <Card className="bg-gray-800/50 backdrop-blur-xl border-gray-700/50 hover:border-gray-600/50 transition-all" data-testid={testId}>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center shadow-lg`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
        <p className="text-gray-400 text-sm mb-1">{label}</p>
        <p className="text-3xl font-bold text-white mb-1">{value}</p>
        <p className="text-xs text-gray-500">{subtitle}</p>
      </CardContent>
    </Card>
  );
};

const QuickLinkCard = ({ icon: Icon, title, description, onClick, testId }) => (
  <Card 
    className="bg-gray-800/50 backdrop-blur-xl border-gray-700/50 hover:border-primary/50 cursor-pointer transition-all hover:scale-105"
    onClick={onClick}
    data-testid={testId}
  >
    <CardContent className="pt-6">
      <Icon className="h-8 w-8 text-primary mb-3" />
      <CardTitle className="text-lg text-white mb-2">{title}</CardTitle>
      <CardDescription className="text-gray-400">{description}</CardDescription>
    </CardContent>
  </Card>
);

export default DashboardPage;