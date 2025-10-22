import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Package, 
  AlertTriangle,
  Filter,
  X
} from 'lucide-react';
import { dataService } from '../services/dataService';
import { Shoe, ShoeSize } from '../types';

const InventoryManagement: React.FC = () => {
  const [shoes, setShoes] = useState<Shoe[]>([]);
  const [filteredShoes, setFilteredShoes] = useState<Shoe[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingShoe, setEditingShoe] = useState<Shoe | null>(null);
  const [lowStockOnly, setLowStockOnly] = useState(false);

  useEffect(() => {
    loadShoes();
  }, []);

  useEffect(() => {
    filterShoes();
  }, [shoes, searchQuery, selectedCategory, lowStockOnly]);

  const loadShoes = async () => {
    try {
      const shoesData = await dataService.getShoes();
      setShoes(shoesData);
    } catch (error) {
      console.error('Failed to load shoes:', error);
    }
  };

  const filterShoes = () => {
    let filtered = [...shoes];

    // Search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(shoe =>
        shoe.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        shoe.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        shoe.color.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(shoe => shoe.category === selectedCategory);
    }

    // Low stock filter
    if (lowStockOnly) {
      filtered = filtered.filter(shoe =>
        shoe.sizes.some(size => size.stock <= 2 && size.stock > 0)
      );
    }

    setFilteredShoes(filtered);
  };

  const handleAddShoe = async (shoeData: Omit<Shoe, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      await dataService.addShoe(shoeData);
      await loadShoes();
      setShowAddModal(false);
    } catch (error) {
      console.error('Failed to add shoe:', error);
    }
  };

  const handleUpdateShoe = async (id: string, updates: Partial<Shoe>) => {
    try {
      await dataService.updateShoe(id, updates);
      await loadShoes();
      setEditingShoe(null);
    } catch (error) {
      console.error('Failed to update shoe:', error);
    }
  };

  const handleDeleteShoe = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this shoe?')) {
      try {
        await dataService.deleteShoe(id);
        await loadShoes();
      } catch (error) {
        console.error('Failed to delete shoe:', error);
      }
    }
  };

  const getTotalStock = (shoe: Shoe) => {
    return shoe.sizes.reduce((total, size) => total + size.stock, 0);
  };

  const hasLowStock = (shoe: Shoe) => {
    return shoe.sizes.some(size => size.stock <= 2 && size.stock > 0);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Inventory Management</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add New Shoe
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search shoes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Categories</option>
            <option value="men">Men</option>
            <option value="women">Women</option>
            <option value="kids">Kids</option>
            <option value="unisex">Unisex</option>
          </select>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={lowStockOnly}
              onChange={(e) => setLowStockOnly(e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm">Low Stock Only</span>
          </label>

          <div className="text-sm text-gray-600 flex items-center">
            <Package className="w-4 h-4 mr-1" />
            {filteredShoes.length} shoes found
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Shoe
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sizes & Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredShoes.map((shoe) => (
                <tr key={shoe.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center mr-3">
                        <Package className="w-5 h-5 text-gray-400" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{shoe.name}</div>
                        <div className="text-sm text-gray-500">{shoe.brand}</div>
                        <div className="text-xs text-gray-400">{shoe.color}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                      {shoe.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${shoe.basePrice.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {getTotalStock(shoe)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {shoe.sizes.map((size) => (
                        <span
                          key={size.size}
                          className={`px-2 py-1 text-xs rounded ${
                            size.stock === 0
                              ? 'bg-red-100 text-red-800'
                              : size.stock <= 2
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {size.size}: {size.stock}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {hasLowStock(shoe) ? (
                      <div className="flex items-center text-yellow-600">
                        <AlertTriangle className="w-4 h-4 mr-1" />
                        <span className="text-xs">Low Stock</span>
                      </div>
                    ) : getTotalStock(shoe) === 0 ? (
                      <span className="text-xs text-red-600">Out of Stock</span>
                    ) : (
                      <span className="text-xs text-green-600">In Stock</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setEditingShoe(shoe)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteShoe(shoe.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Shoe Modal */}
      {(showAddModal || editingShoe) && (
        <ShoeModal
          shoe={editingShoe}
          onSave={editingShoe ? 
            (updates) => handleUpdateShoe(editingShoe.id, updates) : 
            handleAddShoe
          }
          onClose={() => {
            setShowAddModal(false);
            setEditingShoe(null);
          }}
        />
      )}
    </div>
  );
};

// Shoe Modal Component
const ShoeModal: React.FC<{
  shoe?: Shoe | null;
  onSave: (shoe: any) => void;
  onClose: () => void;
}> = ({ shoe, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    name: shoe?.name || '',
    brand: shoe?.brand || '',
    category: shoe?.category || 'unisex',
    type: shoe?.type || 'sneakers',
    color: shoe?.color || '',
    material: shoe?.material || '',
    basePrice: shoe?.basePrice || 0,
    description: shoe?.description || '',
    sizes: shoe?.sizes || [{ size: '8', stock: 0, sku: '' }],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const addSize = () => {
    setFormData({
      ...formData,
      sizes: [...formData.sizes, { size: '', stock: 0, sku: '' }],
    });
  };

  const updateSize = (index: number, field: keyof ShoeSize, value: string | number) => {
    const newSizes = [...formData.sizes];
    newSizes[index] = { ...newSizes[index], [field]: value };
    setFormData({ ...formData, sizes: newSizes });
  };

  const removeSize = (index: number) => {
    const newSizes = formData.sizes.filter((_, i) => i !== index);
    setFormData({ ...formData, sizes: newSizes });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-screen overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">
            {shoe ? 'Edit Shoe' : 'Add New Shoe'}
          </h3>
          <button onClick={onClose}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Brand</label>
              <input
                type="text"
                required
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              >
                <option value="men">Men</option>
                <option value="women">Women</option>
                <option value="kids">Kids</option>
                <option value="unisex">Unisex</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              >
                <option value="sneakers">Sneakers</option>
                <option value="boots">Boots</option>
                <option value="sandals">Sandals</option>
                <option value="dress">Dress</option>
                <option value="casual">Casual</option>
                <option value="athletic">Athletic</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Price ($)</label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.basePrice}
                onChange={(e) => setFormData({ ...formData, basePrice: parseFloat(e.target.value) })}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Color</label>
              <input
                type="text"
                required
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Material</label>
              <input
                type="text"
                required
                value={formData.material}
                onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium">Sizes & Stock</label>
              <button
                type="button"
                onClick={addSize}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                + Add Size
              </button>
            </div>
            <div className="space-y-2">
              {formData.sizes.map((size, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <input
                    type="text"
                    placeholder="Size"
                    value={size.size}
                    onChange={(e) => updateSize(index, 'size', e.target.value)}
                    className="w-20 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="number"
                    placeholder="Stock"
                    value={size.stock}
                    onChange={(e) => updateSize(index, 'stock', parseInt(e.target.value) || 0)}
                    className="w-20 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    placeholder="SKU"
                    value={size.sku}
                    onChange={(e) => updateSize(index, 'sku', e.target.value)}
                    className="flex-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => removeSize(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              {shoe ? 'Update' : 'Add'} Shoe
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InventoryManagement;