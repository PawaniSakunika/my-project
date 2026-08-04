import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Register from './pages/Register';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Admin from './pages/Admin';
import Competitions from './pages/Competitions';
import CompetitionRegister from './pages/CompetitionRegister';
import CompetitionView from './pages/CompetitionView';

function App() {
  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover theme="colored" />
      <Router>
        <Routes>
          {/* මුලින්ම එන කෙනෙක්ව කෙලින්ම ලොගින් පිටුවට හරවා යවනවා */}
          <Route path="/" element={<Navigate to="/login" />} />
          
          {/* අපේ ප්‍රධාන පිටු දෙක විතරක් රවුට් කරනවා (කිසිම වෙනසක් කළේ නැත) */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* 🏋️‍♂️ ලොග් වුණාම යන නියම හෝම් ඩෑෂ්බෝඩ් පිටුව */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/competitions" element={<Competitions />} />
          <Route path="/competitions/:id/register" element={<CompetitionRegister />} />
          <Route path="/competitions/:id/view" element={<CompetitionView />} />

        </Routes>
      </Router>
    </>
  );
}

export default App;