import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { errorMessageKey } from '../../api/errorMessages'
import { useAskAssistant } from '../../hooks/useAskAssistant'
import { currentLanguage, t } from '../../i18n'
import {
  ASSISTANT_MAX_MESSAGES,
  ASSISTANT_MAX_TEXT_LENGTH,
  type AssistantMessage,
} from '../../types/Assistant'
import { cx } from '../../utils/cx'
import { Icon } from '../Icon/Icon'
import { Mascot } from '../Mascot/Mascot'
import styles from './AssistantChat.module.css'

const SUGGESTIONS = [
  'assistant.suggestion.observed',
  'assistant.suggestion.alert',
  'assistant.suggestion.register',
]

// "Cuchi", the help assistant: a button over every private page that opens a small chat.
// The conversation lives only here (the backend keeps none) and is gone when the session ends.
export function AssistantChat() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<AssistantMessage[]>([])
  const [draft, setDraft] = useState('')
  const [errorKey, setErrorKey] = useState<string | null>(null)
  const ask = useAskAssistant()
  const titleId = useId()
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const listRef = useRef<HTMLOListElement>(null)
  const toggleRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (open) {
      inputRef.current?.focus()
    }
  }, [open])

  // the newest message always in view
  useEffect(() => {
    const list = listRef.current
    if (list) {
      list.scrollTop = list.scrollHeight
    }
  }, [messages, ask.isPending, errorKey])

  function close() {
    setOpen(false)
    toggleRef.current?.focus()
  }

  function send(text: string) {
    const question = text.trim().slice(0, ASSISTANT_MAX_TEXT_LENGTH)
    if (!question || ask.isPending) {
      return
    }
    const next: AssistantMessage[] = [...messages, { role: 'USER', text: question }]
    setMessages(next)
    setDraft('')
    setErrorKey(null)
    // the greeting is not sent: the conversation starts with the breeder
    ask.mutate(
      { language: currentLanguage(), messages: next.slice(-ASSISTANT_MAX_MESSAGES) },
      {
        onSuccess: ({ reply }) =>
          setMessages((all) => [...all, { role: 'ASSISTANT', text: reply }]),
        onError: (error) => setErrorKey(errorMessageKey(error, 'assistant')),
      },
    )
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    send(draft)
  }

  // Enter sends, Shift+Enter is a new line
  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      send(draft)
    } else if (event.key === 'Escape') {
      close()
    }
  }

  return (
    <div className={styles.root}>
      {open && (
        <section
          className={styles.panel}
          role="dialog"
          aria-labelledby={titleId}
          onKeyDown={(event) => event.key === 'Escape' && close()}
        >
          <header className={styles.header}>
            <Mascot size={40} />
            <div className={styles.heading}>
              <h2 id={titleId} className={styles.title}>
                {t('assistant.title')}
              </h2>
              <p className={styles.subtitle}>{t('assistant.subtitle')}</p>
            </div>
            <button
              type="button"
              className={styles.iconButton}
              onClick={close}
              aria-label={t('assistant.close')}
            >
              <Icon name="x" />
            </button>
          </header>

          <ol ref={listRef} className={styles.messages} aria-live="polite">
            <li className={cx(styles.bubble, styles.assistant)}>{t('assistant.greeting')}</li>
            {messages.map((message, index) => (
              <li
                key={index}
                className={cx(
                  styles.bubble,
                  message.role === 'USER' ? styles.user : styles.assistant,
                )}
              >
                <span className={styles.srOnly}>
                  {t(message.role === 'USER' ? 'assistant.you' : 'assistant.name')}:{' '}
                </span>
                {message.text}
              </li>
            ))}
            {ask.isPending && (
              <li className={cx(styles.bubble, styles.assistant, styles.typing)}>
                {t('assistant.typing')}
              </li>
            )}
            {errorKey && (
              <li className={styles.error} role="alert">
                <Icon name="info" size={16} />
                {t(errorKey)}
              </li>
            )}
          </ol>

          {messages.length === 0 && (
            <div className={styles.suggestions}>
              {SUGGESTIONS.map((key) => (
                <button
                  key={key}
                  type="button"
                  className={styles.chip}
                  onClick={() => send(t(key))}
                >
                  {t(key)}
                </button>
              ))}
            </div>
          )}

          <form className={styles.form} onSubmit={handleSubmit}>
            <label className={styles.srOnly} htmlFor={`${titleId}-input`}>
              {t('assistant.inputLabel')}
            </label>
            <textarea
              id={`${titleId}-input`}
              ref={inputRef}
              className={styles.input}
              rows={1}
              value={draft}
              maxLength={ASSISTANT_MAX_TEXT_LENGTH}
              placeholder={t('assistant.placeholder')}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button
              type="submit"
              className={cx(styles.iconButton, styles.send)}
              disabled={!draft.trim() || ask.isPending}
              aria-label={t('assistant.send')}
            >
              <Icon name="chevron-right" />
            </button>
          </form>
          <p className={styles.disclaimer}>{t('assistant.disclaimer')}</p>
        </section>
      )}

      <button
        ref={toggleRef}
        type="button"
        className={styles.toggle}
        aria-expanded={open}
        aria-label={t(open ? 'assistant.close' : 'assistant.open')}
        onClick={() => (open ? close() : setOpen(true))}
      >
        {open ? <Icon name="x" size={24} /> : <Mascot size={44} />}
      </button>
    </div>
  )
}
