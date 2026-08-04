import { Link, useNavigate } from 'react-router-dom';
import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import './Register.css';

const Register = () => {
  const navigate = useNavigate();
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', nic: '', passport: '', birthday: '',
    gender: 'Male', email: '', phone: '', address: '', username: '',
    password: '', confirmPassword: '', role: 'Athlete'
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast.error(
        <div>
          මුරපද ගැලපෙන්නේ නැත!<br />
          Passwords do not match!
        </div>
      );
      return;
    }
    try {
      const response = await axios.post('http://localhost:5000/api/auth/register', formData);
      toast.success(
        <div>
          ලියාපදිංචිය සාර්ථකයි!<br />
          {response.data.message || "Registration Successful!"}
        </div>
      );
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (error) {
      if (error.response && error.response.data && error.response.data.message) {
        toast.error(
          <div>
            දෝෂයක් මතු විය!<br />
            {error.response.data.message}
          </div>
        );
      } else {
        toast.error(
          <div>
            මොකක් හරි වැරැද්දක්!<br />
            Something went wrong!
          </div>
        );
      }
    }
  };

  return (
    <div className="register-container">
      <div className="register-box">
        <div className="register-header">
          <img src="/logo.png" alt="SLWF Logo" style={{ height: '65px', width: 'auto', marginBottom: '10px' }} />
          <h2>Create an Account</h2>
          <p>ශ්‍රී ලංකා බර ඉසිලීමේ සම්මේලන පද්ධතියට ලියාපදිංචි වන්න</p>
        </div>
        <form onSubmit={handleSubmit} className="register-form">
          <div className="form-row">
            <div className="input-group">
              <label>Family Name (වාසගම)</label>
              <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} placeholder="Nuwan" autoComplete="family-name" required />
            </div>
            <div className="input-group">
              <label>Given Name (මුල් නම)</label>
              <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} placeholder="Anuradha" autoComplete="given-name" required />
            </div>
          </div>
          <div className="form-row">
            <div className="input-group">
              <label>NIC Number</label>
              <input type="text" name="nic" value={formData.nic} onChange={handleChange} placeholder="e.g., 200012345678" required />
            </div>
            <div className="input-group">
              <label>Passport ID (Optional)</label>
              <input type="text" name="passport" value={formData.passport} onChange={handleChange} placeholder="e.g., N1234567" />
            </div>
          </div>
          <div className="form-row">
            <div className="input-group">
              <label>Date of Birth</label>
              <input type="date" name="birthday" value={formData.birthday} onChange={handleChange} required />
            </div>
            <div className="input-group">
              <label>Gender</label>
              <div style={{ display: 'flex', gap: '20px', marginTop: '10px' }}>
                <label><input type="radio" name="gender" value="Male" checked={formData.gender === 'Male'} onChange={handleChange} /> Male</label>
                <label><input type="radio" name="gender" value="Female" checked={formData.gender === 'Female'} onChange={handleChange} /> Female</label>
              </div>
            </div>
          </div>
          <div className="form-row">
            <div className="input-group">
              <label>Email Address</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="name@email.com" required />
            </div>
            <div className="input-group">
              <label>Phone Number</label>
              <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="07XXXXXXXX" required />
            </div>
          </div>
          <div className="input-group full-width">
            <label>Residential Address</label>
            <input type="text" name="address" value={formData.address} onChange={handleChange} placeholder="Enter your full address" required />
          </div>
          
          <div className="form-row">
            <div className="input-group">
              <label>Username</label>
              <input type="text" name="username" value={formData.username} onChange={handleChange} placeholder="Choose username" required />
            </div>
            
            <div className="input-group">
              <label>Password</label>
              <div className="password-wrapper">
                <input 
                  type={showPwd ? 'text' : 'password'} 
                  name="password" 
                  value={formData.password} 
                  onChange={handleChange} 
                  placeholder="Create password" 
                  required 
                />
                <span className="password-toggle-icon" onClick={() => setShowPwd(!showPwd)}>
                  {showPwd ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                  )}
                </span>
              </div>
            </div>
          </div>

          <div className="form-row">
            <div className="input-group">
              <label>Confirm Password</label>
              <div className="password-wrapper">
                <input 
                  type={showConfirmPwd ? 'text' : 'password'} 
                  name="confirmPassword" 
                  value={formData.confirmPassword} 
                  onChange={handleChange} 
                  placeholder="Re-enter password" 
                  required 
                />
                <span className="password-toggle-icon" onClick={() => setShowConfirmPwd(!showConfirmPwd)}>
                  {showConfirmPwd ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                  )}
                </span>
              </div>
            </div>

            <div className="input-group">
              <label>Select Your Primary Role</label>
              <select name="role" value={formData.role} onChange={handleChange} style={{ padding: '10px' }}>
                <option value="Athlete">Athlete</option>
                <option value="Coach">Coach</option>
                <option value="Referee">Referee</option>
                <option value="Admin">Admin</option>
              </select>
            </div>
          </div>
          <button type="submit" className="register-button">Register</button>
        </form>
        <div className="register-footer">
          <p>Already have an account? <Link to="/login">Log In Here</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Register;
