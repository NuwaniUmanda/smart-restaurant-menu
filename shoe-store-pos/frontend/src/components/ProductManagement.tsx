import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface Product {
  id: number;
  name: string;
  brand_name: string;
  category_name: string;
  description: string;
  price: number;
  cost_price: number;
  image_url: string;
  variant_count: number;
  total_stock: number;
}

interface Brand {
  id: number;
  name: string;
}

interface Category {
  id: number;
  name: string;
}

const ProductManagement: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    name: '',
    brand_id: '',
    category_id: '',
    description: '',
    price: '',
    cost_price: '',
    image_url: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [productsRes, brandsRes, categoriesRes] = await Promise.all([
        axios.get('http://localhost/shoe-store-pos/backend/api/products.php'),
        axios.get('http://localhost/shoe-store-pos/backend/api/brands.php'),
        axios.get('http://localhost/shoe-store-pos/backend/api/categories.php')
      ]);

      setProducts(productsRes.data);
      setBrands(brandsRes.data);
      setCategories(categoriesRes.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const productData = {
        ...formData,
        price: parseFloat(formData.price),
        cost_price: parseFloat(formData.cost_price),
        brand_id: formData.brand_id ? parseInt(formData.brand_id) : null,
        category_id: formData.category_id ? parseInt(formData.category_id) : null
      };

      if (editingProduct) {
        await axios.put('http://localhost/shoe-store-pos/backend/api/products.php', {
          ...productData,
          id: editingProduct.id
        });
        alert('Product updated successfully!');
      } else {
        await axios.post('http://localhost/shoe-store-pos/backend/api/products.php', productData);
        alert('Product created successfully!');
      }

      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Error saving product. Please try again.');
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      brand_id: product.brand_name ? brands.find(b => b.name === product.brand_name)?.id.toString() || '' : '',
      category_id: product.category_name ? categories.find(c => c.name === product.category_name)?.id.toString() || '' : '',
      description: product.description,
      price: product.price.toString(),
      cost_price: product.cost_price.toString(),
      image_url: product.image_url
    });
    setShowModal(true);
  };

  const handleDelete = async (product: Product) => {
    if (window.confirm(`Are you sure you want to delete "${product.name}"?`)) {
      try {
        await axios.delete('http://localhost/shoe-store-pos/backend/api/products.php', {
          data: { id: product.id }
        });
        alert('Product deleted successfully!');
        fetchData();
      } catch (error) {
        console.error('Error deleting product:', error);
        alert('Error deleting product. Please try again.');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      brand_id: '',
      category_id: '',
      description: '',
      price: '',
      cost_price: '',
      image_url: ''
    });
    setEditingProduct(null);
    setShowModal(false);
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.brand_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="card">
        <div style={{ textAlign: 'center', padding: '50px' }}>
          Loading products...
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="card-header">
        <h1 className="card-title">Product Management</h1>
        <button
          className="btn btn-primary"
          onClick={() => setShowModal(true)}
        >
          Add New Product
        </button>
      </div>

      <div className="card">
        <div className="search-bar">
          <input
            type="text"
            className="search-input"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <span className="search-icon">🔍</span>
        </div>

        <table className="table">
          <thead>
            <tr>
              <th>Image</th>
              <th>Name</th>
              <th>Brand</th>
              <th>Category</th>
              <th>Price</th>
              <th>Cost</th>
              <th>Stock</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((product) => (
              <tr key={product.id}>
                <td>
                  <img
                    src={product.image_url}
                    alt={product.name}
                    style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '5px' }}
                  />
                </td>
                <td>{product.name}</td>
                <td>{product.brand_name || 'N/A'}</td>
                <td>{product.category_name || 'N/A'}</td>
                <td>${product.price.toFixed(2)}</td>
                <td>${product.cost_price.toFixed(2)}</td>
                <td>
                  <span style={{ 
                    color: product.total_stock < 10 ? '#e74c3c' : '#27ae60',
                    fontWeight: 'bold'
                  }}>
                    {product.total_stock}
                  </span>
                </td>
                <td>
                  <button
                    className="btn btn-warning"
                    style={{ marginRight: '10px' }}
                    onClick={() => handleEdit(product)}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={() => handleDelete(product)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredProducts.length === 0 && (
          <div style={{ textAlign: 'center', padding: '50px', color: '#999' }}>
            No products found.
          </div>
        )}
      </div>

      {/* Product Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h3>
              <button className="close-btn" onClick={resetForm}>
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Product Name *</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-col">
                  <label className="form-label">Brand</label>
                  <select
                    className="form-control"
                    value={formData.brand_id}
                    onChange={(e) => setFormData({...formData, brand_id: e.target.value})}
                  >
                    <option value="">Select Brand</option>
                    {brands.map(brand => (
                      <option key={brand.id} value={brand.id}>
                        {brand.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-col">
                  <label className="form-label">Category</label>
                  <select
                    className="form-control"
                    value={formData.category_id}
                    onChange={(e) => setFormData({...formData, category_id: e.target.value})}
                  >
                    <option value="">Select Category</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-control"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>

              <div className="form-row">
                <div className="form-col">
                  <label className="form-label">Selling Price *</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    required
                  />
                </div>

                <div className="form-col">
                  <label className="form-label">Cost Price</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    value={formData.cost_price}
                    onChange={(e) => setFormData({...formData, cost_price: e.target.value})}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Image URL</label>
                <input
                  type="url"
                  className="form-control"
                  value={formData.image_url}
                  onChange={(e) => setFormData({...formData, image_url: e.target.value})}
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={resetForm}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingProduct ? 'Update Product' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductManagement;