import { AppLayout } from "@/components/layout/AppLayout";

// The (dashboard) route group owns / in Next.js route groups.
// Since app/page.tsx also exists (legacy), we use /inicio as the dashboard home.
export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <AppLayout>{children}</AppLayout>;
}
