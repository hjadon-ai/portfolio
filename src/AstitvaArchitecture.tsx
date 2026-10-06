import { useEffect, useRef, useState } from 'react'
import { Code2, Database, Flame, GitBranch, Github, Layers, LockKeyhole, Server, Workflow } from 'lucide-react'
import type { CaseStudy } from './types'

/** Associations illustrate scope; they do not assert runtime or deployment routes. */
export default function AstitvaArchitecture({ item }: { item: CaseStudy }) {
  const root = useRef<HTMLElement>(null)
  const [selected, setSelected] = useState<number | null>(null)
  const [running, setRunning] = useState(false)
  const [reduced, setReduced] = useState(false)
  const concerns = [
    { label: 'Finance integration', icon: Database, href: '#finance', details: [item.approach[0]] },
    { label: 'Protected live chat', icon: LockKeyhole, href: '#chat', details: [item.approach[2]] },
    { label: 'Ownership & sharing', icon: Layers, href: '#family', details: [item.approach[1], item.outcome] }
  ]
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    let visible = false
    const update = () => { setReduced(query.matches); setRunning(visible && !document.hidden && !query.matches) }
    const observer = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; update() }, { threshold: 0.15 })
    if (root.current) observer.observe(root.current)
    query.addEventListener('change', update)
    document.addEventListener('visibilitychange', update)
    update()
    return () => { observer.disconnect(); query.removeEventListener('change', update); document.removeEventListener('visibilitychange', update) }
  }, [])
  return <section ref={root} className="astitva-architecture" aria-labelledby="architecture-title" data-running={running} data-reduced={reduced}>
    <header className="architecture-heading"><span className="architecture-kicker">System perspective</span><h2 id="architecture-title">Architecture at a glance</h2><p>Conceptual architecture illustration of the recorded project scope; not a live system or deployment view.</p></header>
    <div className="architecture-stage">
      <div className="architecture-stack"><span className="architecture-label">Workspace technologies</span><div className="architecture-technologies">
        {[{ label: 'React', icon: Code2 }, { label: 'Express', icon: Server }, { label: 'MongoDB', icon: Database }, { label: 'Firebase', icon: Flame }].map(({ label, icon: Icon }) => <div key={label} className="architecture-technology"><Icon size={21} aria-hidden="true"/><span>{label}</span></div>)}
      </div></div>
      <svg className="architecture-associations" viewBox="0 0 800 66" preserveAspectRatio="none" aria-hidden="true"><path d="M400 0V24H133V66M400 24V66M400 24H667V66"/><path className="architecture-trace" d="M400 0V24H133V66M400 24V66M400 24H667V66"/></svg>
      <div className="architecture-concerns">{concerns.map(({ label, icon: Icon }, index) => <button key={label} type="button" className={`architecture-concern architecture-concern-${index}`} aria-pressed={selected === index} onClick={() => setSelected(selected === index ? null : index)} aria-controls="architecture-details"><span className="architecture-concern-icon"><Icon size={24} aria-hidden="true"/></span><strong>{label}</strong><span className="architecture-concern-marker" aria-hidden="true">{selected === index ? 'Selected' : 'Explore'}</span>{index === 1 && <span className="architecture-service">Firestore · Firebase custom tokens</span>}</button>)}</div>
      <div className="architecture-delivery"><span className="architecture-label">Hosting & delivery references</span><div>{[{ label: 'Firebase', icon: Flame }, { label: 'Render', icon: Server }, { label: 'GitHub', icon: Github }, { label: 'GitHub Actions', icon: GitBranch }].map(({ label, icon: Icon }) => <span key={label}><Icon size={16} aria-hidden="true"/>{label}</span>)}</div><p>Provider labels shown for context; deployment status and pipeline connections are not represented.</p></div>
    </div>
    <div id="architecture-details" className="architecture-details">{concerns.map(({ label, details, href }, index) => <article key={label} className={selected === index ? 'architecture-detail selected' : 'architecture-detail'}><h3>{label}</h3>{details.map(detail => <p key={detail}>{detail}</p>)}<a href={href}>Explore this topic <span aria-hidden="true">↗</span></a></article>)}</div>
    <div className="architecture-human"><Workflow size={22} aria-hidden="true"/><div><h3>Human-directed engineering</h3><p>{item.approach[3]}</p></div></div>
  </section>
}
