export interface PermisoDef {
    key: string;
    label: string;
}

export interface CategoriaPermisos {
    titulo: string;
    permisos: PermisoDef[];
}

// Mismo agrupamiento y orden que frmPrivilegios.vb (VB.NET original)
export const CATEGORIAS_PERMISOS: CategoriaPermisos[] = [
    {
        titulo: "Órdenes de Atención",
        permisos: [
            { key: "nuevo", label: "Nuevo" },
            { key: "editar", label: "Editar" },
            { key: "anular", label: "Anular" },
            { key: "consultar", label: "Consultar" },
            { key: "adjuntos", label: "Adjuntos" },
            { key: "agenda", label: "Agenda" },
        ],
    },
    {
        titulo: "Estudios",
        permisos: [
            { key: "historiaClinica", label: "Historia Clínica" },
            { key: "historiasAnteriores", label: "Historias Anteriores" },
            { key: "historiaGrupal", label: "Historia Grupal" },
            { key: "evolucionPaciente", label: "Evolución Paciente" },
            { key: "programacionCirugia", label: "Programación Cirugía" },
            { key: "citologia", label: "Citología" },
            { key: "patologia", label: "Patología" },
            { key: "endoscopia", label: "Endoscopia" },
            { key: "adjuntarImagenes", label: "Adjuntar Imágenes" },
        ],
    },
    {
        titulo: "Contable",
        permisos: [
            { key: "listadoOrdenes", label: "Listado Ordenes" },
            { key: "generarFactura", label: "Generar Factura" },
            { key: "rips", label: "Rips" },
            { key: "inventario", label: "Inventario" },
            { key: "nomina", label: "Nómina" },
        ],
    },
    {
        titulo: "Reportes",
        permisos: [
            { key: "vistaPrevia", label: "Vista Previa" },
            { key: "imprimir", label: "Imprimir" },
            { key: "indicadoresGestion", label: "Indicadores Gestión" },
        ],
    },
    {
        titulo: "Pacientes",
        permisos: [{ key: "usuarios", label: "Usuarios" }],
    },
    {
        titulo: "Contratación",
        permisos: [
            { key: "entidades", label: "Entidades" },
            { key: "subEntidades", label: "SubEntidades" },
            { key: "contratos", label: "Contratos" },
            { key: "tarifas", label: "Tarifas" },
            { key: "detalleTarifas", label: "Detalle Tarifas" },
        ],
    },
    {
        titulo: "Talento Humano",
        permisos: [
            { key: "cargos", label: "Cargos" },
            { key: "especialidades", label: "Especialidades" },
            { key: "empleados", label: "Empleados" },
        ],
    },
    {
        titulo: "Complementos",
        permisos: [
            { key: "examenes", label: "Exámenes" },
            { key: "medicamentos", label: "Medicamentos" },
            { key: "cups", label: "CUPS" },
            { key: "cie10", label: "CIE10" },
            { key: "tipoPatologia", label: "Tipo Patología" },
            { key: "estudiosPredeterminados", label: "Estudios Predeterminados" },
            { key: "equiposApoyo", label: "Equipos Apoyo" },
        ],
    },
    {
        titulo: "Reportes (encabezados)",
        permisos: [
            { key: "encabezadoPiedepagina", label: "Encabezado / Pie de Página" },
            { key: "logo", label: "Logo" },
            { key: "firma", label: "Firma" },
        ],
    },
    {
        titulo: "Sistema",
        permisos: [
            { key: "users", label: "Users" },
            { key: "seguridad", label: "Seguridad" },
            { key: "privilegios", label: "Privilegios" },
        ],
    },
    {
        titulo: "Contenido SIM",
        permisos: [
            { key: "ayudaProducto", label: "Ayuda Producto" },
            { key: "soporteTecnico", label: "Soporte Técnico" },
            { key: "tutoriales", label: "Tutoriales" },
            { key: "acercade", label: "Acerca de" },
        ],
    },
];
