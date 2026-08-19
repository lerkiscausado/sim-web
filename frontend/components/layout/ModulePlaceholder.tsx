interface ModulePlaceholderProps {
    title: string;
    description: string;
    module: string;
}

export function ModulePlaceholder({ title, description, module }: ModulePlaceholderProps) {
    return (
        <div className="space-y-5">
            {/* Page header */}
            <div
                className="rounded-lg border px-6 py-5"
                style={{
                    background: "var(--surface-raised)",
                    borderColor: "var(--border-default)",
                }}
            >
                <span
                    className="label-clinical mb-2 inline-block"
                    style={{ color: "var(--ink-brand)" }}
                >
                    {module}
                </span>
                <h1 style={{ color: "var(--ink-primary)" }}>{title}</h1>
                <p className="mt-1.5 text-[13px]" style={{ color: "var(--ink-secondary)" }}>
                    {description}
                </p>
            </div>


        </div>
    );
}
