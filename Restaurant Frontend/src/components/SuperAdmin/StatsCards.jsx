const PLAN_COLORS = { free: '#94a3b8', basic: '#6c63ff', pro: '#00d9a6' };

const StatsCards = ({ stats, loading }) => {
  const cards = [
    {
      id: 'stat-total',
      label: 'Total Restaurants',
      value: stats?.total || 0,
      icon: '🏪',
      gradient: 'linear-gradient(135deg, #6c63ff22, #6c63ff08)',
      accent: '#6c63ff',
    },
    {
      id: 'stat-active',
      label: 'Active',
      value: stats?.active || 0,
      icon: '✅',
      gradient: 'linear-gradient(135deg, #22c55e22, #22c55e08)',
      accent: '#22c55e',
    },
    {
      id: 'stat-inactive',
      label: 'Blocked',
      value: stats?.inactive || 0,
      icon: '🚫',
      gradient: 'linear-gradient(135deg, #ff4d6d22, #ff4d6d08)',
      accent: '#ff4d6d',
    },
    {
      id: 'stat-trial',
      label: 'On Trial',
      value: stats?.trials || 0,
      icon: '⏳',
      gradient: 'linear-gradient(135deg, #f59e0b22, #f59e0b08)',
      accent: '#f59e0b',
    },
  ];

  return (
    <div className="sa-stats-section">
      <div className="sa-stats-grid">
        {cards.map((card) => (
          <div
            key={card.id}
            id={card.id}
            className="sa-stat-card"
            style={{ background: card.gradient, borderColor: `${card.accent}40` }}
          >
            <div className="sa-stat-icon" style={{ background: `${card.accent}22`, color: card.accent }}>
              {card.icon}
            </div>
            <div className="sa-stat-body">
              <div className="sa-stat-label">{card.label}</div>
              {loading ? (
                <div className="sa-stat-skeleton" />
              ) : (
                <div className="sa-stat-value" style={{ color: card.accent }}>
                  {card.value}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Plan Breakdown Row */}
      {!loading && (
        <div className="sa-plan-row">
          <span className="sa-plan-row-label">Plans:</span>
          {stats?.byPlan && Object.entries(stats.byPlan).map(([plan, count]) => (
            <span key={plan} className="sa-plan-chip" style={{ borderColor: PLAN_COLORS[plan] || '#ccc', color: PLAN_COLORS[plan] || '#ccc' }}>
              {plan.toUpperCase()} — {count}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default StatsCards;
