'use client'

import * as React from 'react'
import { nanoid } from 'nanoid'

const LOCAL_STORAGE_USER_ID = 'user_id'

interface UserContext {
  userId: string
}

const UserContext = React.createContext<UserContext>({ userId: '' })

interface UserProviderProps {
  children: React.ReactNode
}

export function UserProvider({ children }: UserProviderProps) {
  const [userId, setUserId] = React.useState('')

  React.useEffect(() => {
    const uId = localStorage.getItem(LOCAL_STORAGE_USER_ID)
    if (uId) {
      setUserId(uId)
    } else {
      const newuId = nanoid()
      localStorage.setItem(LOCAL_STORAGE_USER_ID, newuId)
      setUserId(newuId)
    }
  }, [userId])

  return (
    <UserContext.Provider value={{ userId }}>{children}</UserContext.Provider>
  )
}

export function useUser() {
  const context = React.useContext(UserContext)
  if (!context) {
    throw new Error('useUserContext must be used within a UserProvider')
  }
  return context
}
