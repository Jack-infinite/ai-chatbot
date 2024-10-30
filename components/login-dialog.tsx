'use client'

import * as React from 'react'
import { type DialogProps } from '@radix-ui/react-dialog'
import { toast } from 'sonner'

import * as DialogPrimitive from '@radix-ui/react-dialog'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { IconSpinner } from '@/components/ui/icons'
import { useUser } from '@/lib/hooks/user-provider'

interface LoginDialogProps extends DialogProps {}
const baseURl = 'https://backend-aichat.onrender.com'

export function LoginDialog({ ...props }: LoginDialogProps) {
  const [busy, setBusy] = React.useState(false)
  const { setUser } = useUser()

  const login = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setBusy(true)

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email')

    const response = await fetch(`${baseURl}/api/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        email
      })
    })

    console.log('login response: ', response)

    if (!response.ok) {
      toast.error('Failed to log in')
      setBusy(false)
      return
    }

    const res = await response.json()

    if (res) {
      toast.success('Successfully logged in')
      props.onOpenChange!(false)
      setUser!(res)
    }
    setBusy(false)
  }

  return (
    <Dialog {...props}>
      <DialogContent
        onInteractOutside={e => {
          e.preventDefault()
        }}
      >
        {/* <DialogHeader>
          <DialogTitle>Login</DialogTitle>
        </DialogHeader> */}
        <form onSubmit={login}>
          <div>
            <label
              className="mb-3 block text-xs font-medium text-zinc-400"
              htmlFor="email"
            >
              Email
            </label>
            <div className="relative">
              <input
                className="peer block w-full rounded-md border bg-zinc-50 px-2 py-[9px] text-sm outline-none placeholder:text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950"
                id="email"
                type="email"
                name="email"
                placeholder="Enter your email address"
                required
                disabled={busy}
              />
            </div>
          </div>

          <DialogFooter className="items-center mt-4">
            <Button type="submit" disabled={busy}>
              {busy ? (
                <>
                  <IconSpinner className="mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                <>Log in</>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
