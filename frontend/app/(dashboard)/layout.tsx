"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/lib/auth";

// The (dashboard) route group owns / in Next.js route groups.
// Since app/page.tsx also exists (legacy), we use /inicio as the dashboard home.
export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.replace("/login");
        }
    }, [loading, user, router]);

    if (loading || !user) {
        return null;
    }

    return <AppLayout>{children}</AppLayout>;
}
