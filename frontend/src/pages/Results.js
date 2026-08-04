import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import './Results.css';

const Results = () => {
  const [results, setResults] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [user, setUser] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    competitionDate: '',
    location: ''
  });
  const [file, setFile] = useState(null);

  useEffect(() => {
    const loggedInUser = localStorage.getItem('user');
    if (loggedInUser) {
      setUser(JSON.parse(loggedInUser));
    }
    fetchResults();
  }, []);

  const fetchResults = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/results');
      setResults(response.data);
    } catch (error) {
      toast.error('Error fetching results. Is the backend server running with the latest code?');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const openAddModal = () => {
    setIsEditMode(false);
    setEditingId(null);
    setFormData({ name: '', competitionDate: '', location: '' });
    setFile(null);
    setIsModalOpen(true);
  };

  const openEditModal = (result) => {
    setIsEditMode(true);
    setEditingId(result._id);
    
    // Format date for the input type="date"
    const dateObj = new Date(result.competitionDate);
    const formattedDate = dateObj.toISOString().split('T')[0];

    setFormData({ 
      name: result.name, 
      competitionDate: formattedDate, 
      location: result.location 
    });
    setFile(null); // Leave empty unless they want to upload a new one
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isEditMode && !file) {
      toast.error('Please select a PDF file');
      return;
    }

    if (file && file.type !== 'application/pdf') {
      toast.error('Only PDF files are allowed');
      return;
    }

    const data = new FormData();
    data.append('name', formData.name);
    data.append('competitionDate', formData.competitionDate);
    data.append('location', formData.location);
    if (file) {
      data.append('resultPdf', file);
    }

    try {
      if (isEditMode) {
        await axios.put(`http://localhost:5000/api/results/${editingId}`, data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Result updated successfully');
      } else {
        await axios.post('http://localhost:5000/api/results', data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Result uploaded successfully');
      }
      
      setIsModalOpen(false);
      setFormData({ name: '', competitionDate: '', location: '' });
      setFile(null);
      fetchResults();
    } catch (error) {
      toast.error(isEditMode ? 'Error updating result' : 'Error uploading result');
    }
  };

  const canEdit = user?.role === 'Admin';

  return (
    <div className="results-container">
      <div className="results-header">
        <h2>Match Results</h2>
        {canEdit && (
          <button className="add-result-btn" onClick={openAddModal}>
            + Add Result
          </button>
        )}
      </div>

      <div className="results-list">
        {results.length === 0 ? (
          <p>No results found.</p>
        ) : (
          results.map((result) => (
            <div key={result._id} className="result-card">
              <div className="result-info">
                <h3>{result.name}</h3>
                <p><strong>Date:</strong> {new Date(result.competitionDate).toLocaleDateString()}</p>
                <p><strong>Location:</strong> {result.location}</p>
              </div>
              <div className="result-actions" style={{ display: 'flex', gap: '10px' }}>
                <a 
                  href={`http://localhost:5000${result.pdfFilePath}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn-download"
                  download
                >
                  Download PDF
                </a>
                {canEdit && (
                  <button 
                    style={{ backgroundColor: '#ff9800', color: 'white', padding: '8px 16px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    onClick={() => openEditModal(result)}
                  >
                    Edit
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>{isEditMode ? 'Edit Competition Result' : 'Add Competition Result'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Competition Name</label>
                <input type="text" name="name" value={formData.name} onChange={handleInputChange} required />
              </div>
              <div className="form-group">
                <label>Competition Date</label>
                <input type="date" name="competitionDate" value={formData.competitionDate} onChange={handleInputChange} required />
              </div>
              <div className="form-group">
                <label>Location</label>
                <input type="text" name="location" value={formData.location} onChange={handleInputChange} required />
              </div>
              <div className="form-group">
                <label>{isEditMode ? 'Update PDF Result (Optional)' : 'Upload PDF Result'}</label>
                <input type="file" accept="application/pdf" onChange={handleFileChange} required={!isEditMode} />
              </div>
              
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => { setIsModalOpen(false); setFile(null); }}>Cancel</button>
                <button type="submit" className="btn-submit">{isEditMode ? 'Update Result' : 'Upload Result'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Results;
