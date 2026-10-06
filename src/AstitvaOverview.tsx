import { useEffect } from 'react'
import { ArrowLeft, ArrowRight, ExternalLink } from 'lucide-react'
import EngineeringDiagram from './EngineeringDiagram'
import AstitvaArchitecture from './AstitvaArchitecture'
import type { CaseStudy } from './types'

export default function AstitvaOverview({ item, applicationUrl }: { item: CaseStudy; applicationUrl: string }) {
  useEffect(() => {
    const previous = document.title
    document.title = 'Astitva engineering overview — Harendra Kumar'
    return () => { document.title = previous }
  }, [])
  const sections = [
    { id: 'finance', title: 'Financial integration', detail: item.approach[0] },
    { id: 'priorities', title: 'Daily priorities', detail: item.approach[1] },
    { id: 'chat', title: 'Protected live chat', detail: item.approach[2] },
    { id: 'workflow', title: 'Human-directed engineering', detail: item.approach[3] },
    { id: 'family', title: 'Family relationships and sharing', detail: item.outcome }
  ]
  return <div className="app-shell overview-shell">
    <a className="skip-link" href="#overview-content">Skip to content</a>
    <header className="site-header"><nav className="container header-inner" aria-label="Overview navigation">
      <a className="overview-brand" href="/">Harendra Kumar<span> · Portfolio</span></a>
      <a className="text-button" href="/#work"><ArrowLeft size={16}/> Back to work</a>
    </nav></header>
    <main id="overview-content" tabIndex={-1} className="container engineering-overview">
      <div className="overview-heading"><p className="eyebrow">{item.organization} · {item.period}</p><h1>Astitva engineering overview</h1><p className="overview-lede">{item.description}</p></div>
      <aside className="overview-scope" aria-label="Project scope"><strong>Scope of this overview</strong><p>{item.challenge}</p><p>The application link is separate from this portfolio and does not establish that every described capability is currently deployed.</p></aside>
      <AstitvaArchitecture item={item}/>
      <nav className="overview-contents" aria-label="Engineering topics"><strong>Explore the engineering</strong><div>{sections.map(section => <a key={section.id} href={`#${section.id}`}>{section.title}<ArrowRight size={14}/></a>)}</div></nav>
      <div className="overview-topics">{sections.map(section => <section key={section.id} id={section.id} className="overview-topic" tabIndex={-1}><h2>{section.title}</h2><p>{section.detail}</p>{section.id === 'workflow' && <EngineeringDiagram title="People direct the process" caption="Human-directed workflow illustration." items={['Specifications', 'Assisted implementation', 'Human review'].map(label => ({ label }))}/>}</section>)}</div>
      <section className="overview-footer" aria-label="Project links"><div><h2>Project technologies</h2><div className="case-tags">{item.technologies.map(technology => <span key={technology}>{technology}</span>)}</div></div><div className="hero-actions"><a className="primary-button" href="/#work"><ArrowLeft size={16}/> Return to portfolio</a><a className="text-button" href={applicationUrl} target="_blank" rel="noreferrer">Open Astitva application<ExternalLink size={16}/></a></div></section>
    </main>
  </div>
}
