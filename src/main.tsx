import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import { RouterProvider, createRouter } from "@tanstack/react-router"
import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query"

import { scan as reactScan } from "react-scan"

import { BProgress } from "@bprogress/core"
import { ProgressProvider } from "@bprogress/react"

// Import the generated route tree
import { routeTree } from "./routeTree.gen"

import "./styles/tailwind.css"
import reportWebVitals from "./reportWebVitals.ts"

// Create a new router instance
const router = createRouter({
  routeTree,
  defaultPreload: "intent",
  scrollRestoration: true,

  defaultStructuralSharing: true,
  defaultPreloadStaleTime: 0,

  defaultViewTransition: {
    types: ({ fromLocation, toLocation }) => {
      let direction = "none"

      if (fromLocation) {
        const fromIndex = fromLocation.state.__TSR_index
        const toIndex = toLocation.state.__TSR_index

        direction = fromIndex <= toIndex ? "toward" : "backward"
      }

      return [`slide-${direction}`]
    },
  },
})

// Register the router instance for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router
  }
}

// Render the app
const rootElement = document.getElementById("app")
if (rootElement && !rootElement.innerHTML) {
  const root = createRoot(rootElement)
  const queryClient = new QueryClient()

  if (import.meta.env.ENABLE_DEVTOOLS) {
    reactScan({ enabled: true })
  }

  root.render(
    <StrictMode>
      <ProgressProvider
        height="2px"
        color="var(--primary)"
        options={{ showSpinner: false }}
      >
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={router} />
        </QueryClientProvider>
      </ProgressProvider>
    </StrictMode>,
  )

  // BProgress
  // Don't show the progress bar on initial page load, seems like the onLoad event doesn't fire in that case
  router.subscribe(
    "onBeforeLoad",
    ({ fromLocation, pathChanged }) =>
      fromLocation && pathChanged && BProgress.start(),
  )
  router.subscribe("onLoad", () => BProgress.done())
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals(console.log)
