import { useEffect, useState } from 'react';

const nutrients = [['calories', 'Calories', 'kcal'], ['proteinGrams', 'Protein', 'g'],
  ['carbohydrateGrams', 'Carbohydrates', 'g'], ['fatGrams', 'Fat', 'g'], ['fiberGrams', 'Fiber', 'g']];
const types = ['breakfast', 'lunch', 'dinner', 'snack'];
const blank = () => Object.fromEntries(nutrients.map(([key]) => [key, '']));
const localDate = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export default function Diet({ apiRequest }) {
  const [date, setDate] = useState(localDate);
  return <DietDay key={date} date={date} setDate={setDate} apiRequest={apiRequest} />;
}

function DietDay({ date, setDate, apiRequest }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [editor, setEditor] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let active = true;
    apiRequest(`/api/diet/days/${date}`).then((result) => {
      if (active) { setData(result); setError(''); }
    }).catch((e) => { if (active) setError(e.message); });
    return () => { active = false; };
  }, [date, version, apiRequest]);

  function moveDate(amount) {
    const next = new Date(`${date}T12:00:00`);
    next.setDate(next.getDate() + amount);
    setDate(localDate(next));
  }
  async function mutate(path, method, body) {
    setBusy(true); setError(''); setMessage('');
    try {
      await apiRequest(path, { method, ...(body ? { body: JSON.stringify(body) } : {}) });
      setEditor(null); setDeleting(null);
      setMessage(method === 'DELETE' ? 'Meal deleted.' : 'Saved.');
      setData(null); setVersion((v) => v + 1);
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }

  return <section className="profile-content diet-page">
    <header className="profile-header"><div><p className="eyebrow">Your daily record</p><h1>Daily diet.</h1></div></header>
    <div className="diet-toolbar">
      <button className="button" disabled={busy} onClick={() => moveDate(-1)}>‹ Previous</button>
      <label className="diet-date">Date<input aria-label="Diet date" type="date" value={date} disabled={busy}
        onChange={(e) => { if (e.target.value) setDate(e.target.value); }} /></label>
      <button className="button" disabled={busy} onClick={() => setDate(localDate())}>Today</button>
      <button className="button" disabled={busy} onClick={() => moveDate(1)}>Next ›</button>
    </div>
    {error && <p role="alert" className="form-message">{error} <button className="text-action" onClick={() => setVersion((v) => v + 1)}>Retry loading</button></p>}
    {message && <p role="status">{message}</p>}
    {!data && !error && <p role="status">Loading meals…</p>}
    {data && <>
      <div className="diet-summary">{nutrients.map(([key, label, unit]) =>
        <article key={key} className={data.overTarget?.[key] > 0 ? 'over-target' : ''}>
          <p className="eyebrow">{label}</p><strong>{data.totals[key]} <small>{unit}</small></strong>
          <p>{data.targets ? `Target ${data.targets[key]} ${unit}` : 'No target set'}</p>
          {data.targets && <progress aria-label={`${label} toward target`} value={Math.min(data.totals[key], data.targets[key])} max={data.targets[key]} />}
          {data.overTarget?.[key] > 0 && <span>{data.overTarget[key]} {unit} over target</span>}
        </article>)}</div>
      {!data.targets && <p>Set your daily targets to compare them with your intake.</p>}
      <div className="diet-toolbar diet-actions">
        <button className="button" disabled={busy} onClick={() => setEditor({ kind: 'targets', nutrition: data.targets || blank() })}>Edit targets</button>
        <button className="button" disabled={busy} onClick={() => setEditor({ kind: 'meal', date, name: '', mealType: 'breakfast', servingDescription: '', nutrition: blank() })}>+ Add meal</button>
      </div>
      {!data.meals.length && <section className="profile-card"><div><h2>No meals yet.</h2><p>Add your first meal for this date to start tracking your intake.</p></div></section>}
      {types.map((type) => {
        const meals = data.meals.filter((meal) => meal.mealType === type);
        return meals.length > 0 && <section className="diet-meal-group" key={type}><h2>{type.charAt(0).toUpperCase() + type.slice(1)}</h2>
          {meals.map((meal) => <article className="diet-meal" key={meal.id}>
            <div><h3>{meal.name}</h3>{meal.servingDescription && <p>{meal.servingDescription}</p>}
              <p className="diet-nutrition">{nutrients.map(([key, label, unit]) => `${label}: ${meal.nutrition[key]} ${unit}`).join(' · ')}</p></div>
            <div className="diet-toolbar"><button className="button" disabled={busy} onClick={() => setEditor({ ...meal, kind: 'meal' })}>Edit</button>
              <button className="button" disabled={busy} onClick={() => setDeleting(meal.id)}>Delete</button></div>
            {deleting === meal.id && <div className="diet-delete" role="alert">Delete {meal.name}?
              <button className="button" disabled={busy} onClick={() => mutate(`/api/diet/meals/${meal.id}`, 'DELETE')}>Confirm delete</button>
              <button className="button" disabled={busy} onClick={() => setDeleting(null)}>Cancel</button></div>}
          </article>)}
        </section>;
      })}
    </>}
    {editor && <DietForm key={`${editor.kind}-${editor.id || 'new'}`} initial={editor} busy={busy} onCancel={() => setEditor(null)} onSave={(values) => {
      if (editor.kind === 'targets') return mutate('/api/diet/targets', 'PUT', values.nutrition);
      return mutate(`/api/diet/meals${editor.id ? `/${editor.id}` : ''}`, editor.id ? 'PATCH' : 'POST', values);
    }} />}
  </section>;
}

function DietForm({ initial, busy, onCancel, onSave }) {
  const [form, setForm] = useState(initial);
  const targets = initial.kind === 'targets';
  const field = (key) => ({ value: form[key], onChange: (e) => setForm({ ...form, [key]: e.target.value }) });
  return <section className="diet-editor"><h2>{targets ? 'Daily targets' : initial.id ? 'Edit meal' : 'Add meal'}</h2>
    {targets && <p>These targets apply to every date. Enter your own targets; none are preselected.</p>}
    <form onSubmit={(e) => {
      e.preventDefault();
      const nutrition = Object.fromEntries(nutrients.map(([key]) => [key, Number(form.nutrition[key])]));
      onSave(targets ? { nutrition } : { date: form.date, name: form.name, mealType: form.mealType, servingDescription: form.servingDescription, nutrition });
    }}><fieldset disabled={busy} className="diet-form-grid">
      {!targets && <>
        <label>Meal name<input {...field('name')} required maxLength={120} autoFocus /></label>
        <label>Date<input type="date" {...field('date')} required /></label>
        <label>Meal type<select {...field('mealType')}>{types.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}</select></label>
        <label>Serving (optional)<input {...field('servingDescription')} maxLength={80} placeholder="e.g. 1 bowl" /></label>
      </>}
      {nutrients.map(([key, label, unit]) => <label key={key}>{label} ({unit})<input required type="number" min={targets ? (key === 'calories' ? 1 : 0.1) : 0}
        step={key === 'calories' ? 1 : 0.1} value={form.nutrition[key]} onChange={(e) => setForm({ ...form, nutrition: { ...form.nutrition, [key]: e.target.value } })} /></label>)}
      <div className="diet-toolbar"><button className="button" type="submit">{busy ? 'Saving…' : 'Save'}</button><button className="button" type="button" onClick={onCancel}>Cancel</button></div>
    </fieldset></form>
  </section>;
}
