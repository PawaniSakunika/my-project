import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate, useParams } from 'react-router-dom';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import './CompetitionView.css';
import './Competitions.css'; // For modal styles

const CompetitionView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [competition, setCompetition] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRegistration, setEditingRegistration] = useState(null);
  
  const [editFormData, setEditFormData] = useState({
    entryTotal: '',
    isReserve: 'false'
  });

  useEffect(() => {
    fetchCompetitionDetails();
    fetchRegistrations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchCompetitionDetails = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/competitions');
      const comp = response.data.find(c => c._id === id);
      if (comp) setCompetition(comp);
    } catch (error) {
      toast.error('Error fetching competition details');
    }
  };

  const fetchRegistrations = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/registrations/${id}`);
      setRegistrations(response.data);
    } catch (error) {
      toast.error('Error fetching registrations');
    }
  };

  const handleEditClick = (reg) => {
    setEditingRegistration(reg);
    setEditFormData({
      entryTotal: reg.entryTotal,
      isReserve: reg.isReserve ? 'true' : 'false'
    });
    setIsEditModalOpen(true);
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData({ ...editFormData, [name]: value });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`http://localhost:5000/api/registrations/${editingRegistration._id}`, {
        entryTotal: Number(editFormData.entryTotal),
        isReserve: editFormData.isReserve === 'true'
      });
      toast.success('Registration updated successfully');
      setIsEditModalOpen(false);
      fetchRegistrations();
    } catch (error) {
      toast.error('Error updating registration');
    }
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text(`Registered Athletes - ${competition?.name}`, 14, 22);
    doc.setFontSize(11);
    doc.text(`Date: ${new Date(competition?.date).toLocaleDateString()} | Category: ${competition?.ageCategory}`, 14, 30);
    
    const tableColumn = ["Name", "Gender", "Weight Class", "Entry Total", "Status", "Coach", "Club"];
    const tableRows = [];

    registrations.forEach(reg => {
      const athleteData = [
        `${reg.athleteId?.userId?.firstName} ${reg.athleteId?.userId?.lastName}`,
        reg.athleteId?.userId?.gender || 'N/A',
        reg.athleteId?.weightClass || 'N/A',
        `${reg.entryTotal} kg`,
        reg.isReserve ? 'Reserve' : 'Main',
        reg.athleteId?.selectedCoach || 'N/A',
        reg.club
      ];
      tableRows.push(athleteData);
    });

    doc.autoTable(tableColumn, tableRows, { startY: 35 });
    doc.save(`${competition?.name}_registrations.pdf`);
  };

  const isDeadlinePassed = competition && new Date(competition.registrationDeadline) < new Date();

  if (!competition) return <div>Loading...</div>;

  return (
    <div className="view-container">
      <div className="view-header">
        <div>
          <button className="btn-back" onClick={() => navigate('/competitions')}>← Back</button>
          <h2>Registered Athletes - {competition.name}</h2>
        </div>
        <button className="btn-export" onClick={exportPDF}>Download PDF</button>
      </div>

      {isDeadlinePassed && (
        <div style={{ color: 'red', marginBottom: '15px' }}>
          <strong>Note: The registration deadline has passed. Edits are no longer allowed.</strong>
        </div>
      )}

      <table className="registrations-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Gender</th>
            <th>Weight Class</th>
            <th>Entry Total</th>
            <th>Status</th>
            <th>Coach</th>
            <th>Club</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {registrations.length === 0 ? (
            <tr><td colSpan="8" style={{ textAlign: 'center' }}>No athletes registered yet.</td></tr>
          ) : (
            registrations.map(reg => (
              <tr key={reg._id}>
                <td>{reg.athleteId?.userId?.firstName} {reg.athleteId?.userId?.lastName}</td>
                <td>{reg.athleteId?.userId?.gender || 'N/A'}</td>
                <td>{reg.athleteId?.weightClass || 'N/A'}</td>
                <td>{reg.entryTotal} kg</td>
                <td>
                  <span className={reg.isReserve ? 'badge-reserve' : 'badge-main'}>
                    {reg.isReserve ? 'Reserve' : 'Main'}
                  </span>
                </td>
                <td>{reg.athleteId?.selectedCoach || 'N/A'}</td>
                <td>{reg.club}</td>
                <td>
                  <button 
                    className="btn-edit" 
                    onClick={() => handleEditClick(reg)}
                    disabled={isDeadlinePassed}
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {isEditModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Edit Registration</h2>
            <form onSubmit={handleEditSubmit}>
              <div className="form-group">
                <label>Entry Total (kg)</label>
                <input type="number" name="entryTotal" value={editFormData.entryTotal} onChange={handleEditInputChange} required min="0" />
              </div>
              <div className="form-group">
                <label>Status</label>
                <select name="isReserve" value={editFormData.isReserve} onChange={handleEditInputChange}>
                  <option value="false">Main</option>
                  <option value="true">Reserve</option>
                </select>
              </div>
              
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setIsEditModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-submit">Update</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompetitionView;
