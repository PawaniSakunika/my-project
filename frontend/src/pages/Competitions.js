import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import './Competitions.css';

const emptyForm = {
  name: '',
  date: '',
  registrationDeadline: '',
  type: 'Preliminary',
  ageCategory: 'Senior',
  status: 'Active',
  location: ''
};

const Competitions = () => {
  const [competitions, setCompetitions] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ ...emptyForm });

  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loggedInUser = localStorage.getItem('user');
    if (loggedInUser) {
      setUser(JSON.parse(loggedInUser));
    }
    fetchCompetitions();
  }, []);

  const fetchCompetitions = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/competitions');
      setCompetitions(response.data);
    } catch (error) {
      toast.error('Error fetching competitions');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const openAddModal = () => {
    setIsEditMode(false);
    setEditingId(null);
    setFormData({ ...emptyForm });
    setIsModalOpen(true);
  };

  const openEditModal = (comp) => {
    setIsEditMode(true);
    setEditingId(comp._id);
    // Format dates for form inputs
    const dateFormatted = comp.date ? new Date(comp.date).toISOString().split('T')[0] : '';
    const deadlineFormatted = comp.registrationDeadline
      ? new Date(comp.registrationDeadline).toISOString().slice(0, 16)
      : '';
    setFormData({
      name: comp.name,
      date: dateFormatted,
      registrationDeadline: deadlineFormatted,
      type: comp.type,
      ageCategory: comp.ageCategory,
      status: comp.status,
      location: comp.location
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditMode) {
        await axios.put(`http://localhost:5000/api/competitions/${editingId}`, formData);
        toast.success('Competition updated successfully');
      } else {
        await axios.post('http://localhost:5000/api/competitions', formData);
        toast.success('Competition created successfully');
      }
      setIsModalOpen(false);
      fetchCompetitions();
      setFormData({ ...emptyForm });
    } catch (error) {
      toast.error(isEditMode ? 'Error updating competition' : 'Error creating competition');
    }
  };

  const calculateCountdown = (deadline) => {
    const total = Date.parse(deadline) - Date.parse(new Date());
    if (total <= 0) return "Registration Closed";
    const days = Math.floor(total / (1000 * 60 * 60 * 24));
    const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
    return `${days} Days, ${hours} Hours remaining`;
  };

  const role = user?.role;
  const canAddCompetition = role === 'Admin';
  const canRegisterAndView = role === 'Admin' || role === 'Coach';

  return (
    <div className="competitions-container">
      <div className="competitions-header">
        <h2>Competitions</h2>
        {canAddCompetition && (
          <button className="add-competition-btn" onClick={openAddModal}>
            + Add Competition
          </button>
        )}
      </div>

      <div className="competitions-list">
        {competitions.length === 0 ? (
          <p>No competitions found.</p>
        ) : (
          competitions.map((comp) => (
            <div key={comp._id} className="competition-card">
              <div className="competition-info">
                <h3>{comp.name}</h3>
                <p><strong>Date:</strong> {new Date(comp.date).toLocaleDateString()}</p>
                <p><strong>Location:</strong> {comp.location}</p>
                <p><strong>Type:</strong> {comp.type} | <strong>Category:</strong> {comp.ageCategory}</p>
                <p>
                  <strong>Status: </strong>
                  <span className={`status-badge ${comp.status === 'Active' ? 'status-active' : 'status-inactive'}`}>
                    {comp.status}
                  </span>
                </p>
                {comp.status === 'Active' && (
                  <p className="countdown">
                    ⏳ {calculateCountdown(comp.registrationDeadline)}
                  </p>
                )}
              </div>
              <div className="competition-actions">
                {canAddCompetition && (
                  <button
                    className="btn-edit-comp"
                    onClick={() => openEditModal(comp)}
                  >
                    Edit
                  </button>
                )}
                {canRegisterAndView && (
                  <>
                    <button
                      className="btn-register"
                      onClick={() => navigate(`/competitions/${comp._id}/register`)}
                    >
                      Register
                    </button>
                    <button
                      className="btn-view"
                      onClick={() => navigate(`/competitions/${comp._id}/view`)}
                    >
                      View
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>{isEditMode ? 'Edit Competition' : 'Add Competition'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Name</label>
                <input type="text" name="name" value={formData.name} onChange={handleInputChange} required />
              </div>
              <div className="form-group">
                <label>Competition Date</label>
                <input type="date" name="date" value={formData.date} onChange={handleInputChange} required />
              </div>
              <div className="form-group">
                <label>Registration Deadline</label>
                <input type="datetime-local" name="registrationDeadline" value={formData.registrationDeadline} onChange={handleInputChange} required />
              </div>
              <div className="form-group">
                <label>Type</label>
                <select name="type" value={formData.type} onChange={handleInputChange}>
                  <option value="Preliminary">Preliminary</option>
                  <option value="Final">Final</option>
                </select>
              </div>
              <div className="form-group">
                <label>Age Category</label>
                <select name="ageCategory" value={formData.ageCategory} onChange={handleInputChange}>
                  <option value="Youth">Youth</option>
                  <option value="Junior">Junior</option>
                  <option value="Senior">Senior</option>
                </select>
              </div>
              <div className="form-group">
                <label>Status</label>
                <select name="status" value={formData.status} onChange={handleInputChange}>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              <div className="form-group">
                <label>Location</label>
                <input type="text" name="location" value={formData.location} onChange={handleInputChange} required />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-submit">{isEditMode ? 'Update' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Competitions;
