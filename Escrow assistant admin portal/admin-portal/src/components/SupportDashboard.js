import AdminDashboard from './AdminDashboard';
import AgentDashboard from './AgentDashboard';
import MediatorDashboard from './MediatorDashboard';

export default function SupportDashboard({ user }) {
  if (!user) return <div>Please log in.</div>;
  if (user.role === 'support_agent') return <AgentDashboard user={user} />;
  if (user.role === 'mediator') return <MediatorDashboard user={user} />;
  if (user.role === 'admin' || user.role === 'super_admin') return <AdminDashboard user={user} />;
  return <div>Unknown role</div>;
}
