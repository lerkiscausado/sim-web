"use client";

import { TestTube2 } from "lucide-react";
import { CatalogoSimple } from "@/components/catalogos/CatalogoSimple";

export default function Especimenes() {
    return (
        <CatalogoSimple
            endpoint="/atenciones/especimenes"
            campo="nombre"
            titulo="Catálogo de Especímenes"
            descripcion="Tipos de muestra utilizados en órdenes y patología."
            singular="Espécimen"
            genero="o"
            textoNuevo="Registra un nuevo tipo de muestra."
            textoEditar="Actualiza el nombre del espécimen."
            icono={TestTube2}
        />
    );
}
