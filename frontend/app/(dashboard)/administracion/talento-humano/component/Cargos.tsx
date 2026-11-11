"use client";

import { Briefcase } from "lucide-react";
import { CatalogoSimple } from "@/components/catalogos/CatalogoSimple";

export default function Cargos() {
    return (
        <CatalogoSimple
            endpoint="/catalogos/cargos"
            campo="nombreCargo"
            titulo="Cargos"
            descripcion="Gestión de los cargos del personal."
            singular="Cargo"
            genero="o"
            textoNuevo="Registra un nuevo cargo del personal."
            textoEditar="Actualiza el nombre del cargo."
            icono={Briefcase}
        />
    );
}
