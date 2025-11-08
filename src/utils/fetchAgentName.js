import { API_BASE_URL } from '@env';

// Utility to fetch agent full name by email
export async function fetchAgentName(agentEmail) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/support/agent-name/${encodeURIComponent(agentEmail)}`);
    if (!res.ok) return agentEmail;
    const data = await res.json();
    return data.name || agentEmail;
  } catch {
    return agentEmail;
  }
}
