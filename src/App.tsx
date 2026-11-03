import { RouterProvider } from 'react-router/dom'
import { usePreferences } from './preferences/usePreferences'
import { router } from './router'

function App() {
  const { language } = usePreferences()
  // a new key per language draws every page again with the new texts; the router keeps the address
  return <RouterProvider key={language} router={router} />
}

export default App
