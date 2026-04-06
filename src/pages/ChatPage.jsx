import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Send, Bot, User, Loader, Dumbbell, Flame } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { sendChat, getChatHistory, createThread } from '../api'
import styles from './ChatPage.module.css'

const QUICK_PROMPTS = [
  '2 rotis with dal khayi',
  'Protein in 100g paneer?',
  'Egg white vs whole egg?',
  'Hostel dinner macro estimate',
  'Pre-workout meal suggest karo',
  'Is creatine worth it?',
]

// ─── Markdown renderer ───────────────────────────────
function renderMarkdown(text) {
  if (!text) return []
  const lines = text.split('\n')
  const elements = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]
    const headingMatch = line.match(/^(#{1,3})\s+(.+)/)
    if (headingMatch) {
      const level = headingMatch[1].length
      elements.push(<div key={i} className={styles[`h${level}`]}>{inlineFormat(headingMatch[2])}</div>)
      i++; continue
    }
    if (line.match(/^[-*]\s+/)) {
      const items = []
      while (i < lines.length && lines[i].match(/^[-*]\s+/)) {
        items.push(<li key={i}>{inlineFormat(lines[i].replace(/^[-*]\s+/, ''))}</li>)
        i++
      }
      elements.push(<ul key={`ul-${i}`} className={styles.mdList}>{items}</ul>)
      continue
    }
    if (line.trim() === '') { i++; continue }
    elements.push(<p key={i} className={styles.mdPara}>{inlineFormat(line)}</p>)
    i++
  }
  return elements
}

function inlineFormat(text) {
  const parts = []
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*)/g
  let last = 0, match
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index))
    if (match[0].startsWith('**')) parts.push(<strong key={match.index}>{match[2]}</strong>)
    else parts.push(<em key={match.index}>{match[3]}</em>)
    last = match.index + match[0].length
  }
  if (last < text.length) parts.push(text.slice(last))
  return parts.length > 0 ? parts : text
}

// ─── Sub-components ──────────────────────────────────
function TypingIndicator() {
  return (
    <div className={styles.typingWrap}>
      <div className={styles.botAvatar}><Bot size={14} /></div>
      <div className={styles.typingBubble}>
        <span className={styles.dot} />
        <span className={styles.dot} />
        <span className={styles.dot} />
      </div>
    </div>
  )
}

function Message({ msg }) {
  const isBot = msg.role === 'bot'
  return (
    <div className={`${styles.msgRow} ${isBot ? styles.botRow : styles.userRow} animate-fade-up`}>
      {isBot && <div className={styles.botAvatar}><Bot size={14} /></div>}
      <div className={`${styles.bubble} ${isBot ? styles.botBubble : styles.userBubble}`}>
        {isBot
          ? <div className={styles.mdContent}>{renderMarkdown(msg.content)}</div>
          : msg.content
        }
      </div>
      {!isBot && <div className={styles.userAvatar}><User size={14} /></div>}
    </div>
  )
}

const WELCOME_MSG = (name) => ({
  role: 'bot',
  content: `Bhai ${name || ''} 💪 I'm FitDesi — your personal AI gym bro. Tell me what you ate, ask about macros, fitness myths, supplement advice — sab puchh le. Kya khaya aaj?`
})

// ─── Main Component ──────────────────────────────────
export default function ChatPage() {
  const { user } = useAuth()
  const { threadId } = useParams()
  const navigate = useNavigate()

  const [messages, setMessages]             = useState([])
  const [input, setInput]                   = useState('')
  const [loading, setLoading]               = useState(false)
  const [isFetchingHistory, setIsFetching]  = useState(false)
  const [isCreatingThread, setIsCreating]   = useState(false)

  const bottomRef = useRef(null)
  const inputRef  = useRef(null)

  // ── Auto-create thread if user lands on /chat with no threadId ──
  useEffect(() => {
    if (!threadId && user?.id && !isCreatingThread) {
      setIsCreating(true)
      createThread(String(user.id))
        .then(thread => { setIsCreating(false); navigate(`/chat/${thread.id}`, { replace: true }) })
        .catch(() => {
          // Backend unreachable — show welcome msg, user can still use New Conversation btn
          setMessages([WELCOME_MSG(user?.name)])
          setIsCreating(false)
        })
    }
  }, [threadId, user?.id])

  // ── Load history when threadId changes ──────────────────────────
  useEffect(() => {
    if (!threadId) return

    const loadThread = async () => {
      setIsFetching(true)
      setMessages([]) // clear previous thread's messages immediately
      try {
        const history = await getChatHistory(threadId)
        if (history && history.length > 0) {
          setMessages(history)
        } else {
          setMessages([WELCOME_MSG(user?.name)])
        }
      } catch {
        setMessages([WELCOME_MSG(user?.name)])
      } finally {
        setIsFetching(false)
      }
    }

    loadThread()
  }, [threadId])

  // ── Auto-scroll ─────────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // ── Send message ────────────────────────────────────────────────
  const sendMessage = async (text) => {
    const msg = text || input.trim()
    if (!msg || loading || !threadId) return

    setInput('')
    setMessages(m => [...m, { role: 'user', content: msg }])
    setLoading(true)

    try {
      const data = await sendChat(String(user?.id || 'guest'), threadId, msg)
      setMessages(prev => [...prev, { role: 'bot', content: data.reply }])

      // ✅ FIX: If the backend created a title for this new thread, tell the Sidebar to refresh!
      if (data.thread_title) {
        window.dispatchEvent(new CustomEvent('refreshThreads'))
      }
    } 
    catch {
      setMessages(prev => [...prev, {
        role: 'bot',
        content: "Yaar kuch technical issue aa gaya 😤 Backend check karo, I'll be back!"
      }])
    } finally {
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // Show a full-page spinner while auto-creating a thread on /chat
  if (isCreatingThread) {
    return (
      <div className={styles.page} style={{ alignItems: 'center', justifyContent: 'center' }}>
        <Loader size={28} className={styles.spin} style={{ color: 'var(--accent)' }} />
      </div>
    )
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.headerIcon}><Bot size={18} /></div>
          <div>
            <div className={styles.headerTitle}>FitDesi Gym Bro</div>
            <div className={styles.headerStatus}>
              <span className={styles.statusDot} />
              {isFetchingHistory ? 'Syncing memory...' : 'Online · Ready to roast your diet'}
            </div>
          </div>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.headerStats}>
            <div className={styles.headerStat}>
              <Flame size={14} className={styles.iconAccent} />
              <span>{user?.target_calories || 2000} kcal goal</span>
            </div>
            <div className={styles.headerStat}>
              <Dumbbell size={14} className={styles.iconGreen} />
              <span>{user?.target_protein || 120}g protein</span>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className={styles.messages}>
        {isFetchingHistory ? (
          <div className={styles.loadingHistory}>
            <Loader size={24} className={styles.spin} />
            <p>Bhai history dhoondh raha hoon...</p>
          </div>
        ) : (
          messages.map((msg, i) => <Message key={i} msg={msg} />)
        )}
        {loading && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* Quick prompts — only on fresh threads */}
      {!isFetchingHistory && messages.length <= 1 && (
        <div className={styles.quickPrompts}>
          <div className={styles.quickLabel}>Try asking:</div>
          <div className={styles.promptGrid}>
            {QUICK_PROMPTS.map(p => (
              <button key={p} className={styles.promptChip} onClick={() => sendMessage(p)}>
                {p}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input bar */}
      <div className={styles.inputBar}>
        <div className={styles.inputWrap}>
          <textarea
            ref={inputRef}
            className={styles.textarea}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Kya khaya? Or koi question? (Enter to send)"
            rows={1}
            disabled={!threadId || isFetchingHistory}
          />
          <button
            className={`${styles.sendBtn} ${(input.trim() && !loading && threadId) ? styles.sendActive : ''}`}
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading || !threadId}
          >
            {loading
              ? <Loader size={18} className={styles.spin} />
              : <Send size={18} />
            }
          </button>
        </div>
        <div className={styles.inputHint}>
          Press <kbd>Enter</kbd> to send · <kbd>Shift+Enter</kbd> for new line
        </div>
      </div>
    </div>
  )
}