import { useState } from 'react';
import Analytics from './Analytics';
import Chat from './Chat';
import ChatHistory from './ChatHistory';
import './Dashboard.css';
import HelpIssuesAdmin from './HelpIssuesAdmin';
import RolesResponsibilities from './RolesResponsibilities';
import Sidebar from './Sidebar';
import SupportDashboard from './SupportDashboard';
import Team from './Team';
import Tickets from './Tickets';

export default function Dashboard({ user }) {
  const [selected, setSelected] = useState('dashboard');

  // Sidebar links by role
  const getLinks = () => {
    if (!user) return [];
    if (user.role === 'admin' || user.role === 'super_admin') {
      return [
        { key: 'dashboard', label: 'Dashboard' },
        { key: 'tickets', label: 'Tickets' },
        { key: 'team', label: 'Team Management' },
        { key: 'chat', label: 'Support Chat' },
        { key: 'chathistory', label: 'Chat History' },
        { key: 'helpissues', label: 'Help Issues' },
        { key: 'analytics', label: 'Analytics' },
        { key: 'roles', label: 'Roles & Responsibilities' },
        { key: 'support', label: 'Support Dashboard' },
      ];
    }
    if (user.role === 'support_agent') {
      return [
        { key: 'dashboard', label: 'Dashboard' },
        { key: 'tickets', label: 'My Tickets' },
        { key: 'chat', label: 'Support Chat' },
        { key: 'chathistory', label: 'Chat History' },
      ];
    }
    if (user.role === 'mediator') {
      return [
        { key: 'dashboard', label: 'Dashboard' },
        { key: 'tickets', label: 'Disputes' },
        { key: 'chat', label: 'Mediation Chat' },
      ];
    }
    return [];
  };
  // Widgets/cards by role
  const renderWidgets = () => {
    if (!user) return null;
    if (user.role === 'admin' || user.role === 'super_admin') {
      return (
        <div className="dashboard-widgets">
          <div className="widget" style={{ cursor: 'pointer' }} onClick={() => setSelected('tickets')}>
            <h2>Tickets</h2>
            <p>View and manage support tickets.</p>
          </div>
          <div className="widget" style={{ cursor: 'pointer' }} onClick={() => setSelected('team')}>
            <h2>Team Management</h2>
            <p>Manage staff and roles.</p>
          </div>
          <div className="widget" style={{ cursor: 'pointer' }} onClick={() => setSelected('chat')}>
            <h2>Support Chat</h2>
            <p>Monitor and reply to support chats.</p>
          </div>
          <div className="widget" style={{ cursor: 'pointer' }} onClick={() => setSelected('chathistory')}>
            <h2>Chat History</h2>
            <p>Browse past chat sessions.</p>
          </div>
          <div className="widget" style={{ cursor: 'pointer' }} onClick={() => setSelected('helpissues')}>
            <h2>Help Issues</h2>
            <p>View and reply to user help requests.</p>
          </div>
          <div className="widget" style={{ cursor: 'pointer' }} onClick={() => setSelected('analytics')}>
            <h2>Analytics</h2>
            <p>View system statistics and reports.</p>
          </div>
        </div>
      );
    }
    if (user.role === 'support_agent') {
      return (
        <div className="dashboard-widgets">
          <div className="widget" style={{ cursor: 'pointer' }} onClick={() => setSelected('tickets')}>
            <h2>My Tickets</h2>
            <p>View and manage your assigned tickets.</p>
          </div>
          <div className="widget" style={{ cursor: 'pointer' }} onClick={() => setSelected('chat')}>
            <h2>Support Chat</h2>
            <p>Chat with users and team.</p>
          </div>
          <div className="widget" style={{ cursor: 'pointer' }} onClick={() => setSelected('chathistory')}>
            <h2>Chat History</h2>
            <p>Browse past chat sessions.</p>
          </div>
        </div>
      );
    }
    if (user.role === 'mediator') {
      return (
        <div className="dashboard-widgets">
          <div className="widget" style={{ cursor: 'pointer' }} onClick={() => setSelected('tickets')}>
            <h2>Disputes</h2>
            <p>Review and resolve dispute tickets.</p>
          </div>
          <div className="widget" style={{ cursor: 'pointer' }} onClick={() => setSelected('chat')}>
            <h2>Mediation Chat</h2>
            <p>Communicate with parties in dispute.</p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar onSelect={setSelected} links={getLinks()} />
      <div className="dashboard-container" style={{ marginLeft: 220, width: '100%' }}>
        {/* Go Back Arrow */}
        {selected !== 'dashboard' && (
          <button
            onClick={() => setSelected('dashboard')}
            style={{
              background: 'none',
              border: 'none',
              color: '#333',
              fontSize: 24,
              cursor: 'pointer',
              margin: '16px 0 0 0',
              display: 'flex',
              alignItems: 'center',
            }}
            aria-label="Go back to dashboard"
          >
            <span style={{ marginRight: 8 }}>&larr;</span> Go Back
          </button>
        )}
        {selected === 'dashboard' && (
          <>
            <h1>Dashboard</h1>
            {renderWidgets()}
          </>
        )}
        {selected === 'tickets' && <Tickets user={user} />}
        {selected === 'team' && <Team user={user} />}
  {selected === 'chat' && <Chat user={user} />}
  {selected === 'chathistory' && <ChatHistory user={user} />}
  {selected === 'helpissues' && <HelpIssuesAdmin user={user} />}
  {selected === 'analytics' && <Analytics user={user} />}
  {selected === 'roles' && <RolesResponsibilities />}
  {selected === 'support' && <SupportDashboard user={user} />}
      </div>
    </div>
  );
}
