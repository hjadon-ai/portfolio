import { useEffect, useRef, useState } from 'react'
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, BriefcaseBusiness, Check, ChevronDown, ChevronRight, Download, ExternalLink, FileDown, FileUp, Layers3, Linkedin, Mail, MapPin, Menu, Pencil, Plus, RotateCcw, Save, Search, ShieldCheck, Sparkles, Trash2, TrendingDown, Users, X } from 'lucide-react'
import seed from './data/portfolio.json'
import EditorGate from './EditorGate'
import EngineeringDiagram from './EngineeringDiagram'
import type { Achievement, CaseStudy, Experience, LeadershipItem, PortfolioData, SectionId, SkillGroup, Version } from './types'

const DRAFT_KEY = 'harendra-portfolio-draft-v1'
const VIEW_KEY = 'harendra-portfolio-view-v1'
const LOCAL_EDITOR = import.meta.env.DEV && ['localhost', '127.0.0.1'].includes(window.location.hostname)
const sectionNames: Record<SectionId, string> = { impact: 'Selected impact', experience: 'Experience', work: 'Selected work', leadership: 'Leadership', ai: 'AI-assisted engineering', skills: 'Capabilities', credentials: 'Education & credentials' }
const seedData = seed as PortfolioData

function initialData(): PortfolioData {
  if (!LOCAL_EDITOR) return structuredClone(seedData)
  try {
    const saved = localStorage.getItem(DRAFT_KEY)
    if (saved) {
      const draft = validateData(JSON.parse(saved))
      if (draft.content.profile.website === 'https://harendra-play.web.app') draft.content.profile.website = 'https://astitva-live.web.app/'
      return draft
    }
  } catch { /* Fall back to bundled data. */ }
  return structuredClone(seedData)
}

function validateData(value: unknown): PortfolioData {
  if (!value || typeof value !== 'object') throw new Error('The file is not a portfolio data object.')
  const data = value as PortfolioData
  if (data.schemaVersion !== 1 || !data.content?.profile || !Array.isArray(data.versions)) throw new Error('This file does not match the portfolio format (schema version 1).')
  for (const key of ['achievements', 'experiences', 'caseStudies', 'leadership', 'skillGroups', 'credentials'] as const) {
    if (!Array.isArray(data.content[key])) throw new Error(`Missing ${key} collection.`)
    const ids = data.content[key].map(item => item.id)
    if (ids.some(id => typeof id !== 'string' || !id.trim()) || new Set(ids).size !== ids.length) throw new Error(`Every ${key} entry needs a unique ID.`)
  }
  if (!data.versions.length || data.versions.some(v => !v.id || !v.label || !Array.isArray(v.sectionOrder))) throw new Error('At least one valid version is required.')
  if (new Set(data.versions.map(v => v.id)).size !== data.versions.length) throw new Error('Version IDs must be unique.')
  const references = [
    ['achievementIds', 'achievements'], ['experienceIds', 'experiences'], ['caseStudyIds', 'caseStudies'],
    ['leadershipIds', 'leadership'], ['skillGroupIds', 'skillGroups']
  ] as const
  for (const version of data.versions) {
    if (!version.headline || !version.summary || !Array.isArray(version.visibleSections) || !Array.isArray(version.focus)) throw new Error(`Version ${version.label} is missing required text or sections.`)
    for (const [field, collection] of references) {
      if (!Array.isArray(version[field])) throw new Error(`Version ${version.label} is missing ${field}.`)
      const known = new Set(data.content[collection].map(item => item.id))
      if (version[field].some(id => !known.has(id))) throw new Error(`Version ${version.label} references a missing ${collection} entry.`)
    }
    if (version.featuredCaseStudyId && !data.content.caseStudies.some(c => c.id === version.featuredCaseStudyId)) throw new Error(`Version ${version.label} has a missing featured case study.`)
    if (version.sectionOrder.some(id => !Object.keys(sectionNames).includes(id)) || version.visibleSections.some(id => !version.sectionOrder.includes(id))) throw new Error(`Version ${version.label} has an invalid section order.`)
  }
  return data
}

function ordered<T extends { id: string }>(items: T[], ids: string[]) {
  return ids.map(id => items.find(item => item.id === id)).filter((item): item is T => Boolean(item))
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })
}

function App() {
  const [data, setData] = useState<PortfolioData>(initialData)
  const [versionId, setVersionId] = useState(() => localStorage.getItem(VIEW_KEY) || 'master')
  const [editing, setEditing] = useState(false)
  const [gateOpen, setGateOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [sectionsOpen, setSectionsOpen] = useState(false)
  const roleTrigger = useRef<HTMLButtonElement>(null)
  const sectionsTrigger = useRef<HTMLButtonElement>(null)
  const [selectedCase, setSelectedCase] = useState<string | null>(null)
  const [notice, setNotice] = useState('')
  const [dirty, setDirty] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)
  const version = data.versions.find(v => v.id === versionId) || data.versions[0]

  useEffect(() => { if (LOCAL_EDITOR) localStorage.setItem(DRAFT_KEY, JSON.stringify(data)) }, [data])
  useEffect(() => { localStorage.setItem(VIEW_KEY, version.id) }, [version.id])

  useEffect(() => {
    function dismiss(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      if (menuOpen) { setMenuOpen(false); roleTrigger.current?.focus() }
      if (sectionsOpen) { setSectionsOpen(false); sectionsTrigger.current?.focus() }
    }
    window.addEventListener('keydown', dismiss)
    return () => window.removeEventListener('keydown', dismiss)
  }, [menuOpen, sectionsOpen])

  const navigation = ([['work', 'Work'], ['experience', 'Experience'], ['leadership', 'Leadership'], ['skills', 'Skills']] as const).filter(([id]) => version.visibleSections.includes(id))

  function update(next: PortfolioData) { setData(next); setDirty(true) }
  function mutate(fn: (draft: PortfolioData) => void) { const next = structuredClone(data); fn(next); update(next) }
  function changeVersion(id: string) { setVersionId(id); setMenuOpen(false); setSelectedCase(null); setSectionsOpen(false); roleTrigger.current?.focus(); scrollToTop() }
  function exportJson() {
    const blob = new Blob([JSON.stringify(data, null, 2) + '\n'], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url; link.download = 'portfolio.json'; link.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    setDirty(false); setNotice('Exported portfolio.json. Keep it as your source of truth.')
  }
  async function importJson(file?: File) {
    if (!file) return
    try {
      const imported = validateData(JSON.parse(await file.text()))
      setData(imported); setVersionId(imported.versions[0].id); setDirty(false); setNotice(`Imported ${file.name}.`)
    } catch (error) { setNotice(error instanceof Error ? error.message : 'Could not read this file.') }
    if (fileInput.current) fileInput.current.value = ''
  }

  return <div className="app-shell">
    <a className="skip-link" href="#portfolio-content">Skip to content</a>
    <header className="site-header">
      <div className="header-inner container">
        <button className="brand" onClick={() => { setEditing(false); setGateOpen(false); scrollToTop() }} aria-label="Harendra Kumar, back to top"><span className="brand-mark">H<span>.</span></span><span className="brand-name">Harendra Kumar</span></button>
        <nav className="desktop-nav" aria-label="Main navigation">
          {!editing && !gateOpen && <>{navigation.map(([id, label]) => <a key={id} href={`#${id}`}>{label}</a>)}<a href={data.content.profile.website} target="_blank" rel="noreferrer">Astitva ↗</a></>}
        </nav>
        <div className="header-actions">
          <div className="view-picker"><span className="picker-label">VIEWING AS</span><button ref={roleTrigger} className="view-button" onClick={() => { setMenuOpen(!menuOpen); setSectionsOpen(false) }} aria-expanded={menuOpen} aria-controls="role-choices">{version.label}<ChevronDown size={15}/></button>
            {menuOpen && <div className="view-menu" id="role-choices">{data.versions.map(v => <button key={v.id} className={v.id === version.id ? 'active' : ''} onClick={() => changeVersion(v.id)}><span>{v.label}</span>{v.id === version.id && <Check size={15}/>}</button>)}</div>}
          </div>
          {LOCAL_EDITOR && <button className={`edit-button ${editing || gateOpen ? 'active' : ''}`} onClick={() => { if (editing || gateOpen) { setEditing(false); setGateOpen(false) } else { setGateOpen(true) } setMenuOpen(false); window.scrollTo({ top: 0 }) }}>{editing || gateOpen ? <><ArrowLeft size={15}/> View portfolio</> : <><Pencil size={14}/> Edit content</>}</button>}
          {!editing && !gateOpen && <button ref={sectionsTrigger} className="mobile-menu-button" onClick={() => { setSectionsOpen(!sectionsOpen); setMenuOpen(false) }} aria-label="Section navigation" aria-expanded={sectionsOpen} aria-controls="mobile-sections"><Menu size={22}/></button>}
        </div>
      </div>
      {sectionsOpen && !editing && !gateOpen && <nav id="mobile-sections" className="mobile-sections" aria-label="Section navigation">{navigation.map(([id, label]) => <a key={id} href={`#${id}`} onClick={event => { event.preventDefault(); setSectionsOpen(false); const target = document.getElementById(id); target?.focus({ preventScroll: true }); target?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' }); window.history.replaceState(null, '', `#${id}`) }}>{label}</a>)}<a href={data.content.profile.website} target="_blank" rel="noreferrer">Astitva ↗</a></nav>}
    </header>

    <div id="portfolio-content" tabIndex={-1}>
    {LOCAL_EDITOR && gateOpen ? <EditorGate onUnlock={() => { setGateOpen(false); setEditing(true) }} onCancel={() => setGateOpen(false)}/> : LOCAL_EDITOR && editing ? <Editor data={data} version={version} mutate={mutate} selectVersion={setVersionId} exportJson={exportJson} importClick={() => fileInput.current?.click()} notice={notice} dirty={dirty} reset={() => { if (window.confirm('Replace your browser draft with the bundled resume content? Export first if you need your edits.')) { setData(structuredClone(seedData)); setVersionId('master'); setDirty(false); setNotice('Restored bundled resume content.') } }} /> : <Portfolio data={data} version={version} selectedCase={selectedCase} setSelectedCase={setSelectedCase} />}
    </div>
    {LOCAL_EDITOR && <input ref={fileInput} type="file" accept="application/json,.json" hidden onChange={event => importJson(event.target.files?.[0])}/>}
  </div>
}

function Portfolio({ data, version, selectedCase, setSelectedCase }: { data: PortfolioData; version: Version; selectedCase: string | null; setSelectedCase: (id: string | null) => void }) {
  const { content } = data
  const featured = content.caseStudies.find(c => c.id === version.featuredCaseStudyId)
  const caseStudies = ordered(content.caseStudies, version.caseStudyIds)
  return <main>
    <section className="hero container" id="top">
      <div className="hero-grid">
        <div className="hero-content">
          <div className="eyebrow"><span className="eyebrow-line"/>{version.eyebrow}</div>
          <h1>{version.headline}</h1>
          <p className="hero-summary">{version.summary}</p>
          <div className="hero-actions"><a className="primary-button" href="#work">Explore my work <ArrowRight size={17}/></a><a className="text-button" href={`mailto:${content.profile.email}`}>Get in touch <ArrowRight size={16}/></a></div>
          <div className="hero-meta"><span><MapPin size={15}/>{content.profile.location}</span><span className="meta-divider"/><span>{content.profile.availability}</span></div>
        </div>
        <EngineeringDiagram title="From understanding to review" caption="An illustration of engineering practice." items={['Understand', 'Design', 'Build', 'Review'].map(label => ({ label }))}/>

      </div>
      <div className="focus-strip"><span>FOCUS AREAS</span><div>{version.focus.map(item => <span className="focus-item" key={item}><span className="focus-dot"/>{item}</span>)}</div></div>
    </section>

    {version.sectionOrder.filter(id => version.visibleSections.includes(id)).map((id, sectionIndex) => {
      const sectionNumber = String(sectionIndex + 1).padStart(2, '0')
      if (id === 'impact') return <section className="section impact-section" id="impact" key={id}><div className="container"><SectionHead number={sectionNumber} kicker="A snapshot" title="Impact in focus" intro="A few outcomes and experiences that shape how I work."/><div className="impact-grid">{ordered(content.achievements, version.achievementIds).map((item, index) => <article className="impact-card" key={item.id}><div className="impact-top"><span className="impact-index">0{index + 1}</span><ImpactIcon item={item}/></div><strong className="impact-metric">{item.metric}</strong><h3>{item.title}</h3><p>{item.detail}</p></article>)}</div></div></section>
      if (id === 'work') return <section className="section work-section" id="work" tabIndex={-1} key={id}><div className="container"><SectionHead number={sectionNumber} kicker="Selected work" title="Systems built for the real world" intro="Selected professional projects and independent engineering work."/><div className={`case-list ${caseStudies.length === 4 ? 'case-list-balanced' : ''}`}>{caseStudies.map((item, index) => <article className={`case-card accent-${item.accent}`} key={item.id}><div className="case-number">0{index + 1} <span>/ 0{caseStudies.length}</span></div><div className="case-body"><div className="case-overline">{item.organization}<span>·</span>{item.category}</div><h3>{item.title}</h3><p>{item.description}</p><div className="case-tags">{item.technologies.slice(0, 4).map(t => <span key={t}>{t}</span>)}</div></div><button className="case-open" onClick={() => setSelectedCase(item.id)} aria-label={`Read ${item.title} case study`}><ArrowRight size={20}/></button></article>)}</div>{featured && <div className="work-note"><span className="note-symbol">✳</span><span>Featured perspective: <strong>{featured.title}</strong> — {featured.outcome}</span></div>}</div></section>
      if (id === 'experience') return <section className="section experience-section" id="experience" tabIndex={-1} key={id}><div className="container"><SectionHead number={sectionNumber} kicker="Career journey" title="Experience" intro="From hands-on engineering to architecture and technical leadership."/><div className="timeline">{ordered(content.experiences, version.experienceIds).map((item, index) => <ExperienceRow item={item} key={item.id} index={index}/>)}</div></div></section>
      if (id === 'leadership') return <section className="section leadership-section" id="leadership" tabIndex={-1} key={id}><div className="container leadership-layout"><div><SectionHead number={sectionNumber} kicker="Beyond the architecture" title="Leading through clarity and ownership" intro="Technical direction works best when teams have context, trust, and room to grow."/><div className="leadership-quote">Architecture, delivery, mentoring, and production ownership are connected parts of the work.</div></div><div className="leadership-list">{ordered(content.leadership, version.leadershipIds).map((item, i) => <div className="leadership-item" key={item.id}><span className="leadership-count">0{i + 1}</span><div><h3>{item.title}</h3><p>{item.detail}</p></div><span className="leadership-stat">{item.stat}</span></div>)}</div></div></section>
      if (id === 'ai') return <section className="section ai-section" id="ai" key={id}><div className="container ai-layout"><div><div className="section-kicker"><span>{sectionNumber}</span><span className="kicker-line"/>In practice</div><h2>AI-assisted engineering</h2><h3 className="ai-practice-label">Astitva example</h3><p className="ai-intro">{content.ai.intro}</p><EngineeringDiagram title="People direct the process" caption="Human-directed workflow illustration." items={['Specifications', 'Assisted implementation', 'Human review'].map(label => ({ label }))}/><h3 className="ai-practice-label">General engineering practice</h3><div className="ai-practices">{content.ai.practices.map(item => <div key={item}><Check size={16}/><span>{item}</span></div>)}</div></div></div></section>
      if (id === 'skills') return <section className="section skills-section" id="skills" tabIndex={-1} key={id}><div className="container"><SectionHead number={sectionNumber} kicker="The toolkit" title="Capabilities" intro="The technologies and practices behind the work."/><div className="skills-grid">{ordered(content.skillGroups, version.skillGroupIds).map((group, i) => <div className="skill-group" key={group.id}><div className="skill-group-heading"><span>0{i + 1}</span><h3>{group.title}</h3></div><div className="skill-tags">{group.items.map(item => <span key={item}>{item}</span>)}</div></div>)}</div></div></section>
      if (id === 'credentials') return <section className="section credentials-section" id="credentials" key={id}><div className="container"><SectionHead number={sectionNumber} kicker="Foundation" title="Education & credentials"/><div className="credential-grid">{content.credentials.map(item => <div className="credential-card" key={item.id}><div className="credential-icon"><ShieldCheck size={21}/></div><div><h3>{item.title}</h3><p>{item.institution}</p></div><span>{item.year}</span></div>)}</div></div></section>
      return null
    })}

    <section className="contact-section" id="contact"><div className="container contact-layout"><div><div className="section-kicker light"><span>LET'S CONNECT</span><span className="kicker-line"/>What’s next</div><h2>Have a complex problem<br/>worth solving?</h2><p>I’m open to conversations about architecture, senior engineering, and leadership opportunities.</p><a className="contact-button" href={`mailto:${content.profile.email}`}>Start a conversation <ArrowRight size={18}/></a></div><div className="contact-links"><a href={`mailto:${content.profile.email}`}><Mail size={19}/><span>{content.profile.email}</span><ArrowRight size={18}/></a><a href={content.profile.linkedin} target="_blank" rel="noreferrer"><Linkedin size={19}/><span>LinkedIn profile</span><ExternalLink size={17}/></a><a href={content.profile.website} target="_blank" rel="noreferrer"><ExternalLink size={19}/><span>Astitva website</span><ExternalLink size={17}/></a></div></div></section>
    <footer className="footer"><div className="container"><span>© {new Date().getFullYear()} {content.profile.name}</span><span>Designed for clarity. Built to evolve.</span><a href="#top">Back to top ↑</a></div></footer>
    {selectedCase && <CaseModal item={content.caseStudies.find(c => c.id === selectedCase)} onClose={() => setSelectedCase(null)}/>}
  </main>
}

function SectionHead({ number, kicker, title, intro }: { number: string; kicker: string; title: string; intro?: string }) { return <div className="section-head"><div className="section-kicker"><span>{number}</span><span className="kicker-line"/>{kicker}</div><div className="section-heading-row"><h2>{title}</h2>{intro && <p>{intro}</p>}</div></div> }
function ImpactIcon({ item }: { item: Achievement }) { const Icon = item.icon === 'trend' ? TrendingDown : item.icon === 'people' ? Users : item.icon === 'spark' ? Sparkles : Layers3; return <div className="impact-icon"><Icon size={21} strokeWidth={1.7}/></div> }
function ExperienceRow({ item, index }: { item: Experience; index: number }) {
  const [open, setOpen] = useState(index < 3)
  return <article className={`experience-row ${open ? 'open' : ''}`}><div className="timeline-marker"><span/></div><div className="experience-period">{item.period}</div><div className="experience-main"><button className="experience-toggle" onClick={() => setOpen(!open)} aria-expanded={open}><span><strong>{item.role}</strong><small>{item.company}{item.client ? ` · ${item.client}` : ''}</small></span><ChevronDown size={19}/></button><p className="experience-summary">{item.summary}</p>{open && <div className="experience-details"><ul>{item.bullets.map((b, i) => <li key={i}>{b}</li>)}</ul><div className="experience-tags">{item.skills.map(s => <span key={s}>{s}</span>)}</div></div>}</div></article>
}
function CaseModal({ item, onClose }: { item?: CaseStudy; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog || !item) return
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const previousOverflow = document.body.style.overflow
    dialog.showModal()
    dialog.querySelector<HTMLButtonElement>('.modal-close')?.focus()
    document.body.style.overflow = 'hidden'
    return () => { dialog.close(); document.body.style.overflow = previousOverflow; opener?.focus() }
  }, [item?.id])
  if (!item) return null
  const personal = item.id === 'astitva'
  return <dialog ref={dialogRef} className="case-modal" aria-labelledby="case-title" onKeyDown={event => {
    if (event.key === 'Tab') {
      event.preventDefault()
      const controls = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], [tabindex="0"]') ?? []).filter(control => control.getClientRects().length > 0)
      const current = controls.indexOf(document.activeElement as HTMLElement)
      controls[(current + (event.shiftKey ? -1 : 1) + controls.length) % controls.length]?.focus()
    }
  }} onCancel={event => { event.preventDefault(); onClose() }} onClick={event => {
    if (event.target !== event.currentTarget) return
    const bounds = event.currentTarget.getBoundingClientRect()
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onClose()
  }}><button className="modal-close" onClick={onClose} aria-label="Close" autoFocus><X size={21}/></button><div className="modal-overline">{item.organization} / {item.period}</div><h2 id="case-title">{item.title}</h2><p className="modal-lede">{item.description}</p><div className="modal-block"><span>{personal ? 'PROJECT CONTEXT' : 'THE CHALLENGE'}</span><p>{item.challenge}</p></div>{personal ? <EngineeringDiagram title="Engineering themes" caption="Six themes from this independent personal project." themes items={[
    { label: 'Workspace', detail: item.description },
    { label: 'Finance integration', detail: item.approach[0] },
    { label: 'Daily priorities', detail: item.approach[1] },
    { label: 'Protected chat', detail: item.approach[2] },
    { label: 'Human-directed Codex workflow', detail: item.approach[3] },
    { label: 'Family sharing', detail: item.outcome }
  ]}/> : <><div className="modal-block"><span>THE APPROACH</span><ul>{item.approach.map((point, i) => <li key={i}>{point}</li>)}</ul></div><div className="modal-block outcome"><span>THE OUTCOME</span><p>{item.outcome}</p></div></>}<div className="case-tags">{item.technologies.map(t => <span key={t}>{t}</span>)}</div></dialog>
}

type CollectionName = 'achievements' | 'experiences' | 'caseStudies' | 'leadership' | 'skillGroups' | 'credentials'
const collectionLabels: Record<CollectionName, string> = { achievements: 'Achievements', experiences: 'Experience', caseStudies: 'Case studies', leadership: 'Leadership', skillGroups: 'Skills', credentials: 'Credentials' }
const fieldLabels: Record<string, string> = { id: 'ID', role: 'Role', company: 'Employer', client: 'Client', period: 'Dates', summary: 'Summary', detail: 'Detail', metric: 'Metric', title: 'Title', location: 'Location', organization: 'Organization', category: 'Category', description: 'Description', challenge: 'Challenge', approach: 'Approach', outcome: 'Outcome', technologies: 'Technologies', bullets: 'Highlights', skills: 'Skills', items: 'Items', stat: 'Short label', institution: 'Institution / issuer', year: 'Year / date', accent: 'Accent', icon: 'Icon' }
const defaultEntries: Record<CollectionName, object> = {
  achievements: { id: '', title: '', detail: '', metric: '', icon: 'layers' },
  experiences: { id: '', role: '', company: '', client: '', location: '', period: '', summary: '', bullets: [], skills: [] },
  caseStudies: { id: '', title: '', organization: '', category: '', period: '', description: '', challenge: '', approach: [], outcome: '', technologies: [], accent: 'blue' },
  leadership: { id: '', title: '', detail: '', stat: '' },
  skillGroups: { id: '', title: '', items: [] },
  credentials: { id: '', title: '', institution: '', year: '' }
}

function Editor({ data, version, mutate, selectVersion, exportJson, importClick, notice, dirty, reset }: { data: PortfolioData; version: Version; mutate: (fn: (draft: PortfolioData) => void) => void; selectVersion: (id: string) => void; exportJson: () => void; importClick: () => void; notice: string; dirty: boolean; reset: () => void }) {
  const [tab, setTab] = useState<'overview' | 'versions' | CollectionName | 'ai'>('overview')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const tabs: { id: typeof tab; label: string }[] = [{ id: 'overview', label: 'Profile' }, { id: 'versions', label: 'Role versions' }, ...Object.entries(collectionLabels).map(([id, label]) => ({ id: id as CollectionName, label })), { id: 'ai', label: 'AI practice' }]
  const isCollection = tab in collectionLabels
  const collection = isCollection ? data.content[tab as CollectionName] as { id: string; title?: string; role?: string }[] : []
  const filtered = collection.filter(item => `${item.title || item.role} ${item.id}`.toLowerCase().includes(search.toLowerCase()))
  const selected = collection.find(item => item.id === selectedId) || filtered[0]

  function updateProfile(key: string, value: string) { mutate(d => { (d.content.profile as unknown as Record<string, string>)[key] = value }) }
  function updateEntry(key: string, value: string | string[]) { if (!isCollection || !selected) return; mutate(d => { const item = (d.content[tab as CollectionName] as { id: string }[]).find(i => i.id === selected.id) as unknown as Record<string, unknown>; item[key] = value }) }
  function addEntry() { if (!isCollection) return; const id = `${tab.slice(0, -1)}-${Date.now().toString(36)}`; mutate(d => { (d.content[tab as CollectionName] as object[]).push({ ...structuredClone(defaultEntries[tab as CollectionName]), id }) }); setSelectedId(id) }
  function deleteEntry() { if (!isCollection || !selected || !window.confirm(`Delete this ${collectionLabels[tab as CollectionName].toLowerCase()} entry?`)) return; const id = selected.id; mutate(d => { (d.content[tab as CollectionName] as { id: string }[]) = (d.content[tab as CollectionName] as { id: string }[]).filter(item => item.id !== id); for (const v of d.versions) { for (const field of ['achievementIds', 'experienceIds', 'caseStudyIds', 'leadershipIds', 'skillGroupIds'] as const) v[field] = v[field].filter(entryId => entryId !== id); if (v.featuredCaseStudyId === id) v.featuredCaseStudyId = d.content.caseStudies[0]?.id || '' } }); setSelectedId(null) }
  function versionField(key: keyof Version, value: unknown) { mutate(d => { (d.versions.find(v => v.id === version.id) as unknown as Record<string, unknown>)[key] = value }) }
  function addVersion() { const id = `role-${Date.now().toString(36)}`; mutate(d => { d.versions.push({ ...structuredClone(version), id, label: 'New role view', eyebrow: 'PROFESSIONAL PORTFOLIO' }) }); selectVersion(id) }
  function deleteVersion() { if (version.id === 'master' || !window.confirm(`Delete the ${version.label} view? The master content will remain.`)) return; mutate(d => { d.versions = d.versions.filter(v => v.id !== version.id) }); selectVersion('master') }
  function toggleSection(id: SectionId) { versionField('visibleSections', version.visibleSections.includes(id) ? version.visibleSections.filter(s => s !== id) : [...version.visibleSections, id]) }
  function moveSection(id: SectionId, dir: number) { const next = [...version.sectionOrder]; const i = next.indexOf(id), j = i + dir; if (j < 0 || j >= next.length) return; [next[i], next[j]] = [next[j], next[i]]; versionField('sectionOrder', next) }
  function toggleId(field: 'achievementIds' | 'experienceIds' | 'caseStudyIds' | 'leadershipIds' | 'skillGroupIds', id: string) { versionField(field, version[field].includes(id) ? version[field].filter(x => x !== id) : [...version[field], id]) }
  function moveId(field: 'achievementIds' | 'experienceIds' | 'caseStudyIds' | 'leadershipIds' | 'skillGroupIds', id: string, dir: number) { const list = [...version[field]]; const i = list.indexOf(id), j = i + dir; if (j < 0 || j >= list.length) return; [list[i], list[j]] = [list[j], list[i]]; versionField(field, list) }

  return <main className="editor-page container"><div className="editor-heading"><div><div className="section-kicker"><span>LOCAL WORKSPACE</span><span className="kicker-line"/>Content editor</div><h1>Portfolio studio<span>.</span></h1><p>Update the master content, then shape each role view. Changes are saved as a browser draft until you export the JSON file.</p></div><div className="editor-file-actions"><button onClick={importClick}><FileUp size={16}/> Import JSON</button><button className="primary-button" onClick={exportJson}><Download size={16}/> Export JSON</button></div></div>
    <div className="editor-status"><span className="status-dot"/>{dirty ? 'Browser draft has changes. Export JSON to keep them.' : 'Browser draft saved locally.'}{notice && <strong>{notice}</strong>}</div>
    <div className="editor-layout"><aside className="editor-sidebar"><div className="sidebar-title">CONTENT</div>{tabs.map(t => <button key={t.id} className={tab === t.id ? 'selected' : ''} onClick={() => { setTab(t.id); setSelectedId(null); setSearch('') }}><span>{t.label}</span><ChevronRight size={15}/></button>)}<div className="sidebar-foot"><button onClick={reset}><RotateCcw size={15}/> Restore bundled data</button></div></aside>
      <div className="editor-panel">
        {tab === 'overview' && <><PanelTitle title="Your profile" subtitle="Contact and identity details shared across every view."/><div className="editor-fields two-col">{Object.entries(data.content.profile).map(([key, value]) => <Field key={key} label={key === 'availability' ? 'Availability / interest' : key} value={value} onChange={v => updateProfile(key, v)}/>)}</div></>}
        {tab === 'ai' && <><PanelTitle title="AI-assisted engineering" subtitle="Describe practice accurately, with tools and examples grounded in your experience."/><Field label="Introduction" value={data.content.ai.intro} multiline onChange={v => mutate(d => { d.content.ai.intro = v })}/><Field label="Practices (one per line)" value={data.content.ai.practices.join('\n')} multiline onChange={v => mutate(d => { d.content.ai.practices = v.split('\n').filter(Boolean) })}/></>}
        {tab === 'versions' && <><div className="collection-head"><PanelTitle title={`${version.label} view`} subtitle="Choose a role in the header to edit its presentation. Career facts stay in the master content."/><div className="version-actions"><button className="add-button" onClick={addVersion}><Plus size={16}/> New view</button>{version.id !== 'master' && <button className="add-button delete-version" onClick={deleteVersion}><Trash2 size={15}/> Delete view</button>}</div></div><div className="editor-fields"><Field label="View name" value={version.label} onChange={v => versionField('label', v)}/><Field label="Eyebrow" value={version.eyebrow} onChange={v => versionField('eyebrow', v)}/><Field label="Headline" value={version.headline} onChange={v => versionField('headline', v)}/><Field label="Summary" value={version.summary} multiline onChange={v => versionField('summary', v)}/><Field label="Focus areas (one per line)" value={version.focus.join('\n')} multiline onChange={v => versionField('focus', v.split('\n').filter(Boolean))}/></div><h3 className="editor-subtitle">Section order & visibility</h3><div className="ordering-list">{version.sectionOrder.map(id => <div className="ordering-row" key={id}><label><input type="checkbox" checked={version.visibleSections.includes(id)} onChange={() => toggleSection(id)}/>{sectionNames[id]}</label><div><button onClick={() => moveSection(id, -1)} aria-label={`Move ${sectionNames[id]} up`}><ArrowUp size={15}/></button><button onClick={() => moveSection(id, 1)} aria-label={`Move ${sectionNames[id]} down`}><ArrowDown size={15}/></button></div></div>)}</div>
          <h3 className="editor-subtitle">Visible content & order</h3>{([
            ['achievementIds', data.content.achievements, 'Achievements'], ['caseStudyIds', data.content.caseStudies, 'Case studies'], ['experienceIds', data.content.experiences, 'Experience'], ['leadershipIds', data.content.leadership, 'Leadership'], ['skillGroupIds', data.content.skillGroups, 'Skill groups']
          ] as const).map(([field, items, label]) => <div className="version-group" key={field}><h4>{label}</h4>{[...items].sort((a, b) => { const ai = version[field].indexOf(a.id), bi = version[field].indexOf(b.id); return (ai < 0 ? 999 : ai) - (bi < 0 ? 999 : bi) }).map(item => <div className="ordering-row" key={item.id}><label><input type="checkbox" checked={version[field].includes(item.id)} onChange={() => toggleId(field, item.id)}/>{'role' in item ? item.role : item.title}</label><div><button onClick={() => moveId(field, item.id, -1)} aria-label="Move up"><ArrowUp size={15}/></button><button onClick={() => moveId(field, item.id, 1)} aria-label="Move down"><ArrowDown size={15}/></button></div></div>)}</div>)}<div className="editor-fields"><label className="field"><span>Featured case study</span><select value={version.featuredCaseStudyId} onChange={e => versionField('featuredCaseStudyId', e.target.value)}>{data.content.caseStudies.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}</select></label></div></>}
        {isCollection && <><div className="collection-head"><PanelTitle title={collectionLabels[tab as CollectionName]} subtitle="Edit shared master entries. Role visibility and order are controlled in Role versions."/><button className="add-button" onClick={addEntry}><Plus size={17}/> Add entry</button></div><div className="collection-layout"><div className="entry-list"><div className="search-box"><Search size={16}/><input placeholder="Find an entry" value={search} onChange={e => setSearch(e.target.value)}/></div>{filtered.map(item => <button key={item.id} className={selected?.id === item.id ? 'selected' : ''} onClick={() => setSelectedId(item.id)}><span>{item.title || item.role || item.id}</span><ChevronRight size={15}/></button>)}</div><div className="entry-form">{selected ? <><div className="entry-form-heading"><span>MASTER ENTRY <code>{selected.id}</code></span><button onClick={deleteEntry} title="Delete entry"><Trash2 size={17}/></button></div>{Object.entries(selected).filter(([key]) => key !== 'id').map(([key, value]) => key === 'icon' || key === 'accent' ? <label className="field" key={key}><span>{fieldLabels[key]}</span><select value={String(value)} onChange={e => updateEntry(key, e.target.value)}>{(key === 'icon' ? ['trend', 'layers', 'people', 'spark'] : ['blue', 'green', 'orange']).map(option => <option key={option} value={option}>{option}</option>)}</select></label> : <Field key={`${selected.id}-${key}`} label={fieldLabels[key] || key} value={Array.isArray(value) ? value.join('\n') : String(value ?? '')} multiline={Array.isArray(value) || ['summary', 'description', 'challenge', 'outcome', 'detail'].includes(key)} onChange={v => updateEntry(key, Array.isArray(value) ? v.split('\n').map(s => s.trim()).filter(Boolean) : v)}/>)}<p className="editor-help">List fields use one item per line. Entry IDs stay fixed so version references remain intact.</p></> : <div className="empty-entry">Select an entry or add a new one.</div>}</div></div></>}
      </div></div>
    <div className="editor-bottom"><Save size={16}/> Browser draft updates automatically. <button onClick={exportJson}>Export your source file <ArrowRight size={15}/></button></div>
  </main>
}

function PanelTitle({ title, subtitle }: { title: string; subtitle: string }) { return <div className="panel-title"><h2>{title}</h2><p>{subtitle}</p></div> }
function Field({ label, value, onChange, multiline = false }: { label: string; value: string; onChange: (value: string) => void; multiline?: boolean }) { return <label className="field"><span>{label}</span>{multiline ? <textarea value={value} onChange={e => onChange(e.target.value)} rows={value.length > 150 ? 5 : 3}/> : <input value={value} onChange={e => onChange(e.target.value)}/>}</label> }

export default App
