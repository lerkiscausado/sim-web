import { AppHeader } from "./AppHeader";
import { Breadcrumbs } from "./Breadcrumbs";

interface AppLayoutProps {
    children: React.ReactNode;
    showBreadcrumbs?: boolean;
}

export function AppLayout({ children, showBreadcrumbs = true }: AppLayoutProps) {
    return (
        <div className="flex min-h-screen flex-col" style={{ background: "var(--surface-canvas)" }}>
            <AppHeader />

            {/* Content area — offset for fixed 56px nav height */}
            <div className="flex flex-1 flex-col" style={{ paddingTop: "var(--nav-height)" }}>
                {showBreadcrumbs && <Breadcrumbs />}
                <main
                    className="flex-1 px-6 py-5 xl:px-8 xl:py-6"
                    style={{ maxWidth: "1600px", width: "100%", marginInline: "auto" }}
                >
                    {children}
                </main>
            </div>
        </div>
    );
}
