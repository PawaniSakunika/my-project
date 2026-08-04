import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate, useParams } from 'react-router-dom';
import './CompetitionRegister.css';
import './Competitions.css'; // Reusing modal styles

const CompetitionRegister = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [competition, setCompetition] = useState(null);
  const [athletes, setAthletes] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    athleteId: '',
    club: '',
    entryTotal: '',
    isReserve: 'false'
  });
  
  const [selectedAthleteDetails, setSelectedAthleteDetails] = useState(null);

  useEffect(() => {
    fetchCompetitionDetails();
    fetchAthletes();
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

  const fetchAthletes = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/athletes');
      setAthletes(response.data);
    } catch (error) {
      toast.error('Error fetching athletes');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    if (name === 'athleteId') {
      const selected = athletes.find(a => a._id === value);
      setSelectedAthleteDetails(selected);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.athleteId) {
      toast.error("Please select an athlete");
      return;
    }
    
    try {
      await axios.post('http://localhost:5000/api/registrations', {
        competitionId: id,
        athleteId: formData.athleteId,
        club: formData.club,
        entryTotal: Number(formData.entryTotal),
        isReserve: formData.isReserve === 'true'
      });
      toast.success('Athlete registered successfully');
      setIsModalOpen(false);
      setFormData({
        athleteId: '',
        club: '',
        entryTotal: '',
        isReserve: 'false'
      });
      setSelectedAthleteDetails(null);
    } catch (error) {
      if (error.response && error.response.data.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Error registering athlete');
      }
    }
  };

  if (!competition) return <div>Loading...</div>;

  return (
    <div className="register-container">
      <div className="register-header">
        <div>
          <button className="btn-back" onClick={() => navigate('/competitions')}>← Back</button>
          <h2>Register for {competition.name}</h2>
        </div>
        <button className="add-register-btn" onClick={() => setIsModalOpen(true)}>
          + Add Register
        </button>
      </div>

      <div className="registration-info">
        <p><strong>Registration Deadline:</strong> {new Date(competition.registrationDeadline).toLocaleString()}</p>
        <p><strong>Category:</strong> {competition.ageCategory} | <strong>Type:</strong> {competition.type}</p>
        <p><em>Note: A maximum of 10 athletes can be registered per club.</em></p>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Add Athlete to Competition</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Select Athlete</label>
                <select name="athleteId" value={formData.athleteId} onChange={handleInputChange} required>
                  <option value="">-- Select Athlete --</option>
                  {athletes.map(athlete => (
                    <option key={athlete._id} value={athlete._id}>
                      {athlete.userId?.firstName} {athlete.userId?.lastName} ({athlete.userId?.nic})
                    </option>
                  ))}
                </select>
              </div>

              {selectedAthleteDetails && (
                <div className="athlete-preview">
                  <p><strong>Name:</strong> {selectedAthleteDetails.userId?.firstName} {selectedAthleteDetails.userId?.lastName}</p>
                  <p><strong>Gender:</strong> {selectedAthleteDetails.userId?.gender}</p>
                  <p><strong>Weight Class:</strong> {selectedAthleteDetails.weightClass}</p>
                  <p><strong>Coach:</strong> {selectedAthleteDetails.selectedCoach}</p>
                </div>
              )}

              <div className="form-group">
                <label>Entry Total (kg)</label>
                <input type="number" name="entryTotal" value={formData.entryTotal} onChange={handleInputChange} required min="0" />
              </div>

              <div className="form-group">
                <label>Club Name</label>
                <input type="text" name="club" value={formData.club} onChange={handleInputChange} required placeholder="Enter club name" />
              </div>

              <div className="form-group">
                <label>Status</label>
                <select name="isReserve" value={formData.isReserve} onChange={handleInputChange}>
                  <option value="false">Main</option>
                  <option value="true">Reserve</option>
                </select>
              </div>
              
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-submit">Register Athlete</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompetitionRegister;
