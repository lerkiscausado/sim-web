"use client";

import { GraduationCap } from "lucide-react";
import { CatalogoSimple } from "@/components/catalogos/CatalogoSimple";

export default function Especialidades() {
    return (
        <CatalogoSimple
            endpoint="/catalogos/especialidades"
            campo="nombreEspecialidad"
            titulo="Catálogo de Especialidades"
            descripcion="Gestión de las especialidades médicas del cuerpo asistencial."
            singular="Especialidad"
            genero="a"
            textoNuevo="Registra una nueva especialidad médica."
            textoEditar="Actualiza el nombre de la especialidad."
            icono={GraduationCap}
        />
    );
}
