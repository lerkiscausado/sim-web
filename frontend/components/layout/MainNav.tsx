"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { navConfig, type NavItem } from "@/lib/nav-config";
import { cn } from "@/lib/utils";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function NavDropdown({ item }: { item: NavItem }) {
    const pathname = usePathname();
    const isActive = item.children?.some((child) =>
        child.href ? pathname.startsWith(child.href) : false
    );
    const Icon = item.icon;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    className={cn(
                        "group inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-[13px] font-medium whitespace-nowrap",
                        "hover:bg-accent hover:text-accent-foreground",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                        isActive
                            ? "text-[var(--nav-ink-active)] bg-[var(--nav-active)]"
                            : "text-[var(--nav-ink)]",
                    )}
                >
                    {Icon && <Icon size={14} strokeWidth={1.75} />}
                    {item.label}
                    <ChevronDown
                        size={12}
                        className="ml-0.5 opacity-50 group-data-[state=open]:rotate-180"
                    />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align="start"
                sideOffset={6}
                className={cn(
                    (item.children?.length ?? 0) > 3
                        ? "w-[480px] p-2"
                        : "w-[320px] p-2",
                )}
            >
                <DropdownMenuLabel className="px-2 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {item.label}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup
                    className={cn(
                        (item.children?.length ?? 0) > 3
                            ? "grid grid-cols-2 gap-0.5"
                            : "flex flex-col gap-0.5",
                    )}
                >
                    {item.children?.map((child) => {
                        const childActive = child.href
                            ? pathname.startsWith(child.href)
                            : false;
                        const ChildIcon = child.icon;
                        return (
                            <DropdownMenuItem key={child.href} asChild>
                                <Link
                                    href={child.href ?? "#"}
                                    className={cn(
                                        "flex items-start gap-3 rounded-md p-2.5 cursor-pointer",
                                        childActive && "bg-[var(--clinical-50)]",
                                    )}
                                >
                                    {ChildIcon && (
                                        <span
                                            className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
                                            style={{
                                                background: childActive
                                                    ? "var(--clinical-600)"
                                                    : "var(--clinical-100)",
                                                color: childActive
                                                    ? "#fff"
                                                    : "var(--clinical-600)",
                                            }}
                                        >
                                            <ChildIcon size={14} strokeWidth={1.75} />
                                        </span>
                                    )}
                                    <div className="flex flex-col gap-1 min-w-0">
                                        <span
                                            className="text-sm leading-none font-medium"
                                            style={{
                                                color: childActive
                                                    ? "var(--clinical-600)"
                                                    : "var(--ink-primary)",
                                            }}
                                        >
                                            {child.label}
                                        </span>
                                        {child.description && (
                                            <span className="line-clamp-2 text-xs leading-snug text-muted-foreground">
                                                {child.description}
                                            </span>
                                        )}
                                    </div>
                                </Link>
                            </DropdownMenuItem>
                        );
                    })}
                </DropdownMenuGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

function NavLink({ item }: { item: NavItem }) {
    const pathname = usePathname();
    const isActive =
        item.href === "/inicio"
            ? pathname === "/inicio"
            : item.href
                ? pathname.startsWith(item.href)
                : false;
    const Icon = item.icon;

    return (
        <Link
            href={item.href ?? "#"}
            className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-[13px] font-medium whitespace-nowrap",
                "hover:bg-accent hover:text-accent-foreground",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                isActive
                    ? "text-[var(--nav-ink-active)] bg-[var(--nav-active)]"
                    : "text-[var(--nav-ink)]",
            )}
        >
            {Icon && <Icon size={14} strokeWidth={1.75} />}
            {item.label}
        </Link>
    );
}

export function MainNav() {
    return (
        <nav
            aria-label="Menú principal"
            className="flex items-center gap-0.5"
        >
            {navConfig.map((item) =>
                item.children ? (
                    <NavDropdown key={item.label} item={item} />
                ) : (
                    <NavLink key={item.label} item={item} />
                ),
            )}
        </nav>
    );
}
