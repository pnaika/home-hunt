import { useNavigate } from 'react-router-dom'
import { T } from '../theme.js'
import { Expandable } from '../components/Expandable.jsx'
import { CopyButton } from '../components/CopyButton.jsx'
import { DEEP_DIVE_PROMPT, RECHECK_PROMPT } from '../promptTemplates.js'

function CodeBlock({ text }) {
  return (
    <div style={{
      background: T.navy, borderRadius: 10, padding: '14px 16px',
      fontFamily: "'SF Mono', Menlo, monospace", fontSize: 11.5, color: '#E2E8F0',
      lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
      maxHeight: 380, overflowY: 'auto', marginBottom: 10,
    }}>
      {text}
    </div>
  )
}

function Step({ n, title, children }) {
  return (
    <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
      <div style={{
        width: 26, height: 26, borderRadius: 99, background: T.blueSoft, color: T.blue,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 800, fontSize: 13, flexShrink: 0,
      }}>{n}</div>
      <div style={{ flex: 1, paddingTop: 1 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 4 }}>{title}</div>
        <div style={{ fontSize: 13, color: T.textMid, lineHeight: 1.6 }}>{children}</div>
      </div>
    </div>
  )
}

function FAQ({ q, children }) {
  return (
    <div style={{ marginBottom: 16, paddingBottom: 16, borderBottom: `1px solid ${T.borderLight}` }}>
      <div style={{ fontWeight: 700, fontSize: 13.5, color: T.text, marginBottom: 6 }}>{q}</div>
      <div style={{ fontSize: 13, color: T.textMid, lineHeight: 1.65 }}>{children}</div>
    </div>
  )
}

export function GettingStartedPage() {
  const navigate = useNavigate()

  return (
    <div style={{ minHeight: '100vh', background: T.offWhite }}>
      {/* Sticky nav */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10, background: T.navy,
        padding: '12px 20px', paddingTop: 'max(12px, calc(env(safe-area-inset-top) + 12px))',
        display: 'flex', alignItems: 'center', gap: 12,
        boxShadow: '0 2px 12px rgba(10,22,40,0.3)',
      }}>
        <button onClick={() => navigate('/')} style={{
          background: T.navyMid, border: 'none', color: '#fff', borderRadius: 8,
          padding: '7px 12px', fontWeight: 700, fontSize: 14, cursor: 'pointer', flexShrink: 0,
        }}>← Back</button>
        <div style={{ fontWeight: 700, fontSize: 15, color: '#fff' }}>🚀 Getting Started</div>
      </div>

      {/* Hero */}
      <div style={{ background: T.navy, padding: '24px 20px 28px' }}>
        <div style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 24, color: '#fff', lineHeight: 1.3, marginBottom: 10 }}>
          Bring your own AI
        </div>
        <div style={{ color: T.slateLight, fontSize: 14, lineHeight: 1.6 }}>
          This app stores and organizes property research — it doesn't do the research itself. Use Claude, ChatGPT, Cursor, Gemini, or any AI assistant with web access to run the deep-dive, then paste the result in here.
        </div>
      </div>

      <div style={{ padding: '20px 16px 50px', maxWidth: 640, margin: '0 auto' }}>

        {/* How it works */}
        <div style={{ fontSize: 11, fontWeight: 800, color: T.textSoft, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
          How it works
        </div>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: '16px 16px 4px', marginBottom: 24 }}>
          <Step n="1" title="Copy the deep-dive prompt below">
            It tells the AI exactly what to research and what shape to return the data in.
          </Step>
          <Step n="2" title="Edit the buyer profile section">
            Swap in your own bedroom count, budget, commute addresses, target areas — whatever matters to you.
          </Step>
          <Step n="3" title="Paste it into your AI assistant, with an address">
            Claude, ChatGPT (with browsing), Cursor, Gemini — anything that can search the web works.
          </Step>
          <Step n="4" title="Copy the JSON block it gives you back">
            The AI will output a report to read, plus a JSON object at the end — that JSON is what this app needs.
          </Step>
          <Step n="5" title='Paste it in via "Actions → Add Property"'>
            The app parses it, shows a preview, and you save it. If the AI's JSON shape is slightly off, the app auto-corrects common mistakes — see the FAQ below.
          </Step>
        </div>

        {/* Prompt templates */}
        <div style={{ fontSize: 11, fontWeight: 800, color: T.textSoft, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
          Prompts to copy
        </div>

        <Expandable title="📋 Deep-dive prompt" subtitle="Use this for every new property" defaultOpen>
          <CodeBlock text={DEEP_DIVE_PROMPT} />
          <CopyButton text={DEEP_DIVE_PROMPT} label="Copy prompt" />
        </Expandable>

        <Expandable title="🔁 Recheck prompt" subtitle="Use this periodically to catch price drops">
          <div style={{ fontSize: 13, color: T.textMid, lineHeight: 1.6, marginBottom: 10 }}>
            There's no reliable free API for automated price monitoring (see FAQ), so rechecking is something you trigger manually every week or two. Paste your list of saved addresses and ask your AI to look for changes.
          </div>
          <CodeBlock text={RECHECK_PROMPT} />
          <CopyButton text={RECHECK_PROMPT} label="Copy prompt" />
        </Expandable>

        {/* FAQ */}
        <div style={{ fontSize: 11, fontWeight: 800, color: T.textSoft, textTransform: 'uppercase', letterSpacing: 1, margin: '28px 0 12px' }}>
          FAQ
        </div>

        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: '16px' }}>

          <FAQ q="Why isn't this fully automated? Why do I have to copy-paste?">
            Two separate reasons. First, there's no reliable free API for live Zillow/Redfin data — the
            paid options (RealtyAPI, Apify, etc.) require a managed API key and cap free usage around 250
            requests/month, which didn't seem worth the complexity for a personal tool. Second, even when
            an AI assistant (like Claude) can browse the web on your behalf, it typically runs in a sandboxed
            environment that can't make outbound write requests to arbitrary apps like this one — it can
            research, but it can't save the result anywhere by itself. The copy-paste step is the bridge.
          </FAQ>

          <FAQ q="Can I connect this to ChatGPT / Gemini / Cursor instead of Claude?">
            Yes — the prompt template doesn't depend on a specific AI. Any assistant that can search the
            web and follow formatting instructions will work. The JSON schema is the same regardless of
            which AI produced it.
          </FAQ>

          <FAQ q="What if the AI gives me JSON in a slightly different shape than expected?">
            The app has a built-in normalizer that auto-corrects common mistakes: nested objects get
            flattened to text, arrays-where-strings-were-expected get joined, and common field-name
            variations (like "bedrooms" instead of "beds") get mapped automatically. If it had to fix
            something non-trivial, you'll see a small warning in the preview before you save — review it,
            but it usually doesn't need manual editing.
          </FAQ>

          <FAQ q="Will price tracking happen automatically once a property is saved?">
            No — the app does not poll listings on a schedule. It will show a "🔔 recheck needed" nudge
            after a property hasn't been updated in 14 days, but the actual recheck is something you
            trigger with an AI assistant (see the Recheck prompt above), not something running in the
            background.
          </FAQ>

          <FAQ q="Is my data shared with anyone?">
            No accounts, no third-party access. Data lives in your own Supabase project. The one exception
            is the "Share" feature on a property's detail page, which generates a public read-only link —
            anyone with that specific link can view that one property (handy for sending to a realtor),
            but nothing else is exposed and the link isn't discoverable.
          </FAQ>

          <FAQ q="Can two people use this together?">
            Yes — pick a display name on first use, and you'll see each other's favourites, reactions,
            and comments on properties in real time. There's no login/password; it's meant for a small
            household, not a public multi-tenant product.
          </FAQ>

          <FAQ q="What are the real limitations of this app?">
            No automated tests (verified manually before each change). No pagination — works fine for
            dozens of properties, would need rework at hundreds. Matching on address is exact-string,
            case-insensitive — a typo creates a duplicate rather than updating the existing entry. Listing
            photos from Zillow/Redfin can't be displayed directly (hotlink protection); the app shows a
            map embed instead. The mortgage calculator and monthly cost estimate use a fixed default
            interest rate that you should double-check against current rates. This is a research aid, not
            licensed financial or real estate advice — always verify anything decision-critical with an
            actual agent, lender, or inspector before acting on it.
          </FAQ>

          <FAQ q="Can I use this for a different city or a totally different buying criteria?">
            Yes — nothing in the app itself is hardcoded to a specific location or set of requirements.
            Edit the buyer profile section in the prompt template above to match your own bedroom count,
            budget, school rating threshold, commute anchors, or target cities, and the same workflow
            applies anywhere.
          </FAQ>

        </div>

        <div style={{ fontSize: 11, color: T.slateLight, textAlign: 'center', marginTop: 24, lineHeight: 1.6 }}>
          This app is research tooling, not licensed real estate or financial advice.
        </div>
      </div>
    </div>
  )
}
