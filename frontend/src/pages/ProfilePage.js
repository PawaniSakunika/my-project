import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import './ProfilePage.css';

const ProfilePage = ({ user: propUser, setUser: setPropUser }) => {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [localUser, setLocalUser] = useState(null);

  const [userInfo, setUserInfo] = useState({});
  const [showSettings, setShowSettings] = useState(false);
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [newUsername, setNewUsername] = useState('');
  const [showAddSecondary, setShowAddSecondary] = useState(false);
  const [secondaryType, setSecondaryType] = useState('');
  const [switchLoading, setSwitchLoading] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      const parsed = JSON.parse(stored);
      setLocalUser(parsed);
      fetchProfile(parsed.id || parsed._id);
    }
  }, []);

  const getUserId = () => {
    const u = localUser || propUser;
    return u ? (u.id || u._id) : null;
  };

  const fetchProfile = async (userId) => {
    try {
      setLoading(true);
      const res = await axios.get(`http://localhost:5000/api/profile/${userId}`);
      setProfileData(res.data);
      setUserInfo({
        firstName: res.data.user.firstName || '',
        lastName:  res.data.user.lastName  || '',
        email:     res.data.user.email     || '',
        phone:     res.data.user.phone     || '',
        address:   res.data.user.address   || '',
      });
      setNewUsername(res.data.user.username || '');
    } catch (err) {
      toast.error('Error loading profile');
    } finally {
      setLoading(false);
    }
  };

  /* ---- SWITCH ROLE ---- */
  const handleSwitchRole = async (targetRole) => {
    if (switchLoading) return;
    const userId = getUserId();
    if (!userId) { toast.error('User not found'); return; }

    setSwitchLoading(true);
    try {
      const res = await axios.put(
        `http://localhost:5000/api/profile/${userId}/switch-role`,
        { newRole: targetRole }
      );

      // update localStorage
      const stored = JSON.parse(localStorage.getItem('user') || '{}');
      const updated = { ...stored, role: res.data.user.role };
      localStorage.setItem('user', JSON.stringify(updated));
      setLocalUser(updated);
      if (setPropUser) setPropUser(updated);

      toast.success(`✅ Active role switched to ${targetRole}!`);
      fetchProfile(userId);   // reload profile to refresh badges
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error switching role');
    } finally {
      setSwitchLoading(false);
    }
  };

  /* ---- SAVE USER INFO ---- */
  const handleSaveUserInfo = async () => {
    const userId = getUserId();
    try {
      const res = await axios.put(`http://localhost:5000/api/profile/${userId}/user-info`, userInfo);
      const stored = JSON.parse(localStorage.getItem('user') || '{}');
      const updated = { ...stored, firstName: res.data.firstName };
      localStorage.setItem('user', JSON.stringify(updated));
      setLocalUser(updated);
      if (setPropUser) setPropUser(updated);
      toast.success('Profile updated successfully');
    } catch {
      toast.error('Error updating profile');
    }
  };

  /* ---- CHANGE PASSWORD ---- */
  const handleChangePassword = async () => {
    if (passwords.newPassword !== passwords.confirmPassword) { toast.error('Passwords do not match'); return; }
    if (passwords.newPassword.length < 6) { toast.error('Minimum 6 characters'); return; }
    try {
      await axios.put(`http://localhost:5000/api/profile/${getUserId()}/change-password`, {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });
      toast.success('Password changed successfully');
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error changing password');
    }
  };

  /* ---- CHANGE USERNAME ---- */
  const handleChangeUsername = async () => {
    if (!newUsername.trim()) { toast.error('Username cannot be empty'); return; }
    try {
      await axios.put(`http://localhost:5000/api/profile/${getUserId()}/change-username`, { newUsername });
      const stored = JSON.parse(localStorage.getItem('user') || '{}');
      const updated = { ...stored, username: newUsername };
      localStorage.setItem('user', JSON.stringify(updated));
      setLocalUser(updated);
      if (setPropUser) setPropUser(updated);
      toast.success('Username updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error changing username');
    }
  };

  /* ---- ADD SECONDARY PROFILE ---- */
  const handleAddSecondaryProfile = async () => {
    if (!secondaryType) { toast.error('Please select a profile type'); return; }
    try {
      await axios.post('http://localhost:5000/api/profile/add-secondary', {
        userId: getUserId(),
        profileType: secondaryType,
      });
      toast.success(`${secondaryType} profile created!`);
      setShowAddSecondary(false);
      setSecondaryType('');
      fetchProfile(getUserId());
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error creating profile');
    }
  };

  const getInitials = (fn, ln) => `${fn?.[0] || ''}${ln?.[0] || ''}`.toUpperCase();

  /* ========= RENDER ========= */
  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Loading profile...</div>;
  if (!profileData) return <div style={{ padding: 40, textAlign: 'center' }}>Profile not found.</div>;

  const { user: userData, coachProfile, refereeProfile } = profileData;
  const currentRole = userData.role;

  // Show coach/referee sections only for those roles
  const isCoachReferee = currentRole === 'Coach' || currentRole === 'Referee' || coachProfile || refereeProfile;
  const hasBothProfiles = coachProfile && refereeProfile;
  const canAddCoach   = isCoachReferee && !coachProfile;
  const canAddReferee = isCoachReferee && !refereeProfile;
  const canAddSecondary = canAddCoach || canAddReferee;

  // Build role badge list
  const roleBadges = [];
  roleBadges.push(currentRole);
  if (coachProfile && currentRole !== 'Coach') roleBadges.push('Coach');
  if (refereeProfile && currentRole !== 'Referee') roleBadges.push('Referee');

  return (
    <div className="profile-page">

      {/* ===== HEADER ===== */}
      <div className="profile-header-card">
        <div className="profile-avatar">{getInitials(userData.firstName, userData.lastName)}</div>
        <div className="profile-header-info">
          <h2>{userData.firstName} {userData.lastName}</h2>
          <p>@{userData.username}</p>
          <p>{userData.email} • {userData.phone}</p>
          <div className="role-badges">
            {roleBadges.map(r => (
              <span key={r} className={`role-badge ${r === currentRole ? 'active-badge' : ''}`}>{r}</span>
            ))}
          </div>
        </div>
      </div>

      {/* ===== PERSONAL INFO ===== */}
      <div className="profile-section">
        <div className="profile-section-header">
          <h3>👤 Personal Information</h3>
          <span>Edit your basic details</span>
        </div>
        <div className="profile-form-grid">
          <div className="profile-form-group">
            <label>First Name</label>
            <input value={userInfo.firstName || ''} onChange={e => setUserInfo({ ...userInfo, firstName: e.target.value })} />
          </div>
          <div className="profile-form-group">
            <label>Last Name</label>
            <input value={userInfo.lastName || ''} onChange={e => setUserInfo({ ...userInfo, lastName: e.target.value })} />
          </div>
          <div className="profile-form-group">
            <label>Email</label>
            <input type="email" value={userInfo.email || ''} onChange={e => setUserInfo({ ...userInfo, email: e.target.value })} />
          </div>
          <div className="profile-form-group">
            <label>Phone</label>
            <input value={userInfo.phone || ''} onChange={e => setUserInfo({ ...userInfo, phone: e.target.value })} />
          </div>
          <div className="profile-form-group full-width">
            <label>Address</label>
            <input value={userInfo.address || ''} onChange={e => setUserInfo({ ...userInfo, address: e.target.value })} />
          </div>
          <div className="profile-form-group">
            <label>NIC (Read Only)</label>
            <input value={userData.nic || ''} readOnly />
          </div>
          <div className="profile-form-group">
            <label>Date of Birth (Read Only)</label>
            <input value={userData.birthday ? new Date(userData.birthday).toLocaleDateString() : ''} readOnly />
          </div>
        </div>
        <div className="profile-actions">
          <button className="btn-save-profile" onClick={handleSaveUserInfo}>Save Changes</button>
        </div>
      </div>

      {/* ===== COACH PROFILE CARD ===== */}
      {coachProfile && (
        <div className="profile-section">
          <div className="profile-section-header">
            <h3>🏋️ Coach Profile</h3>
            <span>Your coach-specific details</span>
          </div>
          <div className="profile-form-grid">
            <div className="profile-form-group">
              <label>Local Licence Number</label>
              <input value={coachProfile.localLicenceNumber || ''} readOnly />
            </div>
            <div className="profile-form-group">
              <label>International Licence Number</label>
              <input value={coachProfile.internationalLicenceNumber || ''} readOnly />
            </div>
            <div className="profile-form-group">
              <label>Province</label>
              <input value={coachProfile.province || 'N/A'} readOnly />
            </div>
            <div className="profile-form-group">
              <label>District</label>
              <input value={coachProfile.district || 'N/A'} readOnly />
            </div>
            <div className="profile-form-group">
              <label>Status</label>
              <input value={coachProfile.status || 'Active'} readOnly />
            </div>
          </div>
          <p style={{ color: '#64748b', fontSize: 13, marginTop: 10 }}>
            ℹ️ To edit Coach profile details, please go to the <strong>Coach</strong> section in the sidebar.
          </p>
        </div>
      )}

      {/* ===== REFEREE PROFILE CARD ===== */}
      {refereeProfile && (
        <div className="profile-section">
          <div className="profile-section-header">
            <h3>🏅 Referee Profile</h3>
            <span>Your referee-specific details</span>
          </div>
          <div className="profile-form-grid">
            <div className="profile-form-group">
              <label>Grade Category</label>
              <input value={refereeProfile.gradeCategory || 'N/A'} readOnly />
            </div>
            <div className="profile-form-group">
              <label>Local Licence Number</label>
              <input value={refereeProfile.localLicenceNumber || ''} readOnly />
            </div>
            <div className="profile-form-group">
              <label>Province</label>
              <input value={refereeProfile.province || 'N/A'} readOnly />
            </div>
            <div className="profile-form-group">
              <label>Status</label>
              <input value={refereeProfile.status || 'Active'} readOnly />
            </div>
          </div>
          <p style={{ color: '#64748b', fontSize: 13, marginTop: 10 }}>
            ℹ️ To edit Referee profile details, please go to the <strong>Referee</strong> section in the sidebar.
          </p>
        </div>
      )}

      {/* ===== SWITCH ACTIVE ROLE — Coach <-> Referee only ===== */}
      {hasBothProfiles && (
        <div className="profile-section">
          <div className="profile-section-header">
            <h3>🔄 Switch Active Role</h3>
            <span>Switch your active dashboard role</span>
          </div>

          <div className="switch-role-controls">
            <div className="active-role-status">
              <span>Current Active Role:</span>
              <span className="active-role-badge">✓ {currentRole}</span>
            </div>

            <div className="switch-role-actions">
              {currentRole === 'Coach' && (
                <button
                  className="btn-switch-role"
                  onClick={() => handleSwitchRole('Referee')}
                  disabled={switchLoading}
                >
                  {switchLoading ? 'Switching...' : '⇄ Switch to Referee'}
                </button>
              )}
              {currentRole === 'Referee' && (
                <button
                  className="btn-switch-role"
                  onClick={() => handleSwitchRole('Coach')}
                  disabled={switchLoading}
                >
                  {switchLoading ? 'Switching...' : '⇄ Switch to Coach'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===== ADD SECONDARY PROFILE ===== */}
      {canAddSecondary && (
        <div className="profile-section">
          <div className="profile-section-header">
            <h3>➕ Add Secondary Profile</h3>
            <span>Extend your roles</span>
          </div>
          {!showAddSecondary ? (
            <button className="btn-add-secondary" onClick={() => setShowAddSecondary(true)}>
              + Add Another Profile
            </button>
          ) : (
            <>
              <p style={{ color: '#475569', marginBottom: 12 }}>Select the type of profile you want to add:</p>
              <div className="secondary-type-selector">
                {canAddCoach && (
                  <button
                    className={`btn-type-option ${secondaryType === 'Coach' ? 'selected' : ''}`}
                    onClick={() => setSecondaryType('Coach')}
                  >
                    🏋️ Coach Profile
                  </button>
                )}
                {canAddReferee && (
                  <button
                    className={`btn-type-option ${secondaryType === 'Referee' ? 'selected' : ''}`}
                    onClick={() => setSecondaryType('Referee')}
                  >
                    🏅 Referee Profile
                  </button>
                )}
              </div>
              <div className="profile-actions" style={{ marginTop: 16 }}>
                <button
                  style={{ background: '#e2e8f0', padding: '10px 20px', border: 'none', borderRadius: 8, cursor: 'pointer' }}
                  onClick={() => { setShowAddSecondary(false); setSecondaryType(''); }}
                >
                  Cancel
                </button>
                <button className="btn-add-secondary" onClick={handleAddSecondaryProfile}>
                  Create Profile
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ===== GENERAL SETTINGS ===== */}
      <div className="profile-section">
        <div className="settings-toggle" onClick={() => setShowSettings(!showSettings)}>
          <h3>⚙️ General Settings</h3>
          <span style={{ fontSize: 20 }}>{showSettings ? '▲' : '▼'}</span>
        </div>

        {showSettings && (
          <div className="settings-body">
            {/* Change Username */}
            <div style={{ marginBottom: 24 }}>
              <h4 style={{ margin: '0 0 12px', color: '#334155' }}>Change Username</h4>
              <div className="settings-row">
                <div className="profile-form-group">
                  <label>New Username</label>
                  <input value={newUsername} onChange={e => setNewUsername(e.target.value)} />
                </div>
              </div>
              <div className="profile-actions" style={{ marginTop: 8 }}>
                <button className="btn-save-profile" onClick={handleChangeUsername}>Update Username</button>
              </div>
            </div>

            {/* Change Password */}
            <div>
              <h4 style={{ margin: '0 0 12px', color: '#334155' }}>Change Password</h4>
              <div className="settings-row">
                <div className="profile-form-group">
                  <label>Current Password</label>
                  <input type="password" value={passwords.currentPassword}
                    onChange={e => setPasswords({ ...passwords, currentPassword: e.target.value })} />
                </div>
                <div className="profile-form-group">
                  <label>New Password</label>
                  <input type="password" value={passwords.newPassword}
                    onChange={e => setPasswords({ ...passwords, newPassword: e.target.value })} />
                </div>
                <div className="profile-form-group">
                  <label>Confirm New Password</label>
                  <input type="password" value={passwords.confirmPassword}
                    onChange={e => setPasswords({ ...passwords, confirmPassword: e.target.value })} />
                </div>
              </div>
              <div className="profile-actions" style={{ marginTop: 8 }}>
                <button className="btn-change-pass" onClick={handleChangePassword}>Change Password</button>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default ProfilePage;
