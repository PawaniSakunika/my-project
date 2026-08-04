import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaPlus, FaSearch, FaTimes, FaEdit, FaSave, FaHistory, FaDownload } from 'react-icons/fa';
import './Athletes.css';
import { toast } from 'react-toastify';

const sriLankaLocations = {
  "Central": ["Kandy", "Matale", "Nuwara Eliya"],
  "Eastern": ["Ampara", "Batticaloa", "Trincomalee"],
  "North Central": ["Anuradhapura", "Polonnaruwa"],
  "Northern": ["Jaffna", "Kilinochchi", "Mannar", "Mullaitivu", "Vavuniya"],
  "North Western": ["Kurunegala", "Puttalam"],
  "Sabaragamuwa": ["Kegalle", "Ratnapura"],
  "Southern": ["Galle", "Hambantota", "Matara"],
  "Uva": ["Badulla", "Monaragala"],
  "Western": ["Colombo", "Gampaha", "Kalutara"]
};

const Athletes = () => {
  const [athletesList, setAthletesList] = useState([]);
  const [dropdownAthletes, setDropdownAthletes] = useState([]); 
  const [dropdownCoaches, setDropdownCoaches] = useState([]);   
  const [searchTerm, setSearchTerm] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false); 

  const [editAthleteId, setEditAthleteId] = useState(null);
  const [historyModalAthlete, setHistoryModalAthlete] = useState(null);

  const [formData, setFormData] = useState({
    userId: '', weightClass: '', bestSnatch: '', bestCleanAndJerk: '',
    bestTotal: 0, selectedCoach: '', awards: '', birthday: '',
    nic: '', passport: '', phone: '', email: '', gender: '',
    province: '', district: '', postalCode: '',
    addressLine1: '', addressLine2: '', city: ''
  });

  const [fileData, setFileData] = useState({
    photo: null,
    passport: null
  });

  useEffect(() => {
    const loggedUser = localStorage.getItem('user');
    if (loggedUser) {
      setCurrentUser(JSON.parse(loggedUser));
    }
    fetchAthletes();
    fetchDropdownData();
  }, []);

  const fetchAthletes = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/athletes/all');
      if (Array.isArray(response.data)) {
        setAthletesList(response.data);
      } else {
        setAthletesList([]);
      }
    } catch (error) {
      console.error("Error fetching table data", error);
      setAthletesList([]); 
    }
  };

  const fetchDropdownData = async () => {
    try {
      const athRes = await axios.get('http://localhost:5000/api/athletes/users/athletes');
      const athletesData = athRes.data.data ? athRes.data.data : athRes.data;
      setDropdownAthletes(Array.isArray(athletesData) ? athletesData : []);

      const coachRes = await axios.get('http://localhost:5000/api/athletes/users/coaches');
      const coachesData = coachRes.data.data ? coachRes.data.data : coachRes.data;
      setDropdownCoaches(Array.isArray(coachesData) ? coachesData : []);
    } catch (error) {
      console.error("Error fetching dropdowns:", error);
    }
  };

  useEffect(() => {
    const snatch = parseFloat(formData.bestSnatch) || 0;
    const cj = parseFloat(formData.bestCleanAndJerk) || 0;
    setFormData(prev => ({ ...prev, bestTotal: snatch + cj }));
  }, [formData.bestSnatch, formData.bestCleanAndJerk]);

  const handleOpenForm = () => {
    if (currentUser && (currentUser.role === 'Coach' || currentUser.role === 'Admin')) {
      resetForm();
      setIsFormOpen(true);
    } else {
      toast.error(<div>Access Denied! Only Coaches or Admins can enter data.</div>);
    }
  };

  const handleAthleteSelect = (e) => {
    const selectedId = e.target.value;
    if (!selectedId) return;

    const selectedUser = dropdownAthletes.find(u => u._id === selectedId);
    if (selectedUser) {
      setFormData({
        ...formData,
        userId: selectedId,
        gender: selectedUser.gender || '',
        birthday: selectedUser.birthday ? selectedUser.birthday.substring(0, 10) : '',
        nic: selectedUser.nic || '',
        passport: selectedUser.passport || '',
        phone: selectedUser.phone || '',
        email: selectedUser.email || '',
        province: selectedUser.province || '',
        district: selectedUser.district || '',
        postalCode: selectedUser.postalCode || ''
      });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "province") {
      setFormData(prev => ({ ...prev, province: value, district: '' }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    setFileData(prev => ({ ...prev, [name]: files[0] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!editAthleteId && !fileData.photo) {
      toast.error("Photo is mandatory for new athletes.");
      return;
    }

    try {
      const formPayload = new FormData();
      Object.keys(formData).forEach(key => {
        formPayload.append(key, formData[key]);
      });
      
      if (fileData.photo) formPayload.append('photo', fileData.photo);
      if (fileData.passport) formPayload.append('passport', fileData.passport);

      let response;
      if (editAthleteId) {
        response = await axios.put(`http://localhost:5000/api/athletes/update/${editAthleteId}`, formPayload, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        response = await axios.post('http://localhost:5000/api/athletes/add', formPayload, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      if (response.data.success) {
        toast.success(<div>{response.data.message}</div>);
        fetchAthletes();
        setIsFormOpen(false);
        resetForm();
      }
    } catch (error) {
      console.error("Error saving data", error);
      toast.error(<div>Something went wrong! Please try again.</div>);
    }
  };

  const resetForm = () => {
    setEditAthleteId(null);
    setFormData({
      userId: '', weightClass: '', bestSnatch: '', bestCleanAndJerk: '',
      bestTotal: 0, selectedCoach: '', awards: '', birthday: '',
      nic: '', passport: '', phone: '', email: '', gender: '',
      province: '', district: '', postalCode: '',
      addressLine1: '', addressLine2: '', city: ''
    });
    setFileData({ photo: null, passport: null });
  };

  const handleEdit = (athlete) => {
    if (currentUser && currentUser.role !== 'Coach' && currentUser.role !== 'Admin') {
      toast.error(<div>Access Denied!</div>);
      return;
    }
    
    setEditAthleteId(athlete._id);
    setIsFormOpen(true);
    
    setFormData({
      userId: athlete.userId?._id || '',
      weightClass: athlete.weightClass,
      bestSnatch: athlete.bestSnatch,
      bestCleanAndJerk: athlete.bestCleanAndJerk,
      bestTotal: athlete.bestTotal,
      selectedCoach: athlete.selectedCoach,
      awards: athlete.awards || '',
      gender: athlete.userId?.gender || '',
      birthday: athlete.userId?.birthday?.substring(0, 10) || '',
      nic: athlete.userId?.nic || '',
      passport: athlete.userId?.passport || '',
      phone: athlete.userId?.phone || '',
      email: athlete.userId?.email || '',
      province: athlete.province || athlete.userId?.province || '',
      district: athlete.district || athlete.userId?.district || '',
      postalCode: athlete.postalCode || athlete.userId?.postalCode || '',
      addressLine1: athlete.addressLine1 || '', 
      addressLine2: athlete.addressLine2 || '', 
      city: athlete.city || ''
    });
    setFileData({ photo: null, passport: null });
  };

  const getGenderInitial = (gender) => {
    if (!gender) return 'N/A';
    const firstLetter = gender.trim().toUpperCase().charAt(0);
    return firstLetter === 'M' || firstLetter === 'F' ? firstLetter : gender;
  };

  const registeredAthleteUserIds = new Set(
    athletesList.map(athlete => athlete.userId?._id).filter(Boolean)
  );

  const selectableAthletes = dropdownAthletes.filter(athlete => (
    editAthleteId ||
    !registeredAthleteUserIds.has(athlete._id) ||
    athlete._id === formData.userId
  ));

  return (
    <div className="athletes-page-container">
      <div className="athletes-header">
        <button className="add-athlete-btn" onClick={handleOpenForm}>
          <FaPlus /> Add Athlete
        </button>
        <div className="search-box-container">
          <FaSearch className="search-icon" />
          <input 
            type="text" 
            placeholder="Search Athlete..." 
            className="athlete-search"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="athletes-main-layout">
        
        {/* ADD ATHLETE MODAL */}
        {isFormOpen && (
          <div className="modal-overlay" style={{ zIndex: 1000 }}>
            <div className="modal-content" style={{ width: '800px', maxHeight: '90vh', overflowY: 'auto' }}>
              <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <h3>{editAthleteId ? 'Edit Athlete Details' : 'Add New Athlete'}</h3>
                <button className="btn-close-admin" onClick={() => { setIsFormOpen(false); resetForm(); }}>
                  <FaTimes />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="athlete-side-form" style={{ padding: '0 10px' }}>
                <div style={{ marginBottom: '15px' }}>
                  <label>Select Athlete (Registered User)*</label>
                  <select name="userId" value={formData.userId} onChange={handleAthleteSelect} required className="form-dropdown-select" disabled={!!formData.userId && athletesList.some(a => a.userId?._id === formData.userId)}>
                    <option value="">-- Choose Athlete --</option>
                    {selectableAthletes.map(ath => (
                      <option key={ath._id} value={ath._id}>{ath.firstName} {ath.lastName}</option>
                    ))}
                  </select>
                </div>

                <div className="form-row-2">
                  <div>
                    <label>Weight Class (Type)*</label>
                    <input type="text" name="weightClass" value={formData.weightClass} onChange={handleChange} placeholder="e.g. 61kg" required style={{ width: '100%', padding: '8px' }} />
                  </div>
                  <div>
                    <label>Select Coach*</label>
                    <select name="selectedCoach" value={formData.selectedCoach} onChange={handleChange} required className="form-dropdown-select">
                      <option value="">-- Choose Coach --</option>
                      {dropdownCoaches.map(c => (
                        <option key={c._id} value={`${c.firstName} ${c.lastName}`}>{c.firstName} {c.lastName}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-row-2" style={{ marginTop: '15px' }}>
                  <div>
                    <label>Photo (Required)*</label>
                    <input type="file" name="photo" accept="image/*" onChange={handleFileChange} style={{ width: '100%' }} />
                    {editAthleteId && <small style={{color:'green'}}>Upload new to replace existing</small>}
                  </div>
                  <div>
                    <label>Passport Copy (Optional)</label>
                    <input type="file" name="passport" accept=".pdf,image/*" onChange={handleFileChange} style={{ width: '100%' }} />
                  </div>
                </div>

                <div className="form-grid-3" style={{ marginTop: '15px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
                  <div>
                    <label>Best Snatch (kg)*</label>
                    <input type="number" name="bestSnatch" value={formData.bestSnatch} onChange={handleChange} required style={{ width: '100%', padding: '8px' }} />
                  </div>
                  <div>
                    <label>Best C&J (kg)*</label>
                    <input type="number" name="bestCleanAndJerk" value={formData.bestCleanAndJerk} onChange={handleChange} required style={{ width: '100%', padding: '8px' }} />
                  </div>
                  <div>
                    <label>Total (kg)</label>
                    <input type="number" value={formData.bestTotal} readOnly className="readonly-input" style={{ width: '100%', padding: '8px', backgroundColor: '#f1f5f9' }} />
                  </div>
                </div>

                <div style={{ marginTop: '15px' }}>
                  <label>Awards</label>
                  <textarea name="awards" value={formData.awards} onChange={handleChange} placeholder="Awards details..." style={{ width: '100%', padding: '8px', minHeight: '60px' }}></textarea>
                </div>

                {/* LOCATION SELECT SECTION */}
                <div className="location-section" style={{ marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '15px' }}>
                  <h4>Location Details</h4>
                  <div className="form-row-2">
                    <div>
                      <label>Province</label>
                      <select name="province" value={formData.province} onChange={handleChange} className="form-dropdown-select">
                        <option value="">-- Select Province --</option>
                        {Object.keys(sriLankaLocations).map(prov => (
                          <option key={prov} value={prov}>{prov}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label>District</label>
                      <select name="district" value={formData.district} onChange={handleChange} className="form-dropdown-select" disabled={!formData.province}>
                        <option value="">-- Select District --</option>
                        {formData.province && sriLankaLocations[formData.province]?.map(dist => (
                          <option key={dist} value={dist}>{dist}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div style={{ marginTop: '15px' }}>
                    <label style={{ display: 'block' }}>Postal Code</label>
                    <input type="text" name="postalCode" value={formData.postalCode} onChange={handleChange} placeholder="e.g. 20000" style={{ width: '100%', padding: '8px' }} />
                  </div>
                  
                  {/* ADDRESS DETAILS */}
                  <div className="address-section" style={{ marginTop: '15px' }}>
                    <div className="form-row-2">
                      <div>
                        <label>Address Line 1</label>
                        <input type="text" name="addressLine1" value={formData.addressLine1} onChange={handleChange} placeholder="e.g. No. 24" style={{ width: '100%', padding: '8px' }} />
                      </div>
                      <div>
                        <label>Address Line 2</label>
                        <input type="text" name="addressLine2" value={formData.addressLine2} onChange={handleChange} placeholder="e.g. Temple Road" style={{ width: '100%', padding: '8px' }} />
                      </div>
                    </div>
                    <div style={{ marginTop: '10px' }}>
                      <label>City (නගරය)*</label>
                      <input type="text" name="city" value={formData.city} onChange={handleChange} placeholder="e.g. Kandy" required style={{ width: '100%', padding: '8px' }} />
                    </div>
                  </div>
                </div>

                <div className="form-actions-footer" style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '15px' }}>
                  <button type="button" className="btn-cancel" onClick={() => { setIsFormOpen(false); resetForm(); }} style={{ padding: '10px 20px', borderRadius: '5px' }}>Cancel</button>
                  <button type="submit" className="btn-save" style={{ padding: '10px 20px', borderRadius: '5px', backgroundColor: '#2563eb', color: 'white', border: 'none' }}><FaSave /> {editAthleteId ? 'Update' : 'Save'}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* RIGHT PANEL: TABLE SECTION */}
        <div className="athlete-table-panel full-width">
          <div className="panel-header">
            <h3>Athletes List (All Time)</h3>
          </div>
          <div className="table-responsive">
            <table className="athlete-table">
              <thead>
                <tr>
                  <th>Photo</th>
                  <th>Family Name</th>
                  <th>Given Name</th>
                  <th>Gender</th>
                  <th>Weight Class</th>
                  <th>Best Snatch</th>
                  <th>Best C&J</th>
                  <th>Total</th>
                  <th>Coach</th>
                  <th>NIC</th>
                  <th>Province</th>
                  <th>City</th>
                  {currentUser?.role === 'Admin' && <th>Downloads</th>}
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {athletesList.length === 0 ? (
                  <tr>
                    <td colSpan="14" className="no-data">No athletes registered yet.</td>
                  </tr>
                ) : (
                  athletesList
                    .filter(val => {
                      if (!val) return false;
                      if (searchTerm === "") return true;
                      const firstName = val.userId?.firstName || '';
                      const lastName = val.userId?.lastName || '';
                      const fullName = `${firstName} ${lastName}`.toLowerCase();
                      return fullName.includes(searchTerm.toLowerCase());
                    })
                    .map((athlete) => (
                      <tr key={athlete._id}>
                        <td>
                          {athlete.photoUrl ? (
                            <img src={`http://localhost:5000${athlete.photoUrl}`} alt="Athlete" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #e2e8f0' }} />
                          ) : (
                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>N/A</div>
                          )}
                        </td>
                        <td>{athlete.userId?.lastName || 'N/A'}</td>
                        <td>{athlete.userId?.firstName || 'N/A'}</td>
                        <td>
                          <span className={`badge-gender ${getGenderInitial(athlete.userId?.gender) === 'M' ? 'gender-m' : 'gender-f'}`}>
                            {getGenderInitial(athlete.userId?.gender)}
                          </span>
                        </td>
                        <td>
                          <span 
                            className="badge-weight" 
                            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
                            onClick={() => setHistoryModalAthlete(athlete)}
                            title="Click to view history"
                          >
                            {athlete.weightClass} <FaHistory size={10} color="#64748b" />
                          </span>
                        </td>
                        <td>{athlete.bestSnatch} kg</td>
                        <td>{athlete.bestCleanAndJerk} kg</td>
                        <td className="txt-bold">{athlete.bestTotal} kg</td>
                        <td>{athlete.selectedCoach}</td>
                        <td>{athlete.userId?.nic ? `***${athlete.userId.nic.slice(-3)}` : 'N/A'}</td>
                        <td>{athlete.province || 'N/A'}</td>
                        <td className="txt-bold">{athlete.city || 'N/A'}</td>
                        {currentUser?.role === 'Admin' && (
                          <td style={{ display: 'flex', gap: '8px', alignItems: 'center', height: '100%', minHeight: '50px' }}>
                            {athlete.photoUrl && (
                              <a href={`http://localhost:5000${athlete.photoUrl}`} target="_blank" rel="noreferrer" className="btn-approve" style={{ padding: '4px 8px', fontSize: '11px', textDecoration: 'none' }} title="Download Photo">
                                <FaDownload /> Photo
                              </a>
                            )}
                            {athlete.passportUrl && (
                              <a href={`http://localhost:5000${athlete.passportUrl}`} target="_blank" rel="noreferrer" className="btn-approve" style={{ padding: '4px 8px', fontSize: '11px', textDecoration: 'none', backgroundColor: '#6366f1' }} title="Download Passport">
                                <FaDownload /> Doc
                              </a>
                            )}
                          </td>
                        )}
                        <td>
                          <button className="table-edit-btn" onClick={() => handleEdit(athlete)}>
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

      {/* WEIGHT HISTORY MODAL */}
      {historyModalAthlete && (
        <div className="modal-overlay" style={{ zIndex: 2000 }}>
          <div className="modal-content" style={{ width: '350px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3 style={{ margin: 0 }}>Weight History</h3>
              <button className="btn-close-admin" onClick={() => setHistoryModalAthlete(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <FaTimes />
              </button>
            </div>
            <p style={{ margin: '0 0 15px 0', color: '#64748b' }}>
              Athlete: {historyModalAthlete.userId?.firstName} {historyModalAthlete.userId?.lastName}
            </p>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #e2e8f0', color: '#1e293b' }}>Year</th>
                  <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #e2e8f0', color: '#1e293b' }}>Weight Class</th>
                </tr>
              </thead>
              <tbody>
                {historyModalAthlete.weightHistory && historyModalAthlete.weightHistory.length > 0 ? (
                  historyModalAthlete.weightHistory.map((h, i) => (
                    <tr key={i}>
                      <td style={{ padding: '8px', borderBottom: '1px solid #f1f5f9', color: '#475569' }}>{h.year}</td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #f1f5f9', color: '#2563eb', fontWeight: 'bold' }}>{h.weightClass}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="2" style={{ padding: '15px', textAlign: 'center', color: '#94a3b8' }}>No history found.</td>
                  </tr>
                )}
              </tbody>
            </table>
            <button className="btn-close-admin" onClick={() => setHistoryModalAthlete(null)} style={{ marginTop: '20px', width: '100%', padding: '10px', borderRadius: '5px' }}>Close</button>
          </div>
        </div>
      )}

    </div>
  );
};

export default Athletes;
