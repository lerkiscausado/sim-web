"use client";

import { Pill } from "lucide-react";
import { CatalogoSimple } from "@/components/catalogos/CatalogoSimple";

export default function Medicamentos() {
    return (
        <CatalogoSimple
            endpoint="/catalogos/medicamentos"
            campo="nombre"
            titulo="Catálogo de Medicamentos"
            descripcion="Gestión y consulta del vademécum institucional."
            singular="Medicamento"
            genero="o"
            textoNuevo="Registra un nuevo medicamento en el catálogo."
            textoEditar="Actualiza el nombre del medicamento."
            icono={Pill}
        />
    );
}
