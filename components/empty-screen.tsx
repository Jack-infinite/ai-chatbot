// import { UseChatHelpers } from 'ai/react'

// import { Button } from '@/components/ui/button'
import { ExternalLink } from '@/components/external-link'
// import { IconArrowRight } from '@/components/ui/icons'

export function EmptyScreen() {
  return (
    <div className="mx-auto max-w-2xl px-4 mb-4 ">
      <div className="flex flex-col gap-2 rounded-lg border bg-background p-8">
        <h1 className="text-lg font-semibold mb-1">Hello 🤔</h1>
        <h3 className="text-md font-semibold">
          What is the size of your company?
          <p className="leading-normal text-muted-foreground font-normal">
            * This question asks for details about the number of employees or
            the overall scale of your company. How big is your organization?
          </p>
        </h3>

        <h3 className="text-md font-semibold my-2">
          What type of entity are you?
          <p className="leading-normal text-muted-foreground font-normal">
            * This refers to your company's legal structure, such as LLC,
            corporation, sole proprietorship, or partnership. What entity type
            best describes your business?
          </p>
        </h3>

        <h3 className="text-md font-semibold m">
          What size of funding are you seeking?
          <p className="leading-normal text-muted-foreground font-normal">
            * This inquires about the specific amount or range of capital you
            are looking to raise. How much funding are you aiming for?
          </p>
        </h3>

        {/* <p className="leading-normal text-muted-foreground">
          This is an open source AI chatbot app template built with{' '}
          <ExternalLink href="https://nextjs.org">Next.js</ExternalLink>, the{' '}
          <ExternalLink href="https://sdk.vercel.ai">
            Vercel AI SDK
          </ExternalLink>
          , and{' '}
          <ExternalLink href="https://vercel.com/storage/kv">
            Vercel KV
          </ExternalLink>
          .
        </p> */}
      </div>
    </div>
  )
}
