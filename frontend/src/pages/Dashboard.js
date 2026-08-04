import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  FaBars, FaHome, FaUserNinja, FaChalkboardTeacher,
  FaUserShield, FaCogs, FaTrophy, FaPoll,
  FaInfoCircle, FaNewspaper, FaUserCircle, FaSignOutAlt,
  FaUserPlus, FaCalendarPlus, FaArrowRight
} from 'react-icons/fa';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Athletes from './Athletes';
import Admin from './Admin';
import ManageCategories from './ManageCategories';
import Coaches from './Coaches';
import Referees from './Referees';
import Competitions from './Competitions';
import Results from './Results';
import Clubs from './Clubs';
import ProfilePage from './ProfilePage';
import News from './News';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('Home');

  const [counts, setCounts] = useState({ athletes: 0, coaches: 0, referees: 0, admins: 0 });
  const [allAthletes, setAllAthletes] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [topPerformers, setTopPerformers] = useState([]);
  const [selectedYear, setSelectedYear] = useState('All Time');
  const [availableYears, setAvailableYears] = useState([]);

  useEffect(() => {
    const loggedInUser = localStorage.getItem('user');
    if (!loggedInUser) {
      navigate('/login');
    } else {
      setUser(JSON.parse(loggedInUser));
    }
  }, [navigate]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/admin/dashboard-counts');
        setCounts(response.data);

        // Fetch all athletes for analytics and recent results
        const athletesRes = await axios.get('http://localhost:5000/api/athletes/all');
        const athletes = athletesRes.data;
        if (Array.isArray(athletes)) {
          setAllAthletes(athletes);

          // Extract available years from weightHistory
          const years = [...new Set(athletes.flatMap(a => (a.weightHistory || []).map(h => h.year)).filter(Boolean))].sort((a, b) => b - a);
          setAvailableYears(years);
        }
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      }
    };

    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      fetchDashboardData();
    }
  }, [activeTab]);

  useEffect(() => {
    if (allAthletes.length > 0) {
      const filteredAthletes = selectedYear === 'All Time'
        ? allAthletes
        : allAthletes.filter(a => (a.weightHistory || []).some(h => h.year === Number(selectedYear)));

      // Top 5 Athletes by total weight
      const sorted = [...filteredAthletes].sort((a, b) => (b.bestTotal || 0) - (a.bestTotal || 0)).slice(0, 5);
      setTopPerformers(sorted);
    }
  }, [allAthletes, selectedYear]);

  // Update Chart Data based on total system counts whenever `counts` changes
  useEffect(() => {
    if (counts) {
      const cData = [
        { name: 'Athletes', Count: counts.athletes || 0 },
        { name: 'Coaches', Count: counts.coaches || 0 },
        { name: 'Referees', Count: counts.referees || 0 },
        { name: 'Admins', Count: counts.admins || 0 }
      ];
      setChartData(cData);
    }
  }, [counts]);

  const handleLogOut = () => {
    localStorage.clear();
    navigate('/login');
  };

  if (!user) return <div className="loading">Loading...</div>;

  // Mock data for Competitions and News
  const upcomingCompetitions = [
    { id: 1, name: "National Weightlifting Championship", date: "2026-08-15", venue: "Sugathadasa Stadium" },
    { id: 2, name: "Kandy District Trials", date: "2026-07-20", venue: "Kandy Gymkhana Club" },
  ];

  const latestNews = [
    { id: 1, title: "National Training Camp Started", date: "Today" },
    { id: 2, title: "New Referee Certification Course", date: "Yesterday" },
    { id: 3, title: "Annual General Meeting 2026", date: "Jun 10" }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'Home':
        return (
          <>
            {/* Header & Welcome Section */}
            <div className="welcome-banner professional-gradient">
              <div className="banner-text">
                <h1>Welcome back, {user.firstName || 'User'}! 👋</h1>
                <p>Role: <span className="role-tag">{user.role}</span></p>
              </div>
              <div className="banner-actions">
                <button className="btn-action primary" onClick={() => setActiveTab('Athletes')}>
                  <FaUserPlus /> Register Athlete
                </button>
                <button className="btn-action secondary" onClick={() => setActiveTab('Competition')}>
                  <FaCalendarPlus /> Add Event
                </button>
              </div>
            </div>

            {/* System Overview Cards */}
            <div className="analysis-grid">
              <div className="analysis-card">
                <div className="card-icon-bg"><FaUserNinja /></div>
                <div className="card-content">
                  <h3>Athletes</h3>
                  <p className="count">{counts.athletes}</p>
                  <span className="trend positive">+2 new this month</span>
                </div>
              </div>
              <div className="analysis-card">
                <div className="card-icon-bg"><FaChalkboardTeacher /></div>
                <div className="card-content">
                  <h3>Coaches</h3>
                  <p className="count">{counts.coaches}</p>
                  <span className="trend positive">+1 new this month</span>
                </div>
              </div>
              <div className="analysis-card">
                <div className="card-icon-bg"><FaUserShield /></div>
                <div className="card-content">
                  <h3>Referees</h3>
                  <p className="count">{counts.referees}</p>
                  {counts.referees === 0 ? (
                    <span className="trend neutral">No data available</span>
                  ) : (
                    <span className="trend positive">Active</span>
                  )}
                </div>
              </div>
              <div className="analysis-card">
                <div className="card-icon-bg"><FaCogs /></div>
                <div className="card-content">
                  <h3>Admin</h3>
                  <p className="count">{counts.admins}</p>
                  <span className="trend positive">System Online</span>
                </div>
              </div>
            </div>

            {/* Main Data Grid */}
            <div className="main-data-grid">

              {/* Left Column (Analytics & Results) */}
              <div className="data-col-left">

                {/* Dashboard Filters */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '-10px' }}>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontWeight: 'bold', color: '#1e293b' }}
                  >
                    <option value="All Time">All Time (Historical Data)</option>
                    {availableYears.map(year => (
                      <option key={year} value={year}>{year} Season</option>
                    ))}
                  </select>
                </div>

                {/* Analytics Chart */}
                <div className="dashboard-section-card">
                  <div className="section-header">
                    <h3><FaPoll className="header-icon" /> Active System Users</h3>
                  </div>
                  <div className="chart-container">
                    {chartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                          <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                          <Bar dataKey="Count" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={35} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="empty-state">No athlete data available for analytics.</div>
                    )}
                  </div>
                </div>

                {/* Recent Results Table */}
                <div className="dashboard-section-card">
                  <div className="section-header">
                    <h3><FaTrophy className="header-icon" /> Recent Top Performers</h3>
                    <span className="view-all" onClick={() => setActiveTab('Result')}>View All <FaArrowRight /></span>
                  </div>
                  <div className="table-responsive">
                    <table className="results-table">
                      <thead>
                        <tr>
                          <th>Athlete Name</th>
                          <th>Weight Class</th>
                          <th>Total (kg)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {topPerformers.length > 0 ? topPerformers.map(ath => (
                          <tr key={ath._id}>
                            <td>{ath.userId?.firstName} {ath.userId?.lastName}</td>
                            <td><span className="badge-weight">{ath.weightClass || 'N/A'}</span></td>
                            <td className="txt-bold total-score">{ath.bestTotal || 0} kg</td>
                          </tr>
                        )) : (
                          <tr><td colSpan="3" className="empty-state">No results found</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>

              {/* Right Column (Competitions & News) */}
              <div className="data-col-right">

                {/* Upcoming Competitions */}
                <div className="dashboard-section-card">
                  <div className="section-header">
                    <h3><FaCalendarPlus className="header-icon" /> Upcoming Competitions</h3>
                    <span className="view-all" onClick={() => setActiveTab('Competition')}>All <FaArrowRight /></span>
                  </div>
                  <div className="card-list">
                    {upcomingCompetitions.map(comp => {
                      const dateObj = new Date(comp.date);
                      return (
                        <div key={comp.id} className="list-item competition-item">
                          <div className="comp-date">
                            <span className="date-month">{dateObj.toLocaleString('default', { month: 'short' })}</span>
                            <span className="date-day">{dateObj.getDate()}</span>
                          </div>
                          <div className="comp-details">
                            <h4>{comp.name}</h4>
                            <p>{comp.venue}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Latest News */}
                <div className="dashboard-section-card">
                  <div className="section-header">
                    <h3><FaNewspaper className="header-icon" /> Latest News</h3>
                    <span className="view-all" onClick={() => setActiveTab('News')}>All <FaArrowRight /></span>
                  </div>
                  <div className="card-list">
                    {latestNews.map(news => (
                      <div key={news.id} className="list-item news-item">
                        <h4>{news.title}</h4>
                        <p className="news-meta">{news.date} • <span className="read-more" onClick={() => setActiveTab('News')}>Read More</span></p>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          </>
        );
      case 'Athletes':
        return <Athletes />;
      case 'Coach':
        return <Coaches />;
      case 'Referee':
        return <Referees />;
      case 'Admin':
        return <Admin />;
      case 'Settings':
        return <ManageCategories />;
      case 'Competition':
        return <Competitions />;
      case 'Result':
        return <Results />;
      case 'Club':
        return <Clubs />;
      case 'News':
        return <News user={user} />;
      case 'Profile':
        return <ProfilePage user={user} setUser={setUser} />;
      default:
        return <h2>Page Not Found</h2>;
    }
  };

  return (
    <div className="dashboard-container">
      <header className="top-navbar">
        <div className="nav-left">
          <button className="toggle-btn" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
            <FaBars />
          </button>
          <div className="logo-section">
            <img src="/logo.png" alt="SLWF Logo" className="app-logo-img" />
            <span className="app-name">SLWF Digital System</span>
          </div>
        </div>
        <div className="nav-center">
          <input type="text" placeholder="Search here..." className="search-bar" />
        </div>
        <div className="nav-right">
          <div className="profile-nav" onClick={() => setActiveTab('Profile')} title="View Profile">
            <FaUserCircle className="user-icon" />
            <span className="nav-username">{user.username}</span>
          </div>
        </div>
      </header>

      <div className="main-wrapper">
        <nav className={`sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
          <ul className="sidebar-menu">
            <li className={activeTab === 'Home' ? 'active' : ''} onClick={() => setActiveTab('Home')}><FaHome /> <span>Home</span></li>
            <li className={activeTab === 'Athletes' ? 'active' : ''} onClick={() => setActiveTab('Athletes')}><FaUserNinja /> <span>Athletes</span></li>
            <li className={activeTab === 'Coach' ? 'active' : ''} onClick={() => setActiveTab('Coach')}><FaChalkboardTeacher /> <span>Coach</span></li>
            <li className={activeTab === 'Referee' ? 'active' : ''} onClick={() => setActiveTab('Referee')}><FaUserShield /> <span>Referee</span></li>
            <li className={activeTab === 'Admin' ? 'active' : ''} onClick={() => setActiveTab('Admin')}><FaCogs /> <span>Admin</span></li>
            {user?.role === 'Admin' && (
              <li className={activeTab === 'Settings' ? 'active' : ''} onClick={() => setActiveTab('Settings')}><FaCogs /> <span>Settings</span></li>
            )}
            <li className={activeTab === 'Competition' ? 'active' : ''} onClick={() => setActiveTab('Competition')}><FaTrophy /> <span>Competition</span></li>
            <li className={activeTab === 'Result' ? 'active' : ''} onClick={() => setActiveTab('Result')}><FaPoll /> <span>Result</span></li>
            <li className={activeTab === 'Club' ? 'active' : ''} onClick={() => setActiveTab('Club')}><FaInfoCircle /> <span>Club</span></li>
            <li className={activeTab === 'News' ? 'active' : ''} onClick={() => setActiveTab('News')}><FaNewspaper /> <span>News</span></li>
            <li className={`profile-item ${activeTab === 'Profile' ? 'active' : ''}`} onClick={() => setActiveTab('Profile')}><FaUserCircle /> <span>Profile</span></li>
          </ul>
          <div className="sidebar-footer">
            <button className="logout-btn" onClick={handleLogOut}>
              <FaSignOutAlt /> <span>Log Out</span>
            </button>
          </div>
        </nav>

        <main className="content-area">
          {renderContent()}

          <footer className="dashboard-footer">
            <p className="footer-address">Address: No:07, DS Senanayake Street, Kandy</p>
            <p className="copyright">2026 © All rights reserved.</p>
          </footer>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
