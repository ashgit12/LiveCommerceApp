import React, { useEffect, useState } from 'react';
import { sareeService, orderService } from '../services/api';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Package, AlertTriangle, TrendingUp, Lock, CheckCircle, IndianRupee } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const InventoryDashboard = () => {
  const navigate = useNavigate();
  const [inventory, setInventory] = useState([]);
  const [stats, setStats] = useState({
    totalItems: 0,
    totalValue: 0,
    lowStock: 0,
    reserved: 0,
    sold: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const [sareesRes, ordersRes] = await Promise.all([
        sareeService.getAll(),
        orderService.getAll()
      ]);

      const sarees = sareesRes.data;
      const orders = ordersRes.data;

      // Calculate inventory stats
      const reservedItems = orders.filter(o => o.order_status === 'pending' && o.payment_status === 'pending').length;
      const soldItems = orders.filter(o => o.payment_status === 'completed').length;
      const lowStockItems = sarees.filter(s => s.stock_quantity < 5).length;
      const totalValue = sarees.reduce((sum, s) => sum + (s.price * s.stock_quantity), 0);

      setStats({
        totalItems: sarees.reduce((sum, s) => sum + s.stock_quantity, 0),
        totalValue,
        lowStock: lowStockItems,
        reserved: reservedItems,
        sold: soldItems
      });

      // Add status to each saree
      const inventoryWithStatus = sarees.map(saree => ({
        ...saree,
        status: saree.stock_quantity === 0 ? 'out_of_stock' : 
                saree.stock_quantity < 5 ? 'low_stock' : 'in_stock',
        reserved: orders.filter(o => 
          o.saree_code === saree.saree_code && 
          o.order_status === 'pending' && 
          o.payment_status === 'pending'
        ).length
      }));

      setInventory(inventoryWithStatus);
    } catch (error) {
      console.error('Failed to load inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      in_stock: <Badge className="bg-green-500">In Stock</Badge>,
      low_stock: <Badge className="bg-yellow-500">Low Stock</Badge>,
      out_of_stock: <Badge className="bg-red-500">Out of Stock</Badge>
    };
    return badges[status];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="ml-20">
        <header className="bg-gray-900/30 backdrop-blur-xl border-b border-gray-700/50 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-8 py-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-4xl font-bold heading-font bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">Inventory Dashboard</h1>
                <p className="text-gray-400 mt-2">Real-time stock management and tracking</p>
              </div>
              <Button 
                onClick={() => navigate('/catalog')}
                className="bg-gradient-to-r from-primary to-secondary"
              >
                <Package className="mr-2 h-4 w-4" />
                Manage Catalog
              </Button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-8 py-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
            <StatsCard
              icon={Package}
              label="Total Stock"
              value={stats.totalItems}
              subtitle="Items available"
              color="blue"
            />
            <StatsCard
              icon={IndianRupee}
              label="Stock Value"
              value={`₹${stats.totalValue.toLocaleString()}`}
              subtitle="Total inventory"
              color="green"
            />
            <StatsCard
              icon={AlertTriangle}
              label="Low Stock"
              value={stats.lowStock}
              subtitle="Needs restock"
              color="yellow"
            />
            <StatsCard
              icon={Lock}
              label="Reserved"
              value={stats.reserved}
              subtitle="Payment pending"
              color="purple"
            />
            <StatsCard
              icon={CheckCircle}
              label="Sold"
              value={stats.sold}
              subtitle="Completed orders"
              color="emerald"
            />
          </div>

          {/* Inventory Table */}
          <Card className="bg-gray-800/50 backdrop-blur-xl border-gray-700/50">
            <CardHeader>
              <CardTitle className="text-white">Inventory Items</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-12 text-gray-400">Loading inventory...</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left py-4 px-4 text-gray-400 font-medium">Saree Code</th>
                        <th className="text-left py-4 px-4 text-gray-400 font-medium">Details</th>
                        <th className="text-center py-4 px-4 text-gray-400 font-medium">Price</th>
                        <th className="text-center py-4 px-4 text-gray-400 font-medium">Stock</th>
                        <th className="text-center py-4 px-4 text-gray-400 font-medium">Reserved</th>
                        <th className="text-center py-4 px-4 text-gray-400 font-medium">Available</th>
                        <th className="text-center py-4 px-4 text-gray-400 font-medium">Status</th>
                        <th className="text-center py-4 px-4 text-gray-400 font-medium">Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inventory.map((item) => (
                        <tr key={item.id} className="border-b border-gray-800 hover:bg-gray-700/30 transition-colors">
                          <td className="py-4 px-4">
                            <span className="font-bold text-white text-lg">{item.saree_code}</span>
                          </td>
                          <td className="py-4 px-4">
                            <div className="text-sm">
                              <p className="text-white">{item.fabric}</p>
                              <p className="text-gray-400">{item.color}</p>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span className="text-white font-semibold">₹{item.price}</span>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span className="text-2xl font-bold text-white">{item.stock_quantity}</span>
                          </td>
                          <td className="py-4 px-4 text-center">
                            {item.reserved > 0 ? (
                              <Badge className="bg-yellow-500">{item.reserved}</Badge>
                            ) : (
                              <span className="text-gray-500">-</span>
                            )}
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span className="text-xl font-bold text-green-400">
                              {item.stock_quantity - item.reserved}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-center">
                            {getStatusBadge(item.status)}
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span className="text-white font-semibold">
                              ₹{(item.price * item.stock_quantity).toLocaleString()}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
};

const StatsCard = ({ icon: Icon, label, value, subtitle, color }) => {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    yellow: 'from-yellow-500 to-yellow-600',
    purple: 'from-purple-500 to-purple-600',
    emerald: 'from-emerald-500 to-emerald-600'
  };

  return (
    <Card className="bg-gray-800/50 backdrop-blur-xl border-gray-700/50">
      <CardContent className="pt-6">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center shadow-lg mb-4`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <p className="text-gray-400 text-sm mb-1">{label}</p>
        <p className="text-3xl font-bold text-white mb-1">{value}</p>
        <p className="text-xs text-gray-500">{subtitle}</p>
      </CardContent>
    </Card>
  );
};

export default InventoryDashboard;