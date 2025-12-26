import React, { useState, useEffect } from 'react';
import { sareeService } from '../services/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Plus, Edit, Trash2, Package } from 'lucide-react';
import { toast } from 'sonner';

const CatalogPage = () => {
  const [sarees, setSarees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingSaree, setEditingSaree] = useState(null);
  const [formData, setFormData] = useState({
    saree_code: '',
    price: '',
    fabric: '',
    color: '',
    stock_quantity: '',
    description: '',
    images: []
  });

  useEffect(() => {
    fetchSarees();
  }, []);

  const fetchSarees = async () => {
    try {
      const response = await sareeService.getAll();
      setSarees(response.data);
    } catch (error) {
      toast.error('Failed to load sarees');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        price: parseFloat(formData.price),
        stock_quantity: parseInt(formData.stock_quantity)
      };

      if (editingSaree) {
        await sareeService.update(editingSaree.id, data);
        toast.success('Saree updated successfully');
      } else {
        await sareeService.create(data);
        toast.success('Saree added successfully');
      }

      setShowAddDialog(false);
      setEditingSaree(null);
      resetForm();
      fetchSarees();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save saree');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this saree?')) return;
    
    try {
      await sareeService.delete(id);
      toast.success('Saree deleted successfully');
      fetchSarees();
    } catch (error) {
      toast.error('Failed to delete saree');
    }
  };

  const resetForm = () => {
    setFormData({
      saree_code: '',
      price: '',
      fabric: '',
      color: '',
      stock_quantity: '',
      description: '',
      images: []
    });
  };

  const openEditDialog = (saree) => {
    setEditingSaree(saree);
    setFormData({
      saree_code: saree.saree_code,
      price: saree.price.toString(),
      fabric: saree.fabric,
      color: saree.color,
      stock_quantity: saree.stock_quantity.toString(),
      description: saree.description || '',
      images: saree.images || []
    });
    setShowAddDialog(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold heading-font text-primary">Saree Catalog</h1>
              <p className="text-sm text-gray-600 mt-1">{sarees.length} products</p>
            </div>
            <Dialog open={showAddDialog} onOpenChange={(open) => {
              setShowAddDialog(open);
              if (!open) {
                setEditingSaree(null);
                resetForm();
              }
            }}>
              <DialogTrigger asChild>
                <Button data-testid="add-saree-btn">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Saree
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingSaree ? 'Edit Saree' : 'Add New Saree'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Saree Code *</label>
                      <Input
                        value={formData.saree_code}
                        onChange={(e) => setFormData({ ...formData, saree_code: e.target.value.toUpperCase() })}
                        placeholder="e.g., SAR001"
                        required
                        data-testid="saree-code-input"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Price (₹) *</label>
                      <Input
                        type="number"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        placeholder="e.g., 2500"
                        required
                        data-testid="price-input"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Fabric *</label>
                      <Input
                        value={formData.fabric}
                        onChange={(e) => setFormData({ ...formData, fabric: e.target.value })}
                        placeholder="e.g., Silk"
                        required
                        data-testid="fabric-input"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Color *</label>
                      <Input
                        value={formData.color}
                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                        placeholder="e.g., Red"
                        required
                        data-testid="color-input"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Stock Quantity *</label>
                    <Input
                      type="number"
                      value={formData.stock_quantity}
                      onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                      placeholder="e.g., 10"
                      required
                      data-testid="stock-input"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Description</label>
                    <textarea
                      className="w-full min-h-[100px] px-3 py-2 border rounded-md"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Enter saree description"
                      data-testid="description-input"
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button type="submit" className="flex-1" data-testid="save-saree-btn">
                      {editingSaree ? 'Update Saree' : 'Add Saree'}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : sarees.length === 0 ? (
          <Card className="text-center py-12">
            <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Sarees Yet</h3>
            <p className="text-gray-500 mb-4">Get started by adding your first saree to the catalog</p>
            <Button onClick={() => setShowAddDialog(true)}>Add First Saree</Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {sarees.map((saree) => (
              <Card key={saree.id} className="saree-card" data-testid={`saree-card-${saree.saree_code}`}>
                <div className="aspect-square bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
                  {saree.images.length > 0 ? (
                    <img src={saree.images[0]} alt={saree.saree_code} className="w-full h-full object-cover" />
                  ) : (
                    <Package className="h-16 w-16 text-gray-300" />
                  )}
                </div>
                <CardContent className="pt-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-bold text-lg">{saree.saree_code}</h3>
                      <p className="text-sm text-gray-600">{saree.fabric} • {saree.color}</p>
                    </div>
                    <span className="text-primary font-bold text-lg">₹{saree.price}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                    <span>Stock: {saree.stock_quantity}</span>
                    <span className={saree.stock_quantity > 0 ? 'text-green-600' : 'text-red-600'}>
                      {saree.stock_quantity > 0 ? 'In Stock' : 'Out of Stock'}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => openEditDialog(saree)} data-testid={`edit-btn-${saree.saree_code}`}>
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button variant="destructive" size="sm" className="flex-1" onClick={() => handleDelete(saree.id)} data-testid={`delete-btn-${saree.saree_code}`}>
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default CatalogPage;
