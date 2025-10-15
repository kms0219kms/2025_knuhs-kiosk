import { Fragment } from "react"

import { Outlet, createRootRoute } from "@tanstack/react-router"
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools"

import { ReactQueryDevtools } from "@tanstack/react-query-devtools"

import { ThemeProvider } from "@/components/theme-provider"

export const Route = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
  return (
    <Fragment>
      <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
        <Outlet />

        {import.meta.env.ENABLE_DEVTOOLS && (
          <>
            <TanStackRouterDevtools />
            <ReactQueryDevtools />
          </>
        )}
      </ThemeProvider>
    </Fragment>
  )
}
