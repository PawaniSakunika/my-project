import React, { useEffect, useState } from 'react';
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
import './Referees.css';

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
  gradeCategory: 'Grade III',
  province: '',
  district: '',
  postalCode: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  status: 'Active'
};

const Referees = () => {
  const [refereesList, setRefereesList] = useState([]);
  const [dropdownReferees, setDropdownReferees] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editRefereeId, setEditRefereeId] = useState(null);
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
    fetchReferees();
    fetchDropdownData();
  }, []);

  const fetchReferees = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/athletes/referees/all');
      setRefereesList(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching referee profiles:', error);
      setRefereesList([]);
    }
  };

  const fetchDropdownData = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/athletes/users/referees');
      const refereesData = response.data.data ? response.data.data : response.data;
      setDropdownReferees(Array.isArray(refereesData) ? refereesData : []);
    } catch (error) {
      console.error('Error fetching referees dropdown:', error);
      setDropdownReferees([]);
    }
  };

  const resetForm = () => {
    setEditRefereeId(null);
    setFormData(emptyForm);
    setFileData({ photo: null, localLicence: null, internationalLicence: null });
  };

  const handleOpenForm = () => {
    if (currentUser && (currentUser.role === 'Referee' || currentUser.role === 'Admin')) {
      resetForm();
      setIsFormOpen(true);
    } else {
      toast.error(<div>Access Denied! Only Referees can enter data.</div>);
    }
  };

  const handleRefereeSelect = (e) => {
    const selectedId = e.target.value;
    if (!selectedId) return;
    setFormData((prev) => ({ ...prev, userId: selectedId }));
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
    if (!editRefereeId && !fileData.photo) {
      toast.error('Photo is mandatory for new referees.');
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

      const response = editRefereeId
        ? await axios.put(`http://localhost:5000/api/athletes/referees/update/${editRefereeId}`, formPayload, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        : await axios.post('http://localhost:5000/api/athletes/referees/add', formPayload, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

      if (response.data.success) {
        toast.success(<div>{response.data.message}</div>);
        await fetchReferees();
        setIsFormOpen(false);
        resetForm();
      }
    } catch (error) {
      console.error('Error saving referee:', error);
      toast.error(<div>Something went wrong! Please try again.</div>);
    }
  };

  const handleEdit = (referee) => {
    if (currentUser && currentUser.role !== 'Referee' && currentUser.role !== 'Admin') {
      toast.error(<div>Access Denied! Only Referees can enter data.</div>);
      return;
    }

    setEditRefereeId(referee._id);
    setIsFormOpen(true);
    setFormData({
      userId: referee.userId?._id || '',
      localLicenceNumber: referee.localLicenceNumber || '',
      internationalLicenceNumber: referee.internationalLicenceNumber || '',
      gradeCategory: referee.gradeCategory || 'Grade III',
      province: referee.province || '',
      district: referee.district || '',
      postalCode: referee.postalCode || '',
      addressLine1: referee.addressLine1 || '',
      addressLine2: referee.addressLine2 || '',
      city: referee.city || '',
      status: referee.status || 'Active'
    });
    setFileData({ photo: null, localLicence: null, internationalLicence: null });
  };

  const registeredRefereeUserIds = new Set(
    refereesList.map((referee) => referee.userId?._id).filter(Boolean)
  );

  const selectableReferees = dropdownReferees.filter((referee) => (
    editRefereeId ||
    !registeredRefereeUserIds.has(referee._id) ||
    referee._id === formData.userId
  ));

  const getGenderInitial = (gender) => {
    if (!gender) return 'N/A';
    const firstLetter = gender.trim().toUpperCase().charAt(0);
    return firstLetter === 'M' || firstLetter === 'F' ? firstLetter : gender;
  };

  const filteredReferees = refereesList.filter((referee) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const fullName = `${referee.userId?.firstName || ''} ${referee.userId?.lastName || ''}`.toLowerCase();
    return (
      fullName.includes(term) ||
      (referee.userId?.nic || '').toLowerCase().includes(term) ||
      (referee.localLicenceNumber || '').toLowerCase().includes(term) ||
      (referee.internationalLicenceNumber || '').toLowerCase().includes(term) ||
      (referee.gradeCategory || '').toLowerCase().includes(term)
    );
  });

  return (
    <div className="referees-page-container">
      <div className="referees-header">
        <button className="add-referee-btn" onClick={handleOpenForm}>
          <FaPlus /> Add Referee
        </button>
        <div className="referee-search-box">
          <FaSearch className="referee-search-icon" />
          <input
            type="text"
            placeholder="Search Referee..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {isFormOpen && (
        <div className="modal-overlay referee-modal-overlay" style={{ zIndex: 1000 }}>
          <div className="modal-content referee-modal-content">
            <div className="panel-header referee-form-header">
              <h3>{editRefereeId ? 'Edit Referee Details' : 'Add New Referee'}</h3>
              <button className="btn-close-admin" onClick={() => { setIsFormOpen(false); resetForm(); }}>
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="referee-side-form">
              <div>
                <label>Select Referee (Registered User)*</label>
                <select
                  name="userId"
                  value={formData.userId}
                  onChange={handleRefereeSelect}
                  required
                  className="referee-dropdown-select"
                  disabled={!!formData.userId && refereesList.some((referee) => referee.userId?._id === formData.userId)}
                >
                  <option value="">-- Choose Referee --</option>
                  {selectableReferees.map((referee) => (
                    <option key={referee._id} value={referee._id}>{referee.firstName} {referee.lastName}</option>
                  ))}
                </select>
              </div>

              <div className="referee-form-row-2">
                <div>
                  <label>Photo (Required)*</label>
                  <input type="file" name="photo" accept="image/*" onChange={handleFileChange} />
                  {editRefereeId && <small>Upload new to replace existing</small>}
                </div>
                <div>
                  <label>Grade Category*</label>
                  <select name="gradeCategory" value={formData.gradeCategory} onChange={handleChange} className="referee-dropdown-select" required>
                    <option value="Grade I">Grade I</option>
                    <option value="Grade II">Grade II</option>
                    <option value="Grade III">Grade III</option>
                  </select>
                </div>
              </div>

              <div className="referee-form-row-2">
                <div>
                  <label>Local Referee Licence Number</label>
                  <input type="text" name="localLicenceNumber" value={formData.localLicenceNumber} onChange={handleChange} placeholder="e.g. SLWF-R-001" />
                </div>
                <div>
                  <label>Local Referee Licence Photo</label>
                  <input type="file" name="localLicence" accept="image/*,.pdf" onChange={handleFileChange} />
                </div>
              </div>

              <div className="referee-form-row-2">
                <div>
                  <label>International Referee Licence Number</label>
                  <input type="text" name="internationalLicenceNumber" value={formData.internationalLicenceNumber} onChange={handleChange} placeholder="e.g. IWF-R-001" />
                </div>
                <div>
                  <label>International Referee Licence Photo</label>
                  <input type="file" name="internationalLicence" accept="image/*,.pdf" onChange={handleFileChange} />
                </div>
              </div>

              <div className="referee-location-section">
                <h4>Location Details</h4>
                <div className="referee-form-row-2">
                  <div>
                    <label>Province</label>
                    <select name="province" value={formData.province} onChange={handleChange} className="referee-dropdown-select">
                      <option value="">-- Select Province --</option>
                      {Object.keys(sriLankaLocations).map((province) => (
                        <option key={province} value={province}>{province}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label>District</label>
                    <select name="district" value={formData.district} onChange={handleChange} className="referee-dropdown-select" disabled={!formData.province}>
                      <option value="">-- Select District --</option>
                      {formData.province && sriLankaLocations[formData.province]?.map((district) => (
                        <option key={district} value={district}>{district}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="referee-form-row-2">
                  <div>
                    <label>Postal Code</label>
                    <input type="text" name="postalCode" value={formData.postalCode} onChange={handleChange} placeholder="e.g. 20000" />
                  </div>
                  <div>
                    <label>City*</label>
                    <input type="text" name="city" value={formData.city} onChange={handleChange} placeholder="e.g. Kandy" required />
                  </div>
                </div>

                <div className="referee-form-row-2">
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

              <div className="referee-form-actions">
                <button type="button" className="btn-cancel" onClick={() => { setIsFormOpen(false); resetForm(); }}>Cancel</button>
                <button type="submit" className="btn-save"><FaSave /> {editRefereeId ? 'Update' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="referee-table-panel full-width">
        <div className="panel-header">
          <h3>Referee List (All Time)</h3>
        </div>
        <div className="referee-table-wrap">
          <table className="referee-table">
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
                <th>Grade Category</th>
                <th>Province</th>
                <th>City</th>
                <th>Edit</th>
              </tr>
            </thead>
            <tbody>
              {filteredReferees.length === 0 ? (
                <tr><td colSpan="13" className="referee-empty-cell">No referees registered yet.</td></tr>
              ) : (
                filteredReferees.map((referee) => (
                  <tr key={referee._id}>
                    <td>
                      {referee.photoUrl ? (
                        <img src={`http://localhost:5000${referee.photoUrl}`} alt="Referee" className="referee-photo" />
                      ) : (
                        <div className="referee-photo-placeholder">N/A</div>
                      )}
                    </td>
                    <td>{referee.userId?.lastName || 'N/A'}</td>
                    <td>{referee.userId?.firstName || 'N/A'}</td>
                    <td>
                      <span className={`referee-gender-badge ${getGenderInitial(referee.userId?.gender) === 'M' ? 'gender-m' : 'gender-f'}`}>
                        {getGenderInitial(referee.userId?.gender)}
                      </span>
                    </td>
                    <td>{referee.userId?.nic ? `***${referee.userId.nic.slice(-3)}` : 'N/A'}</td>
                    <td>
                      {referee.localLicenceUrl ? (
                        <a href={`http://localhost:5000${referee.localLicenceUrl}`} target="_blank" rel="noreferrer" className="referee-download-link">
                          <FaDownload /> View
                        </a>
                      ) : 'N/A'}
                    </td>
                    <td>{referee.localLicenceNumber || 'N/A'}</td>
                    <td>
                      {referee.internationalLicenceUrl ? (
                        <a href={`http://localhost:5000${referee.internationalLicenceUrl}`} target="_blank" rel="noreferrer" className="referee-download-link international">
                          <FaDownload /> View
                        </a>
                      ) : 'N/A'}
                    </td>
                    <td>{referee.internationalLicenceNumber || 'N/A'}</td>
                    <td><span className="referee-grade-badge">{referee.gradeCategory || 'Grade III'}</span></td>
                    <td>{referee.province || 'N/A'}</td>
                    <td className="referee-total">{referee.city || 'N/A'}</td>
                    <td>
                      <button className="referee-edit-btn" onClick={() => handleEdit(referee)}>
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

export default Referees;
