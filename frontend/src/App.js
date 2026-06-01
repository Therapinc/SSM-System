import React from 'react';
import { Routes, Route, BrowserRouter } from 'react-router-dom';
import LoginPage from './pages/LoginPage.jsx';
import LandingPage from './pages/LandingPage.jsx';
import HeadMaster from './pages/HeadMaster.jsx';
import AddTeacher from './pages/AddTeacher.jsx';
import AddTherapist from './pages/AddTherapist.jsx';
import AddStudent from './pages/AddStudent.jsx';
import StudentPage from './pages/StudentPage.jsx';
import StudentViewPage from './pages/StudentViewPage.jsx';
import TeacherPage from './pages/TeacherPage.jsx';
import TherapistPage from './pages/TherapistPage.jsx';
import TeacherDashboard from './pages/TeacherDashboard.jsx';
import TherapistDashboard from './pages/TherapistDashboard.jsx';
import AddUser from './pages/AddUser.jsx';
import AuthProvider from './auth/AuthProvider.jsx';
import ProtectedRoute from './auth/ProtectedRoute.jsx';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="App">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />

            {/* Protected routes */}
            <Route path="/headmaster" element={<ProtectedRoute><HeadMaster /></ProtectedRoute>} />
            <Route path="/teacher" element={<ProtectedRoute><TeacherDashboard /></ProtectedRoute>} />
            <Route path="/therapist" element={<ProtectedRoute><TherapistDashboard /></ProtectedRoute>} />
            <Route path="/add-teacher" element={<ProtectedRoute><AddTeacher /></ProtectedRoute>} />
            <Route path="/add-therapist" element={<ProtectedRoute><AddTherapist /></ProtectedRoute>} />
            <Route path="/add-student" element={<ProtectedRoute><AddStudent /></ProtectedRoute>} />
            <Route path="/add-user" element={<ProtectedRoute><AddUser /></ProtectedRoute>} />
            <Route path="/student/:id" element={<ProtectedRoute><StudentPage /></ProtectedRoute>} />
            <Route path="/student-view" element={<ProtectedRoute><StudentViewPage /></ProtectedRoute>} />
            <Route path="/teacher/:id" element={<ProtectedRoute><TeacherPage /></ProtectedRoute>} />
            <Route path="/therapist/:id" element={<ProtectedRoute><TherapistPage /></ProtectedRoute>} />
          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
