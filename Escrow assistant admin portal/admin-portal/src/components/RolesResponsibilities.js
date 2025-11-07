
export default function RolesResponsibilities() {
  return (
    <div style={{ padding: 32, maxWidth: 900, margin: '0 auto' }}>
      <h1>Team Roles & Responsibilities</h1>
      <section style={{ marginBottom: 32 }}>
        <h2>👑 Your Role (Admin Operator / Owner)</h2>
        <ul>
          <li><b>Manage the platform:</b> Approve/suspend users, oversee contracts & disputes, monitor transactions and escrow balances.</li>
          <li><b>Manage the support team:</b> Hire, create accounts, assign roles (support agent, mediator, admin), decide who handles disputes/support.</li>
          <li><b>Decision-making:</b> Step into serious disputes, approve fund releases in exceptional cases, set policies for refunds/service rules.</li>
          <li><b>System oversight:</b> View analytics, check staff performance, access logs of all tickets, chats, payments (audit trail).</li>
        </ul>
      </section>
      <section style={{ marginBottom: 32 }}>
        <h2>👩‍💻 Support Agents (Your Hired Team)</h2>
        <ul>
          <li><b>User assistance:</b> Reply to user questions, help new users, provide updates on escrow status.</li>
          <li><b>Case handling:</b> Answer tickets, collect info before escalation, close simple cases (password reset, withdrawal help).</li>
        </ul>
      </section>
      <section style={{ marginBottom: 32 }}>
        <h2>⚖ Mediators (Special Role in Disputes)</h2>
        <ul>
          <li><b>Dispute resolution:</b> Step into dispute tickets, review all evidence, hear both sides, decide on fund release/refund/partial payment.</li>
          <li><b>Fair decision-making:</b> Stay neutral, follow platform rules, document reasoning in the ticket/chat.</li>
        </ul>
      </section>
      <section style={{ marginBottom: 32 }}>
        <h2>🛠 Admin Team (Managers, Under You)</h2>
        <ul>
          <li><b>Manage support agents & mediators:</b> Assign cases, monitor performance.</li>
          <li><b>Handle escalated disputes:</b> Intervene before they reach the owner.</li>
          <li><b>Generate reports:</b> Weekly ticket stats, resolved/pending counts.</li>
          <li><b>Spot abuse:</b> Detect fake users, scammers, fraudulent contracts.</li>
        </ul>
      </section>
      <section style={{ marginBottom: 32 }}>
        <h2>📌 Example Day-to-Day Work</h2>
        <ul>
          <li>Buyer opens a ticket: "Seller didn’t deliver." Support agent replies and escalates to mediation.</li>
          <li>Mediator reviews contract, evidence, and decides: "Refund buyer, deduct penalty from seller."</li>
          <li>Admin operator is notified, steps in only for serious challenges.</li>
          <li>Analytics: See dispute stats and staff performance.</li>
        </ul>
      </section>
      <section>
        <h2>👉 In Short</h2>
        <ul>
          <li><b>You:</b> Big picture + authority</li>
          <li><b>Admins:</b> Manage staff + supervise disputes</li>
          <li><b>Mediators:</b> Settle disputes fairly</li>
          <li><b>Agents:</b> Answer users, handle easy tickets</li>
        </ul>
      </section>
    </div>
  );
}
