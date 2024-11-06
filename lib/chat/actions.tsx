import 'server-only'
import jsonData from './faq.json'
const { GoogleGenerativeAI } = require('@google/generative-ai')

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

import {
  createAI,
  createStreamableUI,
  getMutableAIState,
  getAIState,
  streamUI,
  createStreamableValue
} from 'ai/rsc'
import { openai } from '@ai-sdk/openai'

import {
  spinner,
  BotCard,
  BotMessage,
  SystemMessage,
  Stock,
  Purchase
} from '@/components/stocks'

import { z } from 'zod'
import { EventsSkeleton } from '@/components/stocks/events-skeleton'
import { Events } from '@/components/stocks/events'
import { StocksSkeleton } from '@/components/stocks/stocks-skeleton'
import { Stocks } from '@/components/stocks/stocks'
import { StockSkeleton } from '@/components/stocks/stock-skeleton'
import {
  formatNumber,
  runAsyncFnWithoutBlocking,
  sleep,
  nanoid
} from '@/lib/utils'
import { saveChat } from '@/app/actions'
import { SpinnerMessage, UserMessage } from '@/components/stocks/message'
import { Chat, Message } from '@/lib/types'
import { auth } from '@/auth'
import { generateText } from 'ai'

const firebaseURL =
  'https://firestore.googleapis.com/v1/projects/chat-gpt-5a5dc/databases/(default)/documents/aichatbot/faq'

async function confirmPurchase(symbol: string, price: number, amount: number) {
  'use server'

  const aiState = getMutableAIState<typeof AI>()

  const purchasing = createStreamableUI(
    <div className="inline-flex items-start gap-1 md:items-center">
      {spinner}
      <p className="mb-2">
        Purchasing {amount} ${symbol}...
      </p>
    </div>
  )

  const systemMessage = createStreamableUI(null)

  runAsyncFnWithoutBlocking(async () => {
    await sleep(1000)

    purchasing.update(
      <div className="inline-flex items-start gap-1 md:items-center">
        {spinner}
        <p className="mb-2">
          Purchasing {amount} ${symbol}... working on it...
        </p>
      </div>
    )

    await sleep(1000)

    purchasing.done(
      <div>
        <p className="mb-2">
          You have successfully purchased {amount} ${symbol}. Total cost:{' '}
          {formatNumber(amount * price)}
        </p>
      </div>
    )

    systemMessage.done(
      <SystemMessage>
        You have purchased {amount} shares of {symbol} at ${price}. Total cost ={' '}
        {formatNumber(amount * price)}.
      </SystemMessage>
    )

    aiState.done({
      ...aiState.get(),
      messages: [
        ...aiState.get().messages,
        {
          id: nanoid(),
          role: 'system',
          content: `[User has purchased ${amount} shares of ${symbol} at ${price}. Total cost = ${
            amount * price
          }]`
        }
      ]
    })
  })

  return {
    purchasingUI: purchasing.value,
    newMessage: {
      id: nanoid(),
      display: systemMessage.value
    }
  }
}

async function submitUserMessage(
  content: string,
  toJson: boolean = false,
  userId?: string,
  answer?: string
) {
  'use server'

  if (toJson) {
    // console.log('to json', content)
    // let txt = ''
    // let jsonResult

    // try {
    //   const { text } = await generateText({
    //     model: openai('gpt-4-turbo'),
    //     system:
    //       'You are json converter chatbot, you can convert text to json and help users with json related queries',
    //     prompt: `Convert the following text to JSON format, ensuring that all field names are lowercase and any spaces are replaced by underscores: ${content}`
    //   })
    //   const v = text.replaceAll('```json', '').replaceAll('```', '')
    //   jsonResult = JSON.parse(v)
    // } catch (error) {
    //   console.log('error: ----- ', error)
    //   jsonResult = { text: txt }
    // }
    await fetch('https://backend-aicThat.onrender.com/api/faq', {
      method: 'POST',
      body: JSON.stringify({
        create_at: Date.now(),
        content: content,
        answer: answer || 'no_answer',
        user_id: userId || 'no_user'
      }),
      headers: {
        'Content-type': 'application/json; charset=UTF-8'
      }
    })
      .then(async response => {
        const res = await response.json()
        console.log('res===', res)
      })
      .catch(error => console.error('Error:', error))

    return {
      id: nanoid(),
      display: '', // Pretty print JSON
      content,
      role: 'user'
    }
  }

  const aiState = getMutableAIState<typeof AI>()
  aiState.update({
    ...aiState.get(),
    messages: [
      ...aiState.get().messages,
      {
        id: nanoid(),
        role: 'user',
        content
      }
    ]
  })
  let textStream: undefined | ReturnType<typeof createStreamableValue<string>>
  let textNode: undefined | React.ReactNode

  const prompt = content || 'Does this look store-bought or homemade?'

  const generationConfig = {
    temperature: 2,
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 8192,
    responseMimeType: 'text/plain'
  }
  // console.log('jsonData: ', jsonData[0])

  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
  const result = await model.generateContent({
    contents: [
      {
        role: 'user',
        parts: [
          ...jsonData,
          ...aiState.get().messages.map((message: any) => ({
            text: `${message.role === 'assistant' ? 'output' : 'input'}: ${message.content}`
          }))
          // {
          //   text: `input: ${content}`
          // }
        ]
      }
    ],
    generationConfig
  })
  aiState.done({
    ...aiState.get(),
    messages: [
      ...aiState.get().messages,
      {
        id: nanoid(),
        role: 'assistant',
        content: result.response.text()
      }
    ]
  })

  // const result = await model.generateContent([prompt])

  // const result = await model.generateContent([prompt])

  // const result = await streamUI({
  //   model: openai('gpt-4o'),
  //   initial: <SpinnerMessage />,

  //   system:
  //     "You are an AI life coach who assists customers by answering their questions from an FAQ, offering comprehensive answers while maintaining a supportive and conversational tone. You aim to reassure, guide, and provide comprehensive, empathetic responses.\n\nProvide a full answer to each customer’s question and offer additional context with a life-coach perspective. Anticipate potential follow-up concerns or questions, and aim to create a complete and satisfying answer that leaves the customer informed and comfortable.\n\nIf the customer seems uncertain or if the initial question is vague, use follow-up questions that clarify their concerns or help them to think about their situation comprehensively. Help them to unlock their thoughts and guide them kindly.\n\n# Key Objectives\n\n- **Complete, Engaging Responses**: Address each question thoroughly, ensuring customers feel informed and reassured.\n- **Empathetic and Conversational Tone**: Respond as a life coach, which means offering expertise while displaying warmth, empathy, and positivity. Create a supportive conversational flow, encouraging them along the way.\n- **Anticipate and Clarify**: Predict possible follow-up concerns, leaving minimal room for confusion. Engage with clarifying questions if the user's input is vague.\n\n# Steps\n\n1. **Understand the Customer’s Question**: Carefully review the question and determine whether it can be answered directly, or if more depth or context is helpful.\n2. **Provide a Direct Answer with Empathy**: Answer the main question first, delivering empathy and certainty. Refrain from jargon and be easily understandable.\n3. **Expand the Answer Holistically**: Provide any background information, context, or value-adding commentary to ensure the customer feels well-equipped. Empower them to understand the answer in broader terms.\n4. **Engage with Gentle Inquiries**: Ask clarifying or reflective questions to keep the conversation productive. Use them to show understanding of their situation.\n5. **Preemptive Insight**: Address possible follow-up needs that you anticipate from the given question. Guide the customer beyond what they directly asked.\n\n# Output Format\n\n- **Direct Answer**: Initially provide a concise answer, formulated with warmth and understanding.\n- **Expanded Response**: Elaborate on the answer from a wider perspective, providing practical and emotional support.\n- **Follow-Up Question/Prompt**: Offer an additional supportive question that invites the customer to think deeper or ensures their complete understanding.\n\n# Output Example\n\n**Customer Question**: \"How do I feel more confident when speaking in public?\"\n\n**Model Response**:\n1. **Direct Answer**: To feel more confident while speaking in public, it's important to prepare well and practice beforehand. Focus on steady breathing and keeping your thoughts organized.\n2. **Expanded Response**: Confidence grows over time, and every public speaking experience you have will get easier. Imagine how successful the outcome will be; visualization can be very powerful. Try practicing in front of smaller audiences first, building up slowly. Remember, nerves are perfectly normal, and often mean you care about doing well, which is already a good thing.\n3. **Follow-Up Question**: Would you like some tips on managing stage fright, or perhaps activities that help you find your voice in a more relaxed setting?\n\n# Notes\n\n- Always use an empathetic tone to ensure the customer's comfort in opening up.\n- Avoid abrupt transitions; maintain a smooth conversational flow between the direct answer, elaboration, and follow-ups.\n- Questions to customers should make them feel understood, not interrogated.",
  //   // 'You must ask questions to get started. What is the size of your company? and What type of entity are you? and What size of funding are you seeking? ',
  //   messages: [
  //     ...aiState.get().messages.map((message: any) => ({
  //       role: message.role,
  //       content: message.content,
  //       name: message.name
  //     }))
  //   ],
  //   text: ({ content, done, delta }) => {
  //     if (!textStream) {
  //       textStream = createStreamableValue('')
  //       textNode = <BotMessage content={textStream.value} />
  //     }

  //     if (done) {
  //       textStream.done()
  //       aiState.done({
  //         ...aiState.get(),
  //         messages: [
  //           ...aiState.get().messages,
  //           {
  //             id: nanoid(),
  //             role: 'assistant',
  //             content
  //           }
  //         ]
  //       })
  //     } else {
  //       textStream.update(delta)
  //     }

  //     return textNode
  //   }
  // })
  textNode = <p style={{ whiteSpace: 'pre-line' }}>{result.response.text()}</p>

  return {
    id: nanoid(),
    display: textNode
  }
}

export type AIState = {
  chatId: string
  messages: Message[]
}

export type UIState = {
  id: string
  display: React.ReactNode
}[]

export const AI = createAI<AIState, UIState>({
  actions: {
    submitUserMessage,
    confirmPurchase
  },
  initialUIState: [],
  initialAIState: { chatId: nanoid(), messages: [] },
  onGetUIState: async () => {
    'use server'

    const session = await auth()

    if (session && session.user) {
      const aiState = getAIState() as Chat

      if (aiState) {
        const uiState = getUIStateFromAIState(aiState)
        return uiState
      }
    } else {
      return
    }
  },
  onSetAIState: async ({ state }) => {
    'use server'

    const session = await auth()

    if (session && session.user) {
      const { chatId, messages } = state

      const createdAt = new Date()
      const userId = session.user.id as string
      const path = `/chat/${chatId}`

      const firstMessageContent = messages[0].content as string
      const title = firstMessageContent.substring(0, 100)

      const chat: Chat = {
        id: chatId,
        title,
        userId,
        createdAt,
        messages,
        path
      }

      await saveChat(chat)
    } else {
      return
    }
  }
})

export const getUIStateFromAIState = (aiState: Chat) => {
  return aiState.messages
    .filter(message => message.role !== 'system')
    .map((message, index) => ({
      id: `${aiState.chatId}-${index}`,
      display:
        message.role === 'tool' ? (
          message.content.map(tool => {
            return tool.toolName === 'listStocks' ? (
              <BotCard>
                {/* TODO: Infer types based on the tool result*/}
                {/* @ts-expect-error */}
                <Stocks props={tool.result} />
              </BotCard>
            ) : tool.toolName === 'showStockPrice' ? (
              <BotCard>
                {/* @ts-expect-error */}
                <Stock props={tool.result} />
              </BotCard>
            ) : tool.toolName === 'showStockPurchase' ? (
              <BotCard>
                {/* @ts-expect-error */}
                <Purchase props={tool.result} />
              </BotCard>
            ) : tool.toolName === 'getEvents' ? (
              <BotCard>
                {/* @ts-expect-error */}
                <Events props={tool.result} />
              </BotCard>
            ) : null
          })
        ) : message.role === 'user' ? (
          <UserMessage>{message.content as string}</UserMessage>
        ) : message.role === 'assistant' &&
          typeof message.content === 'string' ? (
          <BotMessage content={message.content} />
        ) : null
    }))
}
