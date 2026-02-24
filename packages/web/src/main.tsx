import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import { ClerkProvider } from "@clerk/clerk-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      retry: 1,
    },
  },
});

const DEV_PUBLISHABLE_KEY =
  "pk_test_am9pbnQtbGxhbWEtNDguY2xlcmsuYWNjb3VudHMuZGV2JA";

const publishableKey =
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY ||
  (window.location.hostname === "localhost" ? DEV_PUBLISHABLE_KEY : undefined);

if (!publishableKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY environment variable");
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ClerkProvider
          publishableKey={publishableKey}
          appearance={{
            variables: {
              colorPrimary: "#1B6B6D",
              colorBackground: "#F8F6F1",
              fontFamily: "Inter, sans-serif",
            },
          }}
        >
          <App />
        </ClerkProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
