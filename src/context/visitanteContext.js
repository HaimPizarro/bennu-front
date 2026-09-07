import { createContext, useContext } from 'react'

export const VisitorContext = createContext({
  profile: null,
  authed: false,
  ready: false,
  syncProfile: () => {},
})

export function useVisitor() {
  return useContext(VisitorContext)
}
