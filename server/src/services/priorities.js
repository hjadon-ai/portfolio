const validDate = (value) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  value >= '0001-01-01' && Number.isFinite(Date.parse(value)) &&
  new Date(value).toISOString().slice(0, 10) === value;

function todayInZone(zone, now = new Date()) {
  if (typeof zone !== 'string' || !zone || /^[+-]/.test(zone)) return null;
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit'
    }).formatToParts(now);
    const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
    return `${values.year.padStart(4, '0')}-${values.month}-${values.day}`;
  } catch (_) { return null; }
}

const validTitle = (value) => typeof value === 'string' && !/[\r\n\u2028\u2029]/.test(value) &&
  value.trim().length >= 1 && value.trim().length <= 120;

function priorityInput(body, partial = false) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return null;
  const keys = Object.keys(body);
  if (!keys.length || keys.some((key) => !(partial ? ['title', 'completed'] : ['title']).includes(key))) return null;
  const result = {};
  if ('title' in body) {
    if (!validTitle(body.title)) return null;
    result.title = body.title.trim();
  }
  if ('completed' in body) {
    if (typeof body.completed !== 'boolean') return null;
    result.completed = body.completed;
  }
  return result;
}

const publicPriority = (item) => ({ id: String(item._id), title: item.title, completed: item.completed });
function publicDay(date, day) {
  const priorities = (day?.priorities || []).map(publicPriority);
  return { date, priorities, progress: {
    completed: priorities.filter((item) => item.completed).length, total: priorities.length, limit: 3
  } };
}
module.exports = { validDate, todayInZone, validTitle, priorityInput, publicPriority, publicDay };
