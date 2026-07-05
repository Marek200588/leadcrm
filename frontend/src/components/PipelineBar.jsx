import { STATUSES, formatMoneyCompact } from "../lib/constants";
import "./PipelineBar.css";

// Signature element: pipeline stages as a single proportional bar,
// each segment sized by its share of total value.
export default function PipelineBar({ byStatus }) {
  const stages = STATUSES.map((s) => {
    const stat = byStatus.find((b) => b.status === s.key);
    return {
      ...s,
      count: stat?.count ?? 0,
      value: stat?.total_value ?? 0,
    };
  });

  const total = stages.reduce((sum, s) => sum + s.value, 0);
  const hasValue = total > 0;

  return (
    <div className="pipebar">
      <div className="pipebar-track" role="img" aria-label="Pipeline value by stage">
        {hasValue ? (
          stages.map((s) =>
            s.value > 0 ? (
              <div
                key={s.key}
                className="pipebar-seg"
                style={{
                  flexGrow: s.value,
                  background: s.color,
                }}
                title={`${s.label}: ${formatMoneyCompact(s.value)} (${s.count})`}
              />
            ) : null
          )
        ) : (
          <div className="pipebar-empty-track" />
        )}
      </div>

      <div className="pipebar-legend">
        {stages.map((s) => (
          <div key={s.key} className="pipebar-legend-item">
            <span className="pipebar-dot" style={{ background: s.color }} />
            <span className="pipebar-legend-label">{s.label}</span>
            <span className="pipebar-legend-count tnum">{s.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
