import '@testing-library/jest-dom/vitest'
import { configure } from '@testing-library/react'
import { setCatalog } from '../catalog/catalog'
import { mockCatalog } from '../mocks/data'

// The suite runs many files in parallel: 1 s (the default) is too tight for a slow machine or CI and made
// a few waitFor / findBy* calls fail at random. A passing test is not slower, only a failing one waits longer.
configure({ asyncUtilTimeout: 4000 })

// In the app AppLayout fills the catalog from GET /api/v1/catalog before any page renders. A component
// test mounts a page on its own, so it gets the same rows the fake backend serves.
setCatalog(mockCatalog)

// The texts in the tests are the Spanish ones, the reference language. jsdom says the browser is in English,
// so the saved preference pins Spanish before i18n reads it; a test that needs English switches on purpose.
localStorage.setItem('cuy-monitor.preferences', JSON.stringify({ language: 'es', theme: 'system' }))
