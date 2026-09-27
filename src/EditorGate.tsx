import { useState, type FormEvent } from 'react'
import { ArrowLeft, ArrowRight, LockKeyhole } from 'lucide-react'
import { hasLocalPassphrase, setLocalPassphrase, verifyLocalPassphrase } from './editorAccess'

export default function EditorGate({ onUnlock, onCancel }: { onUnlock: () => void; onCancel: () => void }) {
  const [registered, setRegistered] = useState(hasLocalPassphrase)
  const [passphrase, setPassphrase] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    if (!registered && passphrase.length < 12) { setError('Use at least 12 characters.'); return }
    if (!registered && passphrase !== confirmation) { setError('The passphrases do not match.'); return }
    setBusy(true)
    try {
      if (registered) {
        const valid = await verifyLocalPassphrase(passphrase)
        if (!valid) { setError('Incorrect passphrase.'); return }
      } else {
        await setLocalPassphrase(passphrase)
        setRegistered(true)
      }
      setPassphrase('')
      setConfirmation('')
      onUnlock()
    } catch {
      setError('The local editor could not be unlocked. Check browser storage and try again.')
    } finally {
      setBusy(false)
    }
  }

  return <main className="gate-page container">
    <div className="gate-card">
      <div className="gate-icon"><LockKeyhole size={25}/></div>
      <div className="section-kicker"><span>LOCAL EDITOR</span><span className="kicker-line"/>Access</div>
      <h1>{registered ? 'Unlock your editor.' : 'Set an editor passphrase.'}</h1>
      <p>{registered ? 'Enter the passphrase you set in this browser to edit portfolio content.' : 'Choose a passphrase for this browser. It will not be placed in the project files or public site.'}</p>
      <form onSubmit={submit} autoComplete="off">
        <label className="field"><span>Passphrase</span><input type="password" value={passphrase} onChange={event => setPassphrase(event.target.value)} autoComplete="off" required autoFocus/></label>
        {!registered && <label className="field"><span>Confirm passphrase</span><input type="password" value={confirmation} onChange={event => setConfirmation(event.target.value)} autoComplete="off" required/></label>}
        {error && <p className="gate-error" role="alert">{error}</p>}
        <button className="primary-button" disabled={busy} type="submit">{busy ? 'Checking…' : registered ? 'Unlock editor' : 'Set passphrase'} <ArrowRight size={16}/></button>
      </form>
      <button className="gate-back" onClick={onCancel}><ArrowLeft size={15}/> Back to portfolio</button>
      <p className="gate-note">This is a local convenience lock. Browser developer tools and files on this computer remain accessible to someone with local access.</p>
    </div>
  </main>
}
