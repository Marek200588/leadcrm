// Shared constants and formatting helpers.

export const STATUSES = [
  { key: "new", label: "New", color: "var(--stage-new)" },
  { key: "contacted", label: "Contacted", color: "var(--stage-contacted)" },
  { key: "qualified", label: "Qualified", color: "var(--stage-qualified)" },
  { key: "proposal", label: "Proposal", color: "var(--stage-proposal)" },
  { key: "won", label: "Won", color: "var(--stage-won)" },
  { key: "lost", label: "Lost", color: "var(--stage-lost)" },
];

export const ACTIVITY_TYPES = [
  { key: "note", label: "Note" },
  { key: "call", label: "Call" },
  { key: "email", label: "Email" },
  { key: "meeting", label: "Meeting" },
];

export function statusLabel(key) {
  return STATUSES.find((s) => s.key === key)?.label ?? key;
}

export function statusColor(key) {
  return STATUSES.find((s) => s.key === key)?.color ?? "var(--ink-500)";
}

const currencyFmt = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export function formatMoney(value) {
  if (value == null) return "—";
  return currencyFmt.format(value);
}

export function formatMoneyCompact(value) {
  if (value == null) return "—";
  if (Math.abs(value) >= 1000) {
    return "$" + (value / 1000).toFixed(value % 1000 === 0 ? 0 : 1) + "k";
  }
  return "$" + value;
}

export function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatRelative(iso) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(iso);
}
