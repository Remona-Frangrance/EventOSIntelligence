export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function makeCode(prefix: string, len = 6) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return `${prefix}-${s}`;
}

export function timeAgo(d: string | Date) {
  const t = new Date(d).getTime();
  const diff = Date.now() - t;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function avg(nums: number[]) {
  if (!nums.length) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

export function stddev(nums: number[]) {
  if (nums.length < 2) return 0;
  const m = avg(nums);
  return Math.sqrt(nums.reduce((a, b) => a + (b - m) ** 2, 0) / nums.length);
}
