import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, ListChecks, Pencil, Plus, Trash2 } from 'lucide-react';
import { Button, EmptyState, FormField, LoadingState, PageHeader, StatusBanner, Surface } from './ui';
import { localDate, moveCalendarDate } from './priorities-calendar';

export default function Priorities({ apiRequest }) {
  const [date, setDate] = useState(localDate);
  return <PriorityDay key={date} date={date} setDate={setDate} apiRequest={apiRequest} />;
}

function PriorityDay({ date, setDate, apiRequest }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState('');
  const [editor, setEditor] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [focusTarget, setFocusTarget] = useState(null);
  const mounted = useRef(false);
  const requestNumber = useRef(0);
  const mutationActive = useRef(false);
  const controls = useRef(new Map());
  const inputRef = useRef(null);
  const today = localDate();
  const base = `/api/priorities/days/${date}`;
  const full = data?.priorities.length >= 3;
  const unavailable = Boolean(busy || loading || loadError || !data);
  const dirty = editor && editor.title !== editor.initialTitle;
  const dateLocked = Boolean(busy || dirty || deleting);
  const controlRef = (key) => (node) => {
    if (node) controls.current.set(key, node); else controls.current.delete(key);
  };

  function request(path, options = {}) {
    return apiRequest(path, { ...options, headers: { 'X-Time-Zone': Intl.DateTimeFormat().resolvedOptions().timeZone } });
  }

  async function reload() {
    const number = ++requestNumber.current;
    setLoading(true); setLoadError('');
    try {
      const result = await request(base);
      if (mounted.current && number === requestNumber.current) setData(result);
    } catch (failure) {
      if (mounted.current && number === requestNumber.current) setLoadError(`Could not refresh priorities. ${failure.message}`);
    } finally {
      if (mounted.current && number === requestNumber.current) setLoading(false);
    }
  }

  useEffect(() => {
    mounted.current = true;
    reload();
    return () => { mounted.current = false; requestNumber.current += 1; };
  }, [date, apiRequest]);

  useEffect(() => { if (editor) inputRef.current?.focus(); }, [editor?.id]);
  useEffect(() => {
    if (focusTarget && !busy && !loading) {
      const control = controls.current.get(focusTarget) || controls.current.get('add');
      if (control && !control.disabled) { control.focus(); setFocusTarget(null); }
    }
  }, [focusTarget, busy, loading, data, editor, deleting]);

  function openEditor(item) {
    setError(''); setMessage('');
    setEditor({ id: item?.id || 'new', title: item?.title || '', initialTitle: item?.title || '' });
  }
  function cancelEditor() {
    setFocusTarget(editor.id === 'new' ? 'add' : `edit-${editor.id}`);
    setEditor(null); setError('');
  }
  function selectDate(next) {
    if (next && next >= '0001-01-01' && next <= localDate()) setDate(next);
  }

  async function mutate(method, id, body) {
    if (mutationActive.current || unavailable) return;
    mutationActive.current = true;
    setBusy(method === 'DELETE' ? 'Deleting…' : 'Saving…'); setError(''); setMessage('');
    const index = data.priorities.findIndex((item) => item.id === id);
    const nextId = data.priorities[index + 1]?.id;
    try {
      const result = await request(`${base}/priorities${id ? `/${id}` : ''}`, {
        method, ...(body ? { body: JSON.stringify(body) } : {})
      });
      if (!mounted.current) return;
      setEditor(null); setDeleting(null);
      setMessage(method === 'DELETE' ? 'Priority deleted.' : 'Saved.');
      setFocusTarget(method === 'DELETE' ? (nextId ? `check-${nextId}` : 'add') : `check-${id || result.priority.id}`);
      // A refresh failure is reported separately from an already successful save.
      await reload();
    } catch (failure) {
      if (!mounted.current) return;
      const uncertain = !failure.status || failure.status >= 500;
      setError(uncertain
        ? 'The request may have succeeded. Refreshing the day; review the list before retrying. Your draft is retained.'
        : failure.message);
      if (uncertain && method === 'DELETE') {
        // A lost response may have deleted the row; do not strand its confirmation.
        setDeleting(null);
        setFocusTarget(nextId ? `check-${nextId}` : 'add');
      }
      if (uncertain || failure.status === 409) await reload();
    } finally {
      mutationActive.current = false;
      if (mounted.current) setBusy('');
    }
  }

  return <section className="profile-content priorities-page">
    <PageHeader eyebrow="Personal / Priorities" title="Daily Priorities" description="Choose up to three things to focus on today." />
    <Surface className="priorities-panel">
      <div className="diet-toolbar">
        <Button icon={ChevronLeft} disabled={dateLocked || date === '0001-01-01'} onClick={() => selectDate(moveCalendarDate(date, -1))}>Previous</Button>
        <FormField label="Priorities date"><input type="date" value={date} min="0001-01-01" max={today} disabled={dateLocked} onChange={(event) => selectDate(event.target.value)} /></FormField>
        <Button disabled={dateLocked} onClick={() => selectDate(localDate())}>Today</Button>
        <Button icon={ChevronRight} disabled={dateLocked || date >= today} onClick={() => selectDate(moveCalendarDate(date, 1))}>Next</Button>
      </div>
      <p role="status" aria-live="polite" aria-atomic="true">
        {busy || (loading ? 'Loading priorities…' : !loadError && data ? `${data.progress.completed} of ${data.progress.total} complete${message ? `. ${message}` : ''}` : message)}
      </p>
      {error && <StatusBanner tone="error" role="alert">{error}</StatusBanner>}
      {loadError && <StatusBanner tone="error" role="alert">{loadError} <Button disabled={Boolean(busy || loading)} onClick={reload}>Retry loading</Button></StatusBanner>}
      {loading && <LoadingState>Loading priorities…</LoadingState>}
      {!loading && !loadError && data && <>
        {data.priorities.length === 0 && <EmptyState icon={ListChecks} title="No priorities for this date." description="Choose up to three." />}
        <ul className="priority-list">
          {data.priorities.map((item) => <li className="priority-row" key={item.id}>
            <div className="priority-row-main">
              <label className="priority-check"><input ref={controlRef(`check-${item.id}`)} type="checkbox" checked={item.completed} disabled={unavailable || Boolean(editor || deleting)} onChange={(event) => mutate('PATCH', item.id, { completed: event.target.checked })} /><span>{item.title}</span></label>
              <div className="diet-toolbar">
                <Button ref={controlRef(`edit-${item.id}`)} icon={Pencil} aria-label={`Edit ${item.title}`} disabled={unavailable || Boolean(editor || deleting)} onClick={() => openEditor(item)}>Edit</Button>
                <Button ref={controlRef(`delete-${item.id}`)} icon={Trash2} variant="danger" aria-label={`Delete ${item.title}`} disabled={unavailable || Boolean(editor || deleting)} onClick={() => { setDeleting(item.id); setError(''); setMessage(''); }}>Delete</Button>
              </div>
            </div>
            {deleting === item.id && <div className="priority-confirm" role="group" aria-label={`Confirm deletion of ${item.title}`}>
              <p>Delete “{item.title}”?</p>
              <div className="diet-toolbar">
                <Button variant="danger" autoFocus disabled={unavailable} onClick={() => mutate('DELETE', item.id)}>Delete</Button>
                <Button disabled={Boolean(busy)} onClick={() => { setDeleting(null); setError(''); setFocusTarget(`delete-${item.id}`); }}>Cancel</Button>
              </div>
            </div>}
          </li>)}
        </ul>
        {full && <p>Three priorities selected. Delete one to add another.</p>}
      </>}
      <Button ref={controlRef('add')} icon={Plus} variant="primary" disabled={unavailable || full || Boolean(editor || deleting)} onClick={() => openEditor(null)}>Add priority</Button>
      {editor && <form className="priority-editor" onSubmit={(event) => {
        event.preventDefault();
        if (!editor.title.trim() || /[\r\n\u2028\u2029]/.test(editor.title)) { setError('Enter a single-line title of 1–120 characters.'); return; }
        mutate(editor.id === 'new' ? 'POST' : 'PATCH', editor.id === 'new' ? null : editor.id, { title: editor.title });
      }}>
        <h2>{editor.id === 'new' ? 'Add priority' : 'Edit priority'}</h2>
        <FormField label="Title"><input ref={inputRef} value={editor.title} required maxLength={120} disabled={Boolean(busy)} onChange={(event) => setEditor({ ...editor, title: event.target.value })} /></FormField>
        <div className="diet-toolbar">
          <Button variant="primary" type="submit" disabled={unavailable || (editor.id === 'new' && full)}>{busy ? 'Saving…' : 'Save'}</Button>
          <Button type="button" disabled={Boolean(busy)} onClick={cancelEditor}>Cancel</Button>
        </div>
      </form>}
    </Surface>
  </section>;
}
