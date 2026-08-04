import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Admin.css';
import { toast } from 'react-toastify';


const Admin = () => {
    const [pendingUsers, setPendingUsers] = useState([]);
    const [showModal, setShowModal] = useState(false);
    
    // Admin Details
    const [newAdmin, setNewAdmin] = useState({ 
        firstName: '', lastName: '', nic: '', passport: '', birthday: '', 
        gender: 'Male', email: '', phone: '', address: '', username: '', password: '' 
    });

    // Password Confirm සහ Show/Hide සඳහා අලුත් States
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    useEffect(() => {
        fetchPendingUsers();
    }, []);

    const fetchPendingUsers = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/admin/pending-users', { 
                headers: { Authorization: `Bearer ${token}` } 
            });
            setPendingUsers(res.data);
        } catch (err) {
            console.error("Error fetching pending users:", err);
        }
    };

    const handleAddAdmin = async () => {
        // Password සහ Confirm Password එක සමානදැයි බැලීම
        if (newAdmin.password !== confirmPassword) {
            toast.error(
                <div>
                    මුරපද ගැලපෙන්නේ නැත! කරුණාකර නැවත පරීක්ෂා කරන්න.<br />
                    Passwords do not match! Please check again.
                </div>
            );
            return;
        }

        try {
            await axios.post('http://localhost:5000/api/admin/add-admin', newAdmin);
            toast.success(
                <div>
                    නව පරිපාලක සාර්ථකව එකතු කරන ලදි!<br />
                    Admin Added Successfully!
                </div>
            );
            closeModal();
            fetchPendingUsers();
        } catch (err) { 
            toast.error(
                <div>
                    පරිපාලක එකතු කිරීමේ දෝෂයක්!<br />
                    Error adding admin: {err.response?.data?.error || err.message}
                </div>
            ); 
        }
    };

    // Modal එක Close කරද්දී Data හිස් කිරීම
    const closeModal = () => {
        setShowModal(false);
        setNewAdmin({
            firstName: '', lastName: '', nic: '', passport: '', birthday: '', 
            gender: 'Male', email: '', phone: '', address: '', username: '', password: ''
        });
        setConfirmPassword('');
        setShowPassword(false);
        setShowConfirmPassword(false);
    };

    // Eye Icons (SVG)
    const EyeIcon = () => (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
        </svg>
    );

    const EyeOffIcon = () => (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
            <line x1="1" y1="1" x2="23" y2="23"></line>
        </svg>
    );

    // ... (අනෙක් handleApprove, handleReject function මෙතන ඒ විදිහටම තියෙනවා)
    const handleApprove = async (id) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(`http://localhost:5000/api/admin/approve/${id}`, {}, { headers: { Authorization: `Bearer ${token}` } });
            toast.success(
                <div>
                    පරිශීලක සාර්ථකව අනුමත කරන ලදි!<br />
                    User Approved Successfully!
                </div>
            );
            fetchPendingUsers();
        } catch (err) { 
            toast.error(
                <div>
                    පරිශීලක අනුමත කිරීමේ දෝෂයක්!<br />
                    Error approving user: {err.response?.data?.error || err.message}
                </div>
            ); 
        }
    };

    const handleReject = async (id) => {
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`http://localhost:5000/api/admin/reject/${id}`, { headers: { Authorization: `Bearer ${token}` } });
            toast.success(
                <div>
                    පරිශීලක ප්‍රතික්ෂේප කර ඉවත් කරන ලදි!<br />
                    User Rejected and Removed!
                </div>
            );
            fetchPendingUsers();
        } catch (err) { 
            toast.error(
                <div>
                    පරිශීලක ප්‍රතික්ෂේප කිරීමේ දෝෂයක්!<br />
                    Error rejecting user: {err.response?.data?.error || err.message}
                </div>
            ); 
        }
    };

    return (
        <div className="admin-container">
            <h1>Admin Settings</h1>
            <button className="btn-add" onClick={() => setShowModal(true)}>+ Add New Admin</button>

            <table className="admin-table">
                {/* ... (Table එක කලින් විදිහටමයි) ... */}
                <thead>
                    <tr>
                        <th>Name</th><th>Username</th><th>Role</th><th>NIC</th><th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {pendingUsers.length === 0 ? (
                        <tr><td colSpan="5" style={{ textAlign: 'center', padding: '15px' }}>No pending approvals found</td></tr>
                    ) : (
                        pendingUsers.map((user) => (
                            <tr key={user._id}>
                                <td>{user.firstName} {user.lastName}</td><td>{user.username}</td><td>{user.role}</td><td>{user.nic}</td>
                                <td>
                                    <button className="btn-approve" onClick={() => handleApprove(user._id)}>Approve</button>
                                    <button className="btn-reject" onClick={() => handleReject(user._id)}>Reject</button>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content large-modal">
                        <h3>Add New Admin</h3>
                        <div className="form-grid">
                            <div className="form-group"><label>First Name</label><input type="text" placeholder="e.g., Anuradha" value={newAdmin.firstName} onChange={e => setNewAdmin({...newAdmin, firstName: e.target.value})} /></div>
                            <div className="form-group"><label>Last Name</label><input type="text" placeholder="e.g., Nuwan" value={newAdmin.lastName} onChange={e => setNewAdmin({...newAdmin, lastName: e.target.value})} /></div>
                            <div className="form-group"><label>NIC Number</label><input type="text" placeholder="e.g., 200012345678" value={newAdmin.nic} onChange={e => setNewAdmin({...newAdmin, nic: e.target.value})} /></div>
                            <div className="form-group"><label>Passport ID</label><input type="text" placeholder="e.g., N1234567" value={newAdmin.passport} onChange={e => setNewAdmin({...newAdmin, passport: e.target.value})} /></div>
                            <div className="form-group"><label>Date of Birth</label><input type="date" value={newAdmin.birthday} onChange={e => setNewAdmin({...newAdmin, birthday: e.target.value})} /></div>
                            
                            <div className="form-group">
                                <label>Gender</label>
                                <div className="radio-group">
                                    <label><input type="radio" name="gender" value="Male" checked={newAdmin.gender === 'Male'} onChange={e => setNewAdmin({...newAdmin, gender: e.target.value})} /> Male</label>
                                    <label><input type="radio" name="gender" value="Female" checked={newAdmin.gender === 'Female'} onChange={e => setNewAdmin({...newAdmin, gender: e.target.value})} /> Female</label>
                                </div>
                            </div>

                            <div className="form-group"><label>Email Address</label><input type="email" placeholder="name@email.com" value={newAdmin.email} onChange={e => setNewAdmin({...newAdmin, email: e.target.value})} /></div>
                            <div className="form-group"><label>Phone Number</label><input type="text" placeholder="07XXXXXXXX" value={newAdmin.phone} onChange={e => setNewAdmin({...newAdmin, phone: e.target.value})} /></div>
                            
                            <div className="form-group full-width"><label>Residential Address</label><input type="text" placeholder="Enter your full address" value={newAdmin.address} onChange={e => setNewAdmin({...newAdmin, address: e.target.value})} /></div>
                            <div className="form-group full-width"><label>Username</label><input type="text" placeholder="Choose username" value={newAdmin.username} onChange={e => setNewAdmin({...newAdmin, username: e.target.value})} /></div>

                            {/* අලුත් Password Fields දෙක */}
                            <div className="form-group">
                                <label>Password</label>
                                <div className="password-input-wrapper">
                                    <input 
                                        type={showPassword ? "text" : "password"} 
                                        placeholder="Create password" 
                                        value={newAdmin.password} 
                                        onChange={e => setNewAdmin({...newAdmin, password: e.target.value})} 
                                    />
                                    <span className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                                        {showPassword ? <EyeIcon /> : <EyeOffIcon />}
                                    </span>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Confirm Password</label>
                                <div className="password-input-wrapper">
                                    <input 
                                        type={showConfirmPassword ? "text" : "password"} 
                                        placeholder="Re-enter password" 
                                        value={confirmPassword} 
                                        onChange={e => setConfirmPassword(e.target.value)} 
                                    />
                                    <span className="password-toggle" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                                        {showConfirmPassword ? <EyeIcon /> : <EyeOffIcon />}
                                    </span>
                                </div>
                            </div>

                        </div>
                        <div className="modal-actions">
                            <button className="btn-save-admin" onClick={handleAddAdmin}>Register Admin</button>
                            <button className="btn-close-admin" onClick={closeModal}>Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Admin;