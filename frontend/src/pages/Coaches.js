import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  FaDownload,
  FaEdit,
  FaPlus,
  FaSave,
  FaSearch,
  FaTimes
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import './Coaches.css';

const sriLankaLocations = {
  Central: ['Kandy', 'Matale', 'Nuwara Eliya'],
  Eastern: ['Ampara', 'Batticaloa', 'Trincomalee'],
  'North Central': ['Anuradhapura', 'Polonnaruwa'],
  Northern: ['Jaffna', 'Kilinochchi', 'Mannar', 'Mullaitivu', 'Vavuniya'],
  'North Western': ['Kurunegala', 'Puttalam'],
  Sabaragamuwa: ['Kegalle', 'Ratnapura'],
  Southern: ['Galle', 'Hambantota', 'Matara'],
  Uva: ['Badulla', 'Monaragala'],
  Western: ['Colombo', 'Gampaha', 'Kalutara']
};

const emptyForm = {
  userId: '',
  localLicenceNumber: '',
  internationalLicenceNumber: '',
  province: '',
  district: '',
  postalCode: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  status: 'Active'
};

const Coaches = () => {
  const [coachesList, setCoachesList] = useState([]);
  const [dropdownCoaches, setDropdownCoaches] = useState([]);
  const [athletes, setAthletes] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editCoachId, setEditCoachId] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [fileData, setFileData] = useState({
    photo: null,
    localLicence: null,
    internationalLicence: null
  });

  useEffect(() => {
    const loggedUser = localStorage.getItem('user');
    if (loggedUser) {
      setCurrentUser(JSON.parse(loggedUser));
    }
    fetchCoaches();
    fetchDropdownData();
    fetchAthletes();
  }, []);

  const fetchCoaches = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/athletes/coaches/all');
      setCoachesList(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching coach profiles:', error);
      setCoachesList([]);
    }
  };

  const fetchDropdownData = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/athletes/users/coaches');
      const coachesData = response.data.data ? response.data.data : response.data;
      setDropdownCoaches(Array.isArray(coachesData) ? coachesData : []);
    } catch (error) {
      console.error('Error fetching coaches dropdown:', error);
      setDropdownCoaches([]);
    }
  };

  const fetchAthletes = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/athletes/all');
      setAthletes(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching athlete assignments:', error);
      setAthletes([]);
    }
  };

  const resetForm = () => {
    setEditCoachId(null);
    setFormData(emptyForm);
    setFileData({ photo: null, localLicence: null, internationalLicence: null });
  };

  const handleOpenForm = () => {
    if (currentUser && (currentUser.role === 'Coach' || currentUser.role === 'Admin')) {
      resetForm();
      setIsFormOpen(true);
    } else {
      toast.error(<div>Access Denied! Only Coaches can enter data.</div>);
    }
  };

  const handleCoachSelect = (e) => {
    const selectedId = e.target.value;
    if (!selectedId) return;

    setFormData((prev) => ({
      ...prev,
      userId: selectedId
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'province') {
      setFormData((prev) => ({ ...prev, province: value, district: '' }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    setFileData((prev) => ({ ...prev, [name]: files[0] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!editCoachId && !fileData.photo) {
      toast.error('Photo is mandatory for new coaches.');
      return;
    }

    try {
      const formPayload = new FormData();
      Object.keys(formData).forEach((key) => {
        formPayload.append(key, formData[key]);
      });

      if (fileData.photo) formPayload.append('photo', fileData.photo);
      if (fileData.localLicence) formPayload.append('localLicence', fileData.localLicence);
      if (fileData.internationalLicence) formPayload.append('internationalLicence', fileData.internationalLicence);

      const response = editCoachId
        ? await axios.put(`http://localhost:5000/api/athletes/coaches/update/${editCoachId}`, formPayload, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        : await axios.post('http://localhost:5000/api/athletes/coaches/add', formPayload, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

      if (response.data.success) {
        toast.success(<div>{response.data.message}</div>);
        await fetchCoaches();
        setIsFormOpen(false);
        resetForm();
      }
    } catch (error) {
      console.error('Error saving coach:', error);
      toast.error(<div>Something went wrong! Please try again.</div>);
    }
  };

  const handleEdit = (coach) => {
    if (currentUser && currentUser.role !== 'Coach' && currentUser.role !== 'Admin') {
      toast.error(<div>Access Denied! Only Coaches can enter data.</div>);
      return;
    }

    setEditCoachId(coach._id);
    setIsFormOpen(true);
    setFormData({
      userId: coach.userId?._id || '',
      localLicenceNumber: coach.localLicenceNumber || '',
      internationalLicenceNumber: coach.internationalLicenceNumber || '',
      province: coach.province || '',
      district: coach.district || '',
      postalCode: coach.postalCode || '',
      addressLine1: coach.addressLine1 || '',
      addressLine2: coach.addressLine2 || '',
      city: coach.city || '',
      status: coach.status || 'Active'
    });
    setFileData({ photo: null, localLicence: null, internationalLicence: null });
  };

  const registeredCoachUserIds = new Set(
    coachesList.map((coach) => coach.userId?._id).filter(Boolean)
  );

  const selectableCoaches = dropdownCoaches.filter((coach) => (
    editCoachId ||
    !registeredCoachUserIds.has(coach._id) ||
    coach._id === formData.userId
  ));

  const getGenderInitial = (gender) => {
    if (!gender) return 'N/A';
    const firstLetter = gender.trim().toUpperCase().charAt(0);
    return firstLetter === 'M' || firstLetter === 'F' ? firstLetter : gender;
  };

  const getCoachName = (coach) => `${coach.userId?.firstName || ''} ${coach.userId?.lastName || ''}`.trim();

  const coachesWithAssignments = useMemo(() => {
    return coachesList.map((coach) => {
      const fullName = getCoachName(coach);
      const assignedAthletes = athletes.filter((athlete) => athlete.selectedCoach === fullName);
      return { ...coach, fullName, assignedAthletes };
    });
  }, [coachesList, athletes]);

  const filteredCoaches = coachesWithAssignments.filter((coach) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      coach.fullName.toLowerCase().includes(term) ||
      (coach.userId?.nic || '').toLowerCase().includes(term) ||
      (coach.localLicenceNumber || '').toLowerCase().includes(term) ||
      (coach.internationalLicenceNumber || '').toLowerCase().includes(term)
    );
  });

  return (
    <div className="coaches-page-container">
      <div className="coaches-header">
        <button className="add-coach-btn" onClick={handleOpenForm}>
          <FaPlus /> Add Coach
        </button>
        <div className="coach-search-box">
          <FaSearch className="coach-search-icon" />
          <input
            type="text"
            placeholder="Search Coach..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {isFormOpen && (
        <div className="modal-overlay coach-modal-overlay" style={{ zIndex: 1000 }}>
          <div className="modal-content coach-modal-content">
            <div className="panel-header coach-form-header">
              <h3>{editCoachId ? 'Edit Coach Details' : 'Add New Coach'}</h3>
              <button className="btn-close-admin" onClick={() => { setIsFormOpen(false); resetForm(); }}>
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="coach-side-form">
              <div>
                <label>Select Coach (Registered User)*</label>
                <select
                  name="userId"
                  value={formData.userId}
                  onChange={handleCoachSelect}
                  required
                  className="coach-dropdown-select"
                  disabled={!!formData.userId && coachesList.some((coach) => coach.userId?._id === formData.userId)}
                >
                  <option value="">-- Choose Coach --</option>
                  {selectableCoaches.map((coach) => (
                    <option key={coach._id} value={coach._id}>{coach.firstName} {coach.lastName}</option>
                  ))}
                </select>
              </div>

              <div className="coach-form-row-2">
                <div>
                  <label>Photo (Required)*</label>
                  <input type="file" name="photo" accept="image/*" onChange={handleFileChange} />
                  {editCoachId && <small>Upload new to replace existing</small>}
                </div>
                <div>
                  <label>Status</label>
                  <select name="status" value={formData.status} onChange={handleChange} className="coach-dropdown-select">
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="coach-form-row-2">
                <div>
                  <label>Local Coaching Licence Number</label>
                  <input type="text" name="localLicenceNumber" value={formData.localLicenceNumber} onChange={handleChange} placeholder="e.g. SLWF-L-001" />
                </div>
                <div>
                  <label>Local Coaching Licence Photo</label>
                  <input type="file" name="localLicence" accept="image/*,.pdf" onChange={handleFileChange} />
                </div>
              </div>

              <div className="coach-form-row-2">
                <div>
                  <label>International Licence Number</label>
                  <input type="text" name="internationalLicenceNumber" value={formData.internationalLicenceNumber} onChange={handleChange} placeholder="e.g. IWF-C-001" />
                </div>
                <div>
                  <label>International Licence Photo</label>
                  <input type="file" name="internationalLicence" accept="image/*,.pdf" onChange={handleFileChange} />
                </div>
              </div>

              <div className="coach-location-section">
                <h4>Location Details</h4>
                <div className="coach-form-row-2">
                  <div>
                    <label>Province</label>
                    <select name="province" value={formData.province} onChange={handleChange} className="coach-dropdown-select">
                      <option value="">-- Select Province --</option>
                      {Object.keys(sriLankaLocations).map((province) => (
                        <option key={province} value={province}>{province}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label>District</label>
                    <select name="district" value={formData.district} onChange={handleChange} className="coach-dropdown-select" disabled={!formData.province}>
                      <option value="">-- Select District --</option>
                      {formData.province && sriLankaLocations[formData.province]?.map((district) => (
                        <option key={district} value={district}>{district}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="coach-form-row-2">
                  <div>
                    <label>Postal Code</label>
                    <input type="text" name="postalCode" value={formData.postalCode} onChange={handleChange} placeholder="e.g. 20000" />
                  </div>
                  <div>
                    <label>City*</label>
                    <input type="text" name="city" value={formData.city} onChange={handleChange} placeholder="e.g. Kandy" required />
                  </div>
                </div>

                <div className="coach-form-row-2">
                  <div>
                    <label>Address Line 1</label>
                    <input type="text" name="addressLine1" value={formData.addressLine1} onChange={handleChange} placeholder="e.g. No. 24" />
                  </div>
                  <div>
                    <label>Address Line 2</label>
                    <input type="text" name="addressLine2" value={formData.addressLine2} onChange={handleChange} placeholder="e.g. Temple Road" />
                  </div>
                </div>
              </div>

              <div className="coach-form-actions">
                <button type="button" className="btn-cancel" onClick={() => { setIsFormOpen(false); resetForm(); }}>Cancel</button>
                <button type="submit" className="btn-save"><FaSave /> {editCoachId ? 'Update' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="coach-table-panel full-width">
        <div className="panel-header">
          <h3>Coaches List (All Time)</h3>
        </div>
        <div className="coach-table-wrap">
          <table className="coach-table">
            <thead>
              <tr>
                <th>Photo</th>
                <th>Family Name</th>
                <th>Given Name</th>
                <th>Gender</th>
                <th>NIC</th>
                <th>Local Licence</th>
                <th>Local Licence No</th>
                <th>International Licence</th>
                <th>International Licence No</th>
                <th>Province</th>
                <th>City</th>
                <th>Athletes Under Coach</th>
                <th>Edit</th>
              </tr>
            </thead>
            <tbody>
              {filteredCoaches.length === 0 ? (
                <tr><td colSpan="13" className="coach-empty-cell">No coaches registered yet.</td></tr>
              ) : (
                filteredCoaches.map((coach) => (
                  <tr key={coach._id}>
                    <td>
                      {coach.photoUrl ? (
                        <img src={`http://localhost:5000${coach.photoUrl}`} alt="Coach" className="coach-photo" />
                      ) : (
                        <div className="coach-photo-placeholder">N/A</div>
                      )}
                    </td>
                    <td>{coach.userId?.lastName || 'N/A'}</td>
                    <td>{coach.userId?.firstName || 'N/A'}</td>
                    <td>
                      <span className={`coach-gender-badge ${getGenderInitial(coach.userId?.gender) === 'M' ? 'gender-m' : 'gender-f'}`}>
                        {getGenderInitial(coach.userId?.gender)}
                      </span>
                    </td>
                    <td>{coach.userId?.nic ? `***${coach.userId.nic.slice(-3)}` : 'N/A'}</td>
                    <td>
                      {coach.localLicenceUrl ? (
                        <a href={`http://localhost:5000${coach.localLicenceUrl}`} target="_blank" rel="noreferrer" className="coach-download-link">
                          <FaDownload /> View
                        </a>
                      ) : 'N/A'}
                    </td>
                    <td>{coach.localLicenceNumber || 'N/A'}</td>
                    <td>
                      {coach.internationalLicenceUrl ? (
                        <a href={`http://localhost:5000${coach.internationalLicenceUrl}`} target="_blank" rel="noreferrer" className="coach-download-link international">
                          <FaDownload /> View
                        </a>
                      ) : 'N/A'}
                    </td>
                    <td>{coach.internationalLicenceNumber || 'N/A'}</td>
                    <td>{coach.province || 'N/A'}</td>
                    <td className="coach-total">{coach.city || 'N/A'}</td>
                    <td>
                      {coach.assignedAthletes.length > 0 ? (
                        <div className="assigned-athletes-list">
                          {coach.assignedAthletes.map((athlete) => (
                            <span key={athlete._id}>{athlete.userId?.firstName || 'N/A'} {athlete.userId?.lastName || ''}</span>
                          ))}
                        </div>
                      ) : (
                        <span className="coach-muted">No athletes</span>
                      )}
                    </td>
                    <td>
                      <button className="coach-edit-btn" onClick={() => handleEdit(coach)}>
                        <FaEdit /> Edit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Coaches;
