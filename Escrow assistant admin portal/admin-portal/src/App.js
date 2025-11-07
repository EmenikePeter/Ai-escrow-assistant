import { jwtDecode } from 'jwt-decode';
import { useEffect, useState } from 'react';
import './App.css';
import Analytics from './components/Analytics';
import Chat from './components/Chat';
import ChatHistory from './components/ChatHistory';
import Dashboard from './components/Dashboard';
import DisputeRoom from './components/DisputeRoom';
import HelpIssuesAdmin from './components/HelpIssuesAdmin';
import LoginScreen from './components/LoginScreen';
import Monitoring from './components/Monitoring';
import Sidebar from './components/Sidebar';
import SupportDashboard from './components/SupportDashboard';
import SystemSettings from './components/SystemSettings';
import Team from './components/Team';
import Tickets from './components/Tickets';
import logo from './logo.svg';

function App() {
  const [selected, setSelected] = useState('dashboard');
  const [user, setUser] = useState(null); // null means not logged in
  const [profileOpen, setProfileOpen] = useState(false);
  const sampleDisputeId = 'demo-dispute-id';

  // Restore user from token on app load
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUser({
          name: decoded.name,
          role: decoded.role,
          email: decoded.email,
        });
      } catch (e) {
        localStorage.removeItem('token');
      }
    }
  }, []);

  // If not logged in, show login screen
  if (!user) {
    return <LoginScreen onLogin={userObj => {
      setUser(userObj);
      // Set dashboard section based on role
      if (userObj.role === 'support_agent') setSelected('support');
      else if (userObj.role === 'mediator') setSelected('support');
      else if (userObj.role === 'admin' || userObj.role === 'super_admin') setSelected('dashboard');
      else setSelected('dashboard');
    }} />;
  }

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setSelected('dashboard');
  };

  // Sidebar links: admins and super_admins see all screens, team roles see a subset
  let sidebarLinks = [];
  if (user && (user.role === 'admin' || user.role === 'super_admin')) {
    // Admins get access to every screen
    sidebarLinks = [
      { key: 'dashboard', label: 'Dashboard' },
      { key: 'tickets', label: 'Ticket Management' },
      { key: 'disputes', label: 'Disputes' },
      { key: 'team', label: 'Team Roles' },
      { key: 'chat', label: 'Support Chat' },
      { key: 'chathistory', label: 'Chat History' },
      { key: 'helpissues', label: 'Help Issues' },
      { key: 'roles', label: 'Roles & Responsibilities' },
      { key: 'support', label: 'Support Team Dashboard' },
      { key: 'analytics', label: 'Analytics' },
      { key: 'settings', label: 'System Settings' },
      { key: 'monitoring', label: 'Monitoring & Safety' },
    ];
  } else if (user) {
    // Team roles see only their relevant screens
    sidebarLinks = [
      { key: 'dashboard', label: 'Dashboard' },
      { key: 'tickets', label: 'Ticket Management' },
      { key: 'disputes', label: 'Disputes' },
      { key: 'team', label: 'Team Roles' },
      { key: 'chat', label: 'Support Chat' },
      { key: 'chathistory', label: 'Chat History' },
      { key: 'roles', label: 'Roles & Responsibilities' },
      { key: 'support', label: 'Support Team Dashboard' },
    ];
  }
  console.log('user:', user);
  console.log('sidebarLinks:', sidebarLinks);

  return (
    <div className="App" style={{ display: 'flex' }}>
      <div style={{ position: 'fixed', left: 0, top: 0, zIndex: 10 }}>
        <img src={logo} alt="Logo" style={{ height: 48, margin: '1rem' }} />
      </div>
      <Sidebar onSelect={setSelected} links={sidebarLinks} />
      {/* Profile icon in top right */}
      <div style={{ position: 'fixed', top: 20, right: 32, zIndex: 20, cursor: 'pointer' }} onClick={() => setProfileOpen(true)} title="Account">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="16" cy="16" r="16" fill="#4B7BEC" />
          <circle cx="16" cy="13" r="6" fill="#fff" />
          <ellipse cx="16" cy="24" rx="8" ry="5" fill="#fff" />
        </svg>
      </div>
      {/* Profile modal */}
      {profileOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.25)', zIndex: 100 }} onClick={() => setProfileOpen(false)}>
          <div style={{ position: 'fixed', top: 80, right: 40, background: '#fff', borderRadius: 12, boxShadow: '0 2px 16px rgba(0,0,0,0.12)', padding: '2rem 2.5rem', minWidth: 260 }} onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: 'center', fontSize: 16, color: '#333' }}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>{user.name}</div>
              <div style={{ fontSize: 13, color: '#888', marginBottom: 16 }}>Role: {user.role}</div>
              <button onClick={handleLogout} style={{ marginTop: 8, padding: '6px 16px', fontSize: 14, width: '100%' }}>Logout</button>
            </div>
          </div>
        </div>
      )}
      <div style={{ flex: 1, padding: '2rem', marginLeft: 220 }}>
  {selected === 'dashboard' && <Dashboard user={user} />}
  {selected === 'tickets' && <Tickets user={user} />}
  {selected === 'disputes' && <DisputeRoom disputeId={sampleDisputeId} user={user} />}
  {selected === 'team' && <Team user={user} />}
  {selected === 'chat' && <Chat user={user} />}
  {selected === 'helpissues' && <HelpIssuesAdmin user={user} />}
  {selected === 'chathistory' && <ChatHistory user={user} />}
  {selected === 'analytics' && <Analytics user={user} />}
  {selected === 'settings' && <SystemSettings user={user} />}
  {selected === 'monitoring' && <Monitoring user={user} />}
  {selected === 'support' && <SupportDashboard user={user} />}
      </div>
    </div>
  );
}

export default App;
