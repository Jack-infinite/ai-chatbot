'use client'

import * as React from 'react'
import Textarea from 'react-textarea-autosize'

import { useActions, useAIState, useUIState } from 'ai/rsc'

import { UserMessage } from './stocks/message'
import { type AI } from '@/lib/chat/actions'
import { Button } from '@/components/ui/button'
import { IconArrowElbow, IconPlus } from '@/components/ui/icons'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip'
import { useEnterSubmit } from '@/lib/hooks/use-enter-submit'
import { nanoid } from 'nanoid'
import { useRouter } from 'next/navigation'
import { useUser } from '@/lib/hooks/user-provider'

const questionsText = `

I asked 3 question: 
1. What is the size of your company?
This question asks for details about the number of employees or the overall scale of your company. How big is your organization?

2. What type of entity are you?
This refers to your company's legal structure, such as LLC, corporation, sole proprietorship, or partnership. What entity type best describes your business?

3. What size of funding are you seeking?
This inquires about the specific amount or range of capital you are looking to raise. How much funding are you aiming for?

and answer that "{answer}"

Please generate the main idea, and for each question, give a rating between 1 and 10. Additionally, explain why you gave that rating
`

export function PromptForm({
  input,
  setInput
}: {
  input: string
  setInput: (value: string) => void
}) {
  const [answers, setAnswers] = React.useState<string>('')
  const router = useRouter()
  const { userId } = useUser()
  const { formRef, onKeyDown } = useEnterSubmit()
  const inputRef = React.useRef<HTMLTextAreaElement>(null)
  const { submitUserMessage } = useActions()
  const [messages, setMessages] = useUIState<typeof AI>()

  const [aiState] = useAIState()

  React.useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  React.useEffect(() => {
    const m = aiState.messages
    if (m.length > 0) {
      // console.log('aiState: ', m)
      submitUserMessage(m[m.length - 1].content, true, userId, answers)
    }
  }, [aiState.messages])

  return (
    <form
      ref={formRef}
      onSubmit={async (e: any) => {
        e.preventDefault()

        // Blur focus on mobile
        if (window.innerWidth < 600) {
          e.target['message']?.blur()
        }

        const value = input.trim()
        setInput('')

        if (!value) return

        setAnswers(value)
        // Optimistically add user message UI
        setMessages(currentMessages => [
          ...currentMessages,
          {
            id: nanoid(),
            userID: userId,
            display: <UserMessage>{value}</UserMessage>
          }
        ])

        // if (messages.length === 0) {
        //   value = questionsText.replace('{answer}', value)
        // }

        // Submit and get response message
        const responseMessage = await submitUserMessage(value)
        setMessages(currentMessages => [...currentMessages, responseMessage])
      }}
    >
      <div className="relative flex max-h-60 w-full grow flex-col overflow-hidden bg-background px-8 sm:rounded-md sm:border sm:px-12">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="absolute left-0 top-[14px] size-8 rounded-full bg-background p-0 sm:left-4"
              onClick={() => {
                router.push('/new')
              }}
            >
              <IconPlus />
              <span className="sr-only">New Chat</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>New Chat</TooltipContent>
        </Tooltip>
        <Textarea
          ref={inputRef}
          tabIndex={0}
          onKeyDown={onKeyDown}
          placeholder="Send a message."
          className="min-h-[60px] w-full resize-none bg-transparent px-4 py-[1.3rem] focus-within:outline-none sm:text-sm"
          autoFocus
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          name="message"
          rows={1}
          value={input}
          onChange={e => setInput(e.target.value)}
        />
        <div className="absolute right-0 top-[13px] sm:right-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button type="submit" size="icon" disabled={input === ''}>
                <IconArrowElbow />
                <span className="sr-only">Send message</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Send message</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </form>
  )
}
