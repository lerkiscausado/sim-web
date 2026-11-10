"use client";

import { useEffect, useRef } from "react";
import DOMPurify from "dompurify";
import { Bold, Italic, Underline, List, ListOrdered, RemoveFormatting, AlignLeft, AlignJustify, AlignCenter } from "lucide-react";
import { cn } from "@/lib/utils";

interface RichTextEditorProps {
    value: string;
    onChange: (html: string) => void;
    placeholder?: string;
    rows?: number;
    className?: string;
}

const ALLOWED_TAGS = [
    "p", "br", "b", "strong", "i", "em", "u", "ul", "ol", "li", "span", "div", "sup", "sub",
];

/**
 * Propiedades CSS que se conservan. El texto de los informes guardado desde el
 * VB.NET (RichEditControl de DevExpress) usa estilos en línea para negrita,
 * justificado, sangrías y fuente; si se quitaran, al editar un informe viejo
 * se perdería su formato y el PDF ya no se vería igual.
 */
const ESTILOS_PERMITIDOS = new Set([
    "font-weight", "font-style", "text-decoration", "text-align", "font-size", "font-family", "color",
    "margin", "margin-top", "margin-bottom", "margin-left", "margin-right", "text-indent",
]);

function filtrarEstilo(style: string): string {
    return style
        .split(";")
        .map((d) => d.trim())
        .filter((d) => {
            const i = d.indexOf(":");
            if (i <= 0) return false;
            const prop = d.slice(0, i).trim().toLowerCase();
            const valor = d.slice(i + 1).toLowerCase();
            return ESTILOS_PERMITIDOS.has(prop) && !/url\(|expression|javascript:/.test(valor);
        })
        .join(";");
}

let hookInstalado = false;
function instalarHook() {
    if (hookInstalado || typeof window === "undefined") return;
    DOMPurify.addHook("uponSanitizeAttribute", (_node, data) => {
        if (data.attrName === "style") {
            data.attrValue = filtrarEstilo(data.attrValue);
            if (!data.attrValue) data.keepAttr = false;
        }
    });
    hookInstalado = true;
}

export function sanitizeHtml(html: string): string {
    instalarHook();
    // Se quedan solo el <body> del HTML que exporta DevExpress (<html><head><style>…)
    return DOMPurify.sanitize(html, { ALLOWED_TAGS, ALLOWED_ATTR: ["style", "start"] });
}

/** Convierte HTML a texto plano legible (para PDF u otros contextos sin render HTML). */
export function htmlToPlainText(html: string): string {
    if (typeof window === "undefined") {
        return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    }
    const div = document.createElement("div");
    div.innerHTML = sanitizeHtml(html);
    return (div.textContent || div.innerText || "").trim();
}

function exec(command: string) {
    document.execCommand(command, false);
}

export function RichTextEditor({ value, onChange, placeholder, rows = 4, className }: RichTextEditorProps) {
    const ref = useRef<HTMLDivElement>(null);
    const isFocused = useRef(false);

    // Sincroniza el HTML externo -> DOM solo cuando el usuario no está escribiendo,
    // para no pelear con el cursor mientras edita.
    useEffect(() => {
        if (ref.current && !isFocused.current && ref.current.innerHTML !== value) {
            ref.current.innerHTML = value || "";
        }
    }, [value]);

    function handleInput() {
        if (ref.current) {
            onChange(sanitizeHtml(ref.current.innerHTML));
        }
    }

    const minHeight = `${rows * 1.5}rem`;

    return (
        <div className={cn("rounded-md border overflow-hidden", className)}>
            <div className="flex items-center gap-0.5 border-b bg-muted/40 px-1.5 py-1">
                <ToolbarButton icon={Bold} label="Negrita" onClick={() => exec("bold")} />
                <ToolbarButton icon={Italic} label="Cursiva" onClick={() => exec("italic")} />
                <ToolbarButton icon={Underline} label="Subrayado" onClick={() => exec("underline")} />
                <span className="mx-1 h-4 w-px bg-border" />
                <ToolbarButton icon={List} label="Lista" onClick={() => exec("insertUnorderedList")} />
                <ToolbarButton icon={ListOrdered} label="Lista numerada" onClick={() => exec("insertOrderedList")} />
                <span className="mx-1 h-4 w-px bg-border" />
                <ToolbarButton icon={AlignLeft} label="Alinear a la izquierda" onClick={() => exec("justifyLeft")} />
                <ToolbarButton icon={AlignCenter} label="Centrar" onClick={() => exec("justifyCenter")} />
                <ToolbarButton icon={AlignJustify} label="Justificar" onClick={() => exec("justifyFull")} />
                <span className="mx-1 h-4 w-px bg-border" />
                <ToolbarButton icon={RemoveFormatting} label="Limpiar formato" onClick={() => exec("removeFormat")} />
            </div>
            <div
                ref={ref}
                contentEditable
                suppressContentEditableWarning
                data-placeholder={placeholder}
                className="prose-sm max-w-none px-3 py-2 text-sm outline-none empty:before:text-muted-foreground empty:before:content-[attr(data-placeholder)]"
                style={{ minHeight }}
                onFocus={() => (isFocused.current = true)}
                onBlur={() => (isFocused.current = false)}
                onInput={handleInput}
            />
        </div>
    );
}

function ToolbarButton({
    icon: Icon,
    label,
    onClick,
}: {
    icon: React.ComponentType<{ size?: number }>;
    label: string;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            title={label}
            aria-label={label}
            // onMouseDown + preventDefault para no perder la selección de texto
            // antes de que execCommand pueda aplicarse.
            onMouseDown={(e) => {
                e.preventDefault();
                onClick();
            }}
            className="flex h-7 w-7 items-center justify-center rounded hover:bg-muted"
        >
            <Icon size={14} />
        </button>
    );
}
