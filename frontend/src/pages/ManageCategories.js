import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaEdit, FaPlus } from 'react-icons/fa';
import './Admin.css'; // Reuse some admin table styling if suitable

const ManageCategories = () => {
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  
  const [formData, setFormData] = useState({
    category_name: '',
    year: new Date().getFullYear(),
    status: 'Active'
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/weight-categories');
      setCategories(res.data);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    if (!formData.category_name || !formData.year) {
      toast.error('Category Name and Year are required!');
      return;
    }

    try {
      if (editId) {
        await axios.put(`http://localhost:5000/api/weight-categories/update/${editId}`, formData);
        toast.success('Category updated successfully!');
      } else {
        await axios.post('http://localhost:5000/api/weight-categories/add', formData);
        toast.success('Category added successfully!');
      }
      setShowModal(false);
      fetchCategories();
      setEditId(null);
      setFormData({ category_name: '', year: new Date().getFullYear(), status: 'Active' });
    } catch (err) {
      toast.error('Failed to save category.');
    }
  };

  const handleEdit = (cat) => {
    setEditId(cat._id);
    setFormData({
      category_name: cat.category_name,
      year: cat.year,
      status: cat.status
    });
    setShowModal(true);
  };

  const handleToggleStatus = async (cat) => {
    try {
      const newStatus = cat.status === 'Active' ? 'Inactive' : 'Active';
      await axios.put(`http://localhost:5000/api/weight-categories/update/${cat._id}`, {
        category_name: cat.category_name,
        year: cat.year,
        status: newStatus
      });
      toast.success(`Category marked as ${newStatus}`);
      fetchCategories();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  return (
    <div className="admin-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 className="admin-title">Manage Weight Categories</h2>
        <button className="btn-add" onClick={() => {
            setEditId(null);
            setFormData({ category_name: '', year: new Date().getFullYear(), status: 'Active' });
            setShowModal(true);
        }}>
          <FaPlus style={{ marginRight: '8px' }} /> Add Category
        </button>
      </div>

      <table className="admin-table">
        <thead>
          <tr>
            <th>Category Name</th>
            <th>Year</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {categories.length > 0 ? categories.map((cat) => (
            <tr key={cat._id}>
              <td>{cat.category_name}</td>
              <td>{cat.year}</td>
              <td>
                <span style={{ 
                  padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold',
                  backgroundColor: cat.status === 'Active' ? '#dcfce7' : '#fee2e2',
                  color: cat.status === 'Active' ? '#166534' : '#991b1b'
                }}>
                  {cat.status}
                </span>
              </td>
              <td>
                <button className="btn-approve" onClick={() => handleEdit(cat)} style={{ marginRight: '10px' }} title="Edit">
                  <FaEdit />
                </button>
                <button 
                  className="btn-reject" 
                  onClick={() => handleToggleStatus(cat)}
                  style={{ backgroundColor: cat.status === 'Active' ? '#f59e0b' : '#10b981' }}
                  title={cat.status === 'Active' ? 'Deactivate' : 'Activate'}
                >
                  {cat.status === 'Active' ? 'Disable' : 'Enable'}
                </button>
              </td>
            </tr>
          )) : (
            <tr><td colSpan="4" style={{ textAlign: 'center' }}>No categories found.</td></tr>
          )}
        </tbody>
      </table>

      {/* Modal for Add/Edit */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ width: '400px' }}>
            <h3>{editId ? 'Edit Category' : 'Add New Category'}</h3>
            
            <div className="form-group">
              <label>Category Name (e.g., 55kg)</label>
              <input 
                type="text" 
                name="category_name" 
                value={formData.category_name} 
                onChange={handleInputChange} 
                placeholder="e.g. 55kg"
              />
            </div>
            
            <div className="form-group">
              <label>Year</label>
              <input 
                type="number" 
                name="year" 
                value={formData.year} 
                onChange={handleInputChange} 
              />
            </div>

            <div className="form-group">
              <label>Status</label>
              <select 
                name="status" 
                value={formData.status} 
                onChange={handleInputChange}
                style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            <div className="modal-actions">
              <button className="btn-close-admin" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn-save-admin" onClick={handleSave}>{editId ? 'Update' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageCategories;
