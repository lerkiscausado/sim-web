import * as React from "react";
import * as NavigationMenuPrimitive from "@radix-ui/react-navigation-menu";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const NavigationMenu = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Root>
>(({ className, ...props }, ref) => (
  <NavigationMenuPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex max-w-max flex-1 items-center justify-start",
      className,
    )}
    {...props}
  />
));
NavigationMenu.displayName = NavigationMenuPrimitive.Root.displayName;

const NavigationMenuList = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.List>
>(({ className, ...props }, ref) => (
  <NavigationMenuPrimitive.List
    ref={ref}
    className={cn(
      "flex flex-1 items-center gap-0.5",
      className,
    )}
    {...props}
  />
));
NavigationMenuList.displayName = NavigationMenuPrimitive.List.displayName;

const NavigationMenuItem = NavigationMenuPrimitive.Item;

const NavigationMenuTrigger = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Trigger> & {
    isActive?: boolean;
  }
>(({ className, children, isActive, ...props }, ref) => (
  <NavigationMenuPrimitive.Trigger
    ref={ref}
    className={cn(
      "group inline-flex items-center gap-1.5 rounded px-3 py-2 text-[13px] font-medium whitespace-nowrap transition-colors duration-120",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--nav-surface)]",
      className,
    )}
    style={{
      color: isActive ? "var(--nav-ink-active)" : "var(--nav-ink)",
      background: isActive ? "var(--nav-active)" : "transparent",
    }}
    {...props}
  >
    {children}
    <ChevronDown
      size={12}
      className={cn(
        "ml-0.5 transition-transform duration-150 group-data-[state=open]:rotate-180",
      )}
      style={{ opacity: 0.5 }}
    />
  </NavigationMenuPrimitive.Trigger>
));
NavigationMenuTrigger.displayName = NavigationMenuPrimitive.Trigger.displayName;

const NavigationMenuContent = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Content>
>(({ className, ...props }, ref) => (
  <NavigationMenuPrimitive.Content
    ref={ref}
    className={cn(
      "absolute left-0 top-full z-50 mt-0 min-w-[212px] rounded-b-md rounded-tr-md border py-1 shadow-md",
      className,
    )}
    style={{
      background: "var(--nav-dropdown)",
      borderColor: "var(--border-default)",
      boxShadow: "var(--shadow-overlay)",
    }}
    {...props}
  />
));
NavigationMenuContent.displayName =
  NavigationMenuPrimitive.Content.displayName;

const NavigationMenuLink = NavigationMenuPrimitive.Link;

const NavigationMenuViewport = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.Viewport>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Viewport>
>(({ className, ...props }, ref) => (
  <NavigationMenuPrimitive.Viewport
    ref={ref}
    className={cn(
      "absolute left-0 top-full z-50 mt-0 w-full origin-top overflow-hidden rounded-b-md border bg-[var(--nav-dropdown)] shadow-md data-[state=closed]:scale-y-0 data-[state=open]:scale-y-100 data-[state=closed]:animate-out data-[state=open]:animate-in",
      "data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95",
      className,
    )}
    style={{
      borderColor: "var(--border-default)",
      boxShadow: "var(--shadow-overlay)",
    }}
    {...props}
  />
));
NavigationMenuViewport.displayName =
  NavigationMenuPrimitive.Viewport.displayName;

const navigationMenuTriggerStyle = ({
  isActive,
}: {
  isActive?: boolean;
} = {}) =>
  cn(
    "inline-flex items-center gap-1.5 rounded px-3 py-2 text-[13px] font-medium whitespace-nowrap transition-colors duration-120",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--nav-surface)]",
    isActive
      ? "text-[var(--nav-ink-active)] bg-[var(--nav-active)]"
      : "text-[var(--nav-ink)] hover:bg-[var(--nav-hover)]",
  );

const NavigationMenuIndicator = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.Indicator>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Indicator>
>(({ className, ...props }, ref) => (
  <NavigationMenuPrimitive.Indicator
    ref={ref}
    className={cn(
      "top-full z-50 flex h-[2px] items-center justify-center overflow-hidden",
      className,
    )}
    {...props}
  >
    <div
      className="h-[2px] w-8 rounded-full"
      style={{ background: "var(--nav-indicator)" }}
    />
  </NavigationMenuPrimitive.Indicator>
));
NavigationMenuIndicator.displayName =
  NavigationMenuPrimitive.Indicator.displayName;

export {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuTrigger,
  NavigationMenuContent,
  NavigationMenuLink,
  NavigationMenuViewport,
  NavigationMenuIndicator,
  navigationMenuTriggerStyle,
};

