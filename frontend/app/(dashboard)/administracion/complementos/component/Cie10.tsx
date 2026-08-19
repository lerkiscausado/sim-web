"use client";

import { useState } from "react";
import { Search, Info, Plus, Download, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

// Mock data for CIE10
const mockCie10 = [
    { code: "A000", description: "CÓLERA DEBIDO A VIBRIO CHOLERAE O1, BIOTIPO CHOLERAE", category: "Infecciosas", status: "Activo" },
    { code: "B200", description: "ENFERMEDAD POR VIH, RESULTANTE EN INFECCIÓN POR MICOBACTERIAS", category: "Infecciosas", status: "Activo" },
    { code: "E109", description: "DIABETES MELLITUS INSULINODEPENDIENTE SIN COMPLICACIONES", category: "Endocrinas", status: "Activo" },
    { code: "I10X", description: "HIPERTENSIÓN ESSENCIAL (PRIMARIA)", category: "Circulatorio", status: "Activo" },
    { code: "J00X", description: "RINOFARINGITIS AGUDA [RESFRIADO COMÚN]", category: "Respiratorio", status: "Activo" },
    { code: "K297", description: "GASTRITIS, NO ESPECIFICADA", category: "Digestivo", status: "Activo" },
    { code: "U071", description: "COVID-19, VIRUS IDENTIFICADO", category: "Códigos especiales", status: "Activo" },
];

export default function Cie10() {
    const [searchTerm, setSearchTerm] = useState("");

    const filteredCie10 = mockCie10.filter(item =>
        item.code.includes(searchTerm.toUpperCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Card className="border-none shadow-none bg-transparent">
            <CardHeader className="px-0 pt-0">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <CardTitle className="text-xl font-bold flex items-center gap-2">
                            Catálogo CIE10
                        </CardTitle>
                        <CardDescription>
                            Búsqueda y consulta de la Clasificación Internacional de Enfermedades (10ª Versión).
                        </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className="h-9">
                            <Download className="mr-2 h-4 w-4" />
                            Exportar
                        </Button>
                        <Button size="sm" className="h-9">
                            <Plus className="mr-2 h-4 w-4" />
                            Añadir Diagnóstico
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="px-0">
                <div className="mb-6 flex items-center gap-2">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Buscar por código o descripción..."
                            className="pl-9"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button variant="outline" size="icon" className="h-9 w-9">
                        <Filter className="h-4 w-4" />
                    </Button>
                </div>

                <div className="rounded-md border bg-card">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/50">
                                <TableHead className="w-[100px] font-bold">Código</TableHead>
                                <TableHead className="font-bold">Descripción</TableHead>
                                <TableHead className="w-[180px] font-bold">Categoría</TableHead>
                                <TableHead className="w-[100px] font-bold text-center">Estado</TableHead>
                                <TableHead className="w-[80px] text-right font-bold">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredCie10.length > 0 ? (
                                filteredCie10.map((item) => (
                                    <TableRow key={item.code} className="hover:bg-muted/30 transition-colors">
                                        <TableCell className="font-medium text-primary">
                                            {item.code}
                                        </TableCell>
                                        <TableCell className="max-w-md">
                                            <div className="flex items-center gap-2">
                                                <span className="truncate">{item.description}</span>
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <button className="text-muted-foreground hover:text-foreground">
                                                                <Info className="h-3.5 w-3.5" />
                                                            </button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p className="max-w-xs">{item.description}</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" className="font-normal">
                                                {item.category}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge
                                                variant={item.status === "Activo" ? "default" : "destructive"}
                                                className={`font-medium ${item.status === "Activo" ? "bg-green-100 text-green-700 hover:bg-green-100/80 border-green-200" : ""}`}
                                            >
                                                {item.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm" className="h-8 px-2">
                                                Editar
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center">
                                        No se encontraron resultados para &ldquo;{searchTerm}&rdquo;
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                <div className="mt-4 flex items-center justify-between px-2">
                    <p className="text-sm text-muted-foreground">
                        Mostrando {filteredCie10.length} de {mockCie10.length} registros
                    </p>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" disabled>Anterior</Button>
                        <Button variant="outline" size="sm" disabled>Siguiente</Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
