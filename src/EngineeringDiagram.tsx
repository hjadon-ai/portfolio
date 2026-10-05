import { useEffect, useRef, useState } from 'react'

interface DiagramItem { label: string; detail?: string }

/** A looping illustration: offscreen/hidden time never advances the sequence. */
export default function EngineeringDiagram({ title, caption, items, themes = false }: {
  title: string; caption: string; items: DiagramItem[]; themes?: boolean
}) {
  const figure = useRef<HTMLElement>(null)
  const [reduced, setReduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const [elapsed, setElapsed] = useState(0)
  const [paused, setPaused] = useState(false)
  const [visible, setVisible] = useState(false)
  const [pageVisible, setPageVisible] = useState(!document.hidden)
  const [selected, setSelected] = useState<number | null>(null)
  const active = selected ?? (reduced || elapsed >= 4500 ? null : Math.min(items.length - 1, Math.floor(elapsed / (4500 / items.length))))

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const preference = () => { setReduced(query.matches); setElapsed(0) }
    const visibility = () => setPageVisible(!document.hidden)
    const observer = new IntersectionObserver(entries => setVisible(entries[0].isIntersecting), { threshold: 0.15 })
    if (figure.current) observer.observe(figure.current)
    query.addEventListener('change', preference)
    document.addEventListener('visibilitychange', visibility)
    return () => { observer.disconnect(); query.removeEventListener('change', preference); document.removeEventListener('visibilitychange', visibility) }
  }, [])

  useEffect(() => {
    if (reduced || paused || !visible || !pageVisible) return
    let frame = 0
    let last = performance.now()
    const tick = (now: number) => {
      const delta = Math.min(now - last, 100)
      last = now
      setElapsed(value => (value + delta) % 6000)
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [reduced, paused, visible, pageVisible])

  return <figure ref={figure} className={`engineering-diagram ${themes ? 'diagram-themes' : 'diagram-flow'}`} data-state={reduced ? 'static' : paused ? 'paused' : !visible || !pageVisible ? 'waiting' : 'playing'}>
    <figcaption><h3>{title}</h3><p>{caption}</p></figcaption>
    <ol className="diagram-nodes">{items.map((item, index) => <li key={item.label} className={active === index ? 'diagram-active' : ''}>
      {themes ? <button type="button" aria-pressed={selected === index} onClick={() => { setSelected(selected === index ? null : index); setPaused(true) }}>{item.label}<span className="diagram-marker" aria-hidden="true">•</span></button> : <div className="diagram-node"><span className="diagram-step" aria-hidden="true">{index + 1}</span>{item.label}</div>}
      {!themes && index < items.length - 1 && <svg className="diagram-connector" viewBox="0 0 40 20" aria-hidden="true"><path d="M2 10h32m-7-6 7 6-7 6"/></svg>}
    </li>)}</ol>
    {themes && <div className="diagram-details">{items.map((item, index) => <div key={item.label} className={active === index ? 'diagram-detail highlighted' : 'diagram-detail'}><h4>{item.label}</h4><p>{item.detail}</p></div>)}</div>}

  </figure>
}
