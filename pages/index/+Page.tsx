import { useEffect } from 'react'
import { navigate } from 'vike/client/router'

export default function IndexPage() {
  useEffect(() => {
    navigate('/dashboard')
  }, [])

  return null
}
