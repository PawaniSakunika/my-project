import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import './Clubs.css';

const emptyOfficial = { name: '', email: '', phone: '', address: '' };

const Clubs = () => {
  const [clubs, setClubs] = useState([]);
  const [user, setUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    name: '', sinceYear: '', address: '', email: '', phone: '',
    president: { ...emptyOfficial },
    secretary: { ...emptyOfficial },
    treasurer: { ...emptyOfficial },
    vicePresident: { ...emptyOfficial },
    assistantSecretary: { ...emptyOfficial },
    assistantTreasurer: { ...emptyOfficial },
  });

  useEffect(() => {
    const loggedInUser = localStorage.getItem('user');
    let role = '';
    if (loggedInUser) {
      const parsedUser = JSON.parse(loggedInUser);
      setUser(parsedUser);
      role = parsedUser.role;
    }
    fetchClubs(role);
  }, []);

  const fetchClubs = async (role) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/clubs?role=${role}`);
      setClubs(response.data);
    } catch (error) {
      toast.error('Error fetching clubs');
    }
  };

  const handleGeneralChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleOfficialChange = (officialRole, field, value) => {
    setFormData({
      ...formData,
      [officialRole]: {
        ...formData[officialRole],
        [field]: value
      }
    });
  };

  const resetForm = () => {
    setFormData({
      name: '', sinceYear: '', address: '', email: '', phone: '',
      president: { ...emptyOfficial },
      secretary: { ...emptyOfficial },
      treasurer: { ...emptyOfficial },
      vicePresident: { ...emptyOfficial },
      assistantSecretary: { ...emptyOfficial },
      assistantTreasurer: { ...emptyOfficial },
    });
    setIsEditMode(false);
    setEditingId(null);
  };

  const openAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (club) => {
    setFormData({
      name: club.name, sinceYear: club.sinceYear, address: club.address, email: club.email, phone: club.phone,
      president: club.president || { ...emptyOfficial },
      secretary: club.secretary || { ...emptyOfficial },
      treasurer: club.treasurer || { ...emptyOfficial },
      vicePresident: club.vicePresident || { ...emptyOfficial },
      assistantSecretary: club.assistantSecretary || { ...emptyOfficial },
      assistantTreasurer: club.assistantTreasurer || { ...emptyOfficial }
    });
    setEditingId(club._id);
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Build payload — remove optional officials if name is empty
      const payload = { ...formData };
      const optionalFields = ['vicePresident', 'assistantSecretary', 'assistantTreasurer'];
      optionalFields.forEach(field => {
        if (!payload[field]?.name) {
          delete payload[field];
        }
      });

      if (isEditMode) {
        await axios.put(`http://localhost:5000/api/clubs/${editingId}`, payload);
        toast.success('Club updated successfully');
      } else {
        await axios.post('http://localhost:5000/api/clubs', payload);
        toast.success('Club registered successfully. Waiting for admin approval.');
      }
      setIsModalOpen(false);
      resetForm();
      fetchClubs(user?.role);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error processing request');
    }
  };

  const handleApprove = async (id) => {
    try {
      await axios.put(`http://localhost:5000/api/clubs/${id}/approve`);
      toast.success('Club approved');
      fetchClubs(user?.role);
    } catch (error) {
      toast.error('Error approving club');
    }
  };

  const handleToggleActive = async (id, currentStatus) => {
    try {
      await axios.put(`http://localhost:5000/api/clubs/${id}/toggle-active`, { isActive: !currentStatus });
      toast.success(`Club marked as ${!currentStatus ? 'Active' : 'Inactive'}`);
      fetchClubs(user?.role);
    } catch (error) {
      toast.error('Error updating club status');
    }
  };

  const renderOfficialInputs = (roleKey, title, required) => (
    <>
      <h3 className={`section-title ${!required ? 'optional-section-title' : ''}`}>
        {title} {required ? '*' : '(Optional)'}
      </h3>
      <div className="form-group">
        <label>Name</label>
        <input type="text" value={formData[roleKey].name} onChange={(e) => handleOfficialChange(roleKey, 'name', e.target.value)} required={required} />
      </div>
      <div className="form-group">
        <label>Email</label>
        <input type="email" value={formData[roleKey].email} onChange={(e) => handleOfficialChange(roleKey, 'email', e.target.value)} required={required} />
      </div>
      <div className="form-group">
        <label>Phone</label>
        <input type="text" value={formData[roleKey].phone} onChange={(e) => handleOfficialChange(roleKey, 'phone', e.target.value)} required={required} />
      </div>
      <div className="form-group">
        <label>Address</label>
        <input type="text" value={formData[roleKey].address} onChange={(e) => handleOfficialChange(roleKey, 'address', e.target.value)} required={required} />
      </div>
    </>
  );

  const renderOfficialInfo = (official, title) => {
    if (!official || !official.name) return null;
    return (
      <div className="club-section">
        <h4>{title}</h4>
        <p><strong>Name:</strong> {official.name}</p>
        <p><strong>Phone:</strong> {official.phone}</p>
        <p><strong>Email:</strong> {official.email}</p>
      </div>
    );
  };

  const isAdmin = user?.role === 'Admin';

  return (
    <div className="clubs-container">
      <div className="clubs-header">
        <h2>Clubs</h2>
        <button className="add-club-btn" onClick={openAddModal}>
          + Club Register
        </button>
      </div>

      <div className="clubs-list">
        {clubs.length === 0 ? (
          <p>No clubs available.</p>
        ) : (
          clubs.map((club) => (
            <div key={club._id} className="club-card">
              <div className="club-card-header">
                <div>
                  <h3>{club.name}</h3>
                  <p style={{ margin: '5px 0', color: '#666' }}>Since: {club.sinceYear}</p>
                </div>
                <div className="club-status-badges">
                  {!club.isApproved && <span className="badge badge-pending">Pending Approval</span>}
                  {club.isActive ? (
                    <span className="badge badge-active">Active</span>
                  ) : (
                    <span className="badge badge-inactive">Inactive</span>
                  )}
                </div>
              </div>

              <div className="club-details-grid">
                <div className="club-section">
                  <h4>General Info</h4>
                  <p><strong>Email:</strong> {club.email}</p>
                  <p><strong>Phone:</strong> {club.phone}</p>
                  <p><strong>Address:</strong> {club.address}</p>
                </div>
                
                {renderOfficialInfo(club.president, 'President')}
                {renderOfficialInfo(club.secretary, 'Secretary')}
                {renderOfficialInfo(club.treasurer, 'Treasurer')}
                
                {renderOfficialInfo(club.vicePresident, 'Vice President')}
                {renderOfficialInfo(club.assistantSecretary, 'Assis. Secretary')}
                {renderOfficialInfo(club.assistantTreasurer, 'Assis. Treasurer')}
              </div>

              {isAdmin && (
                <div className="club-actions">
                  {!club.isApproved && (
                    <button className="btn-approve" onClick={() => handleApprove(club._id)}>
                      Approve Club
                    </button>
                  )}
                  <button className="btn-toggle" onClick={() => handleToggleActive(club._id, club.isActive)}>
                    Set {club.isActive ? 'Inactive' : 'Active'}
                  </button>
                  <button className="btn-edit-club" onClick={() => openEditModal(club)}>
                    Edit
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="modal-overlay" style={{ zIndex: 1000 }}>
          <div className="club-modal-content">
            <h2>{isEditMode ? 'Edit Club Details' : 'Register New Club'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-grid-2">
                <h3 className="section-title">General Information</h3>
                <div className="form-group">
                  <label>Club Name</label>
                  <input type="text" name="name" value={formData.name} onChange={handleGeneralChange} required />
                </div>
                <div className="form-group">
                  <label>Since (Year)</label>
                  <input type="text" name="sinceYear" value={formData.sinceYear} onChange={handleGeneralChange} required />
                </div>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label>Club Address</label>
                  <input type="text" name="address" value={formData.address} onChange={handleGeneralChange} required />
                </div>
                <div className="form-group">
                  <label>Club Email</label>
                  <input type="email" name="email" value={formData.email} onChange={handleGeneralChange} required />
                </div>
                <div className="form-group">
                  <label>Club Phone</label>
                  <input type="text" name="phone" value={formData.phone} onChange={handleGeneralChange} required />
                </div>

                {renderOfficialInputs('president', 'President', true)}
                {renderOfficialInputs('secretary', 'Secretary', true)}
                {renderOfficialInputs('treasurer', 'Treasurer', true)}

                {renderOfficialInputs('vicePresident', 'Vice President', false)}
                {renderOfficialInputs('assistantSecretary', 'Assistant Secretary', false)}
                {renderOfficialInputs('assistantTreasurer', 'Assistant Treasurer', false)}
              </div>
              
              <div className="modal-actions" style={{ marginTop: '30px' }}>
                <button type="button" className="btn-cancel" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-submit">{isEditMode ? 'Save Changes' : 'Submit Registration'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Clubs;
