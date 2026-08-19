import { redirect } from "next/navigation";

// This file should not exist alongside (dashboard)/page.tsx
// It will never run because (dashboard)/page.tsx owns /
// If there's a conflict, redirecting to /inicio as workaround
export default function RootRedirect() {
  redirect("/inicio");
}
