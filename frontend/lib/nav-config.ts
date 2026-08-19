import {
    Home,
    ClipboardList,
    Stethoscope,
    Building2,
    Settings,
    HelpCircle,
    FileSignature,
    CalendarDays,
    BarChart2,
    FlaskConical,
    Microscope,
    Pipette,
    Users,
    Receipt,
    FileText,
    Layout,
    Puzzle,
    BarChart,
    UserCog,
    LifeBuoy,
    BookOpen,
    Info,
    type LucideIcon,
} from "lucide-react";

export interface NavItem {
    label: string;
    href?: string;
    icon?: LucideIcon;
    description?: string;
    children?: NavItem[];
}

export const navConfig: NavItem[] = [
    {
        label: "Inicio",
        href: "/inicio",
        icon: Home,
    },
    {
        label: "Admisiones",
        icon: ClipboardList,
        children: [
            { label: "Consentimiento Informado", href: "/admisiones/consentimiento", icon: FileSignature, description: "Gestión y firma de consentimientos informados de pacientes." },
            { label: "Agenda", href: "/admisiones/agenda", icon: CalendarDays, description: "Programación y seguimiento de citas médicas." },
            { label: "Reportes", href: "/admisiones/reportes", icon: BarChart2, description: "Informes y estadísticas del módulo de admisiones." },
        ],
    },
    {
        label: "Atenciones",
        icon: Stethoscope,
        children: [
            { label: "Citologías", href: "/atenciones/citologias", icon: FlaskConical, description: "Registro y resultados de estudios citológicos." },
            { label: "Patologías", href: "/atenciones/patologias", icon: Microscope, description: "Análisis y diagnósticos de muestras patológicas." },
            { label: "Toma de Muestra", href: "/atenciones/toma-muestra", icon: Pipette, description: "Control de recolección y procesamiento de muestras." },
        ],
    },
    {
        label: "Administración",
        icon: Building2,
        children: [
            { label: "Pacientes", href: "/administracion/pacientes", icon: Users, description: "Directorio y expedientes de los pacientes registrados." },
            { label: "Facturación", href: "/administracion/facturacion", icon: Receipt, description: "Generación y gestión de facturas y cobros." },
            { label: "Contratos", href: "/administracion/contratos", icon: FileText, description: "Administración de contratos con entidades y aseguradoras." },
            { label: "Plantillas", href: "/administracion/plantillas", icon: Layout, description: "Diseño y gestión de plantillas de documentos." },
            { label: "Complementos", href: "/administracion/complementos", icon: Puzzle, description: "Módulos y extensiones adicionales del sistema." },
        ],
    },
    {
        label: "Configuración",
        icon: Settings,
        children: [
            { label: "Reportes", href: "/configuracion/reportes", icon: BarChart, description: "Personalización de reportes y dashboards." },
            { label: "Usuarios de Sistema", href: "/configuracion/usuarios", icon: UserCog, description: "Gestión de usuarios, roles y permisos de acceso." },
        ],
    },
    {
        label: "Ayuda",
        icon: HelpCircle,
        children: [
            { label: "Soporte Técnico", href: "/ayuda/soporte", icon: LifeBuoy, description: "Contacto con el equipo de soporte y tickets abiertos." },
            { label: "Tutoriales", href: "/ayuda/tutoriales", icon: BookOpen, description: "Guías paso a paso para utilizar el sistema." },
            { label: "Acerca de", href: "/ayuda/acerca", icon: Info, description: "Información sobre la versión y licencia del sistema." },
        ],
    },
];


export const breadcrumbLabels: Record<string, string> = {
    "": "Inicio",
    inicio: "Inicio",
    admisiones: "Admisiones",
    consentimiento: "Consentimiento Informado",
    agenda: "Agenda",
    reportes: "Reportes",
    atenciones: "Atenciones",
    citologias: "Citologías",
    patologias: "Patologías",
    "toma-muestra": "Toma de Muestra",
    administracion: "Administración",
    pacientes: "Pacientes",
    facturacion: "Facturación",
    contratos: "Contratos",
    plantillas: "Plantillas",
    complementos: "Complementos",
    configuracion: "Configuración",
    usuarios: "Usuarios de Sistema",
    ayuda: "Ayuda",
    soporte: "Soporte Técnico",
    tutoriales: "Tutoriales",
    acerca: "Acerca de",
};
