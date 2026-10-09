import '@testing-library/jest-dom/vitest'
import { configure } from '@testing-library/react'

// The suite runs many files in parallel: 1 s (the default) is too tight for a slow machine or CI and made
// a few waitFor / findBy* calls fail at random. A passing test is not slower, only a failing one waits longer.
configure({ asyncUtilTimeout: 4000 })
