import { useEffect, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Pencil, Plus, RotateCw, Save, Target, Trash2, Utensils } from 'lucide-react';
import { Button, ConfirmDialog, EmptyState, LoadingState, PageHeader, StatusBanner, Surface } from './ui';

const nutrients = [['calories', 'Calories', 'kcal'], ['proteinGrams', 'Protein', 'g'],
  ['carbohydrateGrams', 'Carbohydrates', 'g'], ['fatGrams', 'Fat', 'g'], ['fiberGrams', 'Fiber', 'g']];
const types = ['breakfast', 'lunch', 'dinner', 'snack'];
const blank = () => Object.fromEntries(nutrients.map(([key]) => [key, '']));
const localDate = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

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
    }).catch((requestError) => { if (active) setError(requestError.message); });
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
      setData(null); setVersion((value) => value + 1);
    } catch (requestError) { setError(requestError.message); }
    finally { setBusy(false); }
  }

  const deletingMeal = data?.meals.find((meal) => meal.id === deleting);

  return <section className="profile-content diet-page">
    <PageHeader eyebrow="Personal / Diet" title="Daily diet" description="Track meals and compare daily nutrition with your targets." />
    <div className="diet-toolbar">
      <Button icon={ChevronLeft} disabled={busy} onClick={() => moveDate(-1)}>Previous</Button>
      <label className="diet-date"><CalendarDays size={18} aria-hidden="true" /><span>Date</span><input aria-label="Diet date" type="date" value={date} disabled={busy}
        onChange={(event) => { if (event.target.value) setDate(event.target.value); }} /></label>
      <Button disabled={busy} onClick={() => setDate(localDate())}>Today</Button>
      <Button icon={ChevronRight} disabled={busy} onClick={() => moveDate(1)}>Next</Button>
    </div>
    {error && <StatusBanner tone="error" role="alert">{error} <button className="text-action" onClick={() => setVersion((value) => value + 1)}><RotateCw size={15} aria-hidden="true" /> Retry loading</button></StatusBanner>}
    {message && <StatusBanner tone="success" role="status">{message}</StatusBanner>}
    {!data && !error && <LoadingState>Loading meals…</LoadingState>}
    {data && <>
      <div className="diet-summary">{nutrients.map(([key, label, unit]) =>
        <Surface as="article" key={key} className={data.overTarget?.[key] > 0 ? 'over-target' : ''}>
          <p className="eyebrow">{label}</p><strong>{data.totals[key]} <small>{unit}</small></strong>
          <p>{data.targets ? `Target ${data.targets[key]} ${unit}` : 'No target set'}</p>
          {data.targets && <progress aria-label={`${label} toward target`} value={Math.min(data.totals[key], data.targets[key])} max={data.targets[key]} />}
          {data.overTarget?.[key] > 0 && <span>{data.overTarget[key]} {unit} over target</span>}
        </Surface>)}</div>
      {!data.targets && <StatusBanner>Set your daily targets to compare them with your intake.</StatusBanner>}
      <div className="diet-toolbar diet-actions">
        <Button icon={Target} disabled={busy} onClick={() => setEditor({ kind: 'targets', nutrition: data.targets || blank() })}>Edit targets</Button>
        <Button variant="primary" icon={Plus} disabled={busy} onClick={() => setEditor({ kind: 'meal', date, name: '', mealType: 'breakfast', servingDescription: '', nutrition: blank() })}>Add meal</Button>
      </div>
      {!data.meals.length && <EmptyState icon={Utensils} title="No meals yet" description="Add your first meal for this date to start tracking your intake." action={<Button variant="primary" icon={Plus} onClick={() => setEditor({ kind: 'meal', date, name: '', mealType: 'breakfast', servingDescription: '', nutrition: blank() })}>Add meal</Button>} />}
      {types.map((type) => {
        const meals = data.meals.filter((meal) => meal.mealType === type);
        return meals.length > 0 && <section className="diet-meal-group" key={type}><h2>{type.charAt(0).toUpperCase() + type.slice(1)}</h2>
          {meals.map((meal) => <Surface as="article" className="diet-meal" key={meal.id}>
            <div><h3>{meal.name}</h3>{meal.servingDescription && <p>{meal.servingDescription}</p>}
              <p className="diet-nutrition">{nutrients.map(([key, label, unit]) => `${label}: ${meal.nutrition[key]} ${unit}`).join(' · ')}</p></div>
            <div className="diet-toolbar"><Button icon={Pencil} disabled={busy} onClick={() => setEditor({ ...meal, kind: 'meal' })}>Edit</Button>
              <Button variant="danger" icon={Trash2} disabled={busy} onClick={() => setDeleting(meal.id)}>Delete</Button></div>
          </Surface>)}</section>;
      })}
    </>}
    {editor && <DietForm key={`${editor.kind}-${editor.id || 'new'}`} initial={editor} busy={busy} onCancel={() => setEditor(null)} onSave={(values) => {
      if (editor.kind === 'targets') return mutate('/api/diet/targets', 'PUT', values.nutrition);
      return mutate(`/api/diet/meals${editor.id ? `/${editor.id}` : ''}`, editor.id ? 'PATCH' : 'POST', values);
    }} />}
    <ConfirmDialog open={Boolean(deletingMeal)} title="Delete meal?" description={deletingMeal ? `${deletingMeal.name} will be removed from this daily record.` : ''} confirmLabel="Delete meal" busy={busy} onCancel={() => setDeleting(null)} onConfirm={() => mutate(`/api/diet/meals/${deletingMeal.id}`, 'DELETE')} />
  </section>;
}

function DietForm({ initial, busy, onCancel, onSave }) {
  const [form, setForm] = useState(initial);
  const targets = initial.kind === 'targets';
  const field = (key) => ({ value: form[key], onChange: (event) => setForm({ ...form, [key]: event.target.value }) });
  return <Surface className="diet-editor"><h2>{targets ? 'Daily targets' : initial.id ? 'Edit meal' : 'Add meal'}</h2>
    {targets && <p>These targets apply to every date. Enter your own targets; none are preselected.</p>}
    <form onSubmit={(event) => {
      event.preventDefault();
      const nutrition = Object.fromEntries(nutrients.map(([key]) => [key, Number(form.nutrition[key])]));
      onSave(targets ? { nutrition } : { date: form.date, name: form.name, mealType: form.mealType, servingDescription: form.servingDescription, nutrition });
    }}><fieldset disabled={busy} className="diet-form-grid">
      {!targets && <>
        <label>Meal name<input {...field('name')} required maxLength={120} autoFocus /></label>
        <label>Date<input type="date" {...field('date')} required /></label>
        <label>Meal type<select {...field('mealType')}>{types.map((type) => <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>)}</select></label>
        <label>Serving (optional)<input {...field('servingDescription')} maxLength={80} placeholder="e.g. 1 bowl" /></label>
      </>}
      {nutrients.map(([key, label, unit]) => <label key={key}>{label} ({unit})<input required type="number" min={targets ? (key === 'calories' ? 1 : 0.1) : 0}
        step={key === 'calories' ? 1 : 0.1} value={form.nutrition[key]} onChange={(event) => setForm({ ...form, nutrition: { ...form.nutrition, [key]: event.target.value } })} /></label>)}
      <div className="diet-toolbar"><Button variant="primary" icon={Save} type="submit">{busy ? 'Saving…' : 'Save'}</Button><Button type="button" onClick={onCancel}>Cancel</Button></div>
    </fieldset></form>
  </Surface>;
}
