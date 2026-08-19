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

// Mock data for Entidades (EPS, ARL, etc.)
const mockEntidades = [
    { nit: "800.251.440-6", name: "EPS SANITAS S.A.S.", alias: "SANITAS", regime: "CONTRIBUTIVO", type: "EPS", status: "Activo" },
    { nit: "860.066.942-7", name: "SALUD TOTAL EPS-S S.A.", alias: "SALUD TOTAL", regime: "CONTRIBUTIVO", type: "EPS", status: "Activo" },
    { nit: "805.000.427-1", name: "COOSALUD E.S.S. EPS-S", alias: "COOSALUD", regime: "SUBSIDIADO", type: "EPS", status: "Activo" },
    { nit: "860.011.153-6", name: "SURAMERICANA DE SEGUROS S.A.", alias: "SURA", regime: "CONTRIBUTIVO", type: "EPS/PREPAGO", status: "Activo" },
    { nit: "900.156.264-2", name: "NUEVA EPS S.A.", alias: "NUEVA EPS", regime: "CONTRIBUTIVO/SUBSIDIADO", type: "EPS", status: "Activo" },
    { nit: "800.130.907-4", name: "SEGUROS BOLIVAR S.A.", alias: "BOLIVAR", regime: "PARTICULAR", type: "ARL/SOAT", status: "Activo" },
    { nit: "860.002.183-9", name: "AXA COLPATRIA SEGUROS S.A.", alias: "COLPATRIA", regime: "PARTICULAR", type: "ARL/SOAT", status: "Inactivo" },
];

export default function Entidades() {
    const [searchTerm, setSearchTerm] = useState("");

    const filteredEntidades = mockEntidades.filter(item =>
        item.nit.includes(searchTerm) ||
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.alias.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.type.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Card className="border-none shadow-none bg-transparent">
            <CardHeader className="px-0 pt-0">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <CardTitle className="text-xl font-bold flex items-center gap-2">
                            Catálogo de Entidades
                        </CardTitle>
                        <CardDescription>
                            Gestión de Entidades Promotoras de Salud (EPS), ARL y convenios particulares.
                        </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className="h-9">
                            <Download className="mr-2 h-4 w-4" />
                            Exportar
                        </Button>
                        <Button size="sm" className="h-9">
                            <Plus className="mr-2 h-4 w-4" />
                            Añadir Entidad
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="px-0">
                <div className="mb-6 flex items-center gap-2">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Buscar por NIT, nombre o sigla..."
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
                                <TableHead className="w-[150px] font-bold">NIT</TableHead>
                                <TableHead className="font-bold">Razón Social</TableHead>
                                <TableHead className="w-[120px] font-bold">Sigla</TableHead>
                                <TableHead className="w-[150px] font-bold">Régimen</TableHead>
                                <TableHead className="w-[120px] font-bold">Tipo</TableHead>
                                <TableHead className="w-[100px] font-bold text-center">Estado</TableHead>
                                <TableHead className="w-[80px] text-right font-bold">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredEntidades.length > 0 ? (
                                filteredEntidades.map((entidad) => (
                                    <TableRow key={entidad.nit} className="hover:bg-muted/30 transition-colors">
                                        <TableCell className="font-medium text-primary">
                                            {entidad.nit}
                                        </TableCell>
                                        <TableCell className="max-w-md">
                                            <div className="flex items-center gap-2">
                                                <span className="truncate font-semibold">{entidad.name}</span>
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <button className="text-muted-foreground hover:text-foreground">
                                                                <Info className="h-3.5 w-3.5" />
                                                            </button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p className="max-w-xs">{entidad.name}</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            </div>
                                        </TableCell>
                                        <TableCell>{entidad.alias}</TableCell>
                                        <TableCell>
                                            <span className="text-xs text-muted-foreground font-medium uppercase">
                                                {entidad.regime}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="font-normal border-primary/20 bg-primary/5 text-primary">
                                                {entidad.type}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge
                                                variant={entidad.status === "Activo" ? "default" : "destructive"}
                                                className={`font-medium ${entidad.status === "Activo" ? "bg-green-100 text-green-700 hover:bg-green-100/80 border-green-200" : ""}`}
                                            >
                                                {entidad.status}
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
                                    <TableCell colSpan={7} className="h-24 text-center">
                                        No se encontraron resultados para &ldquo;{searchTerm}&rdquo;
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                <div className="mt-4 flex items-center justify-between px-2">
                    <p className="text-sm text-muted-foreground">
                        Mostrando {filteredEntidades.length} de {mockEntidades.length} registros
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
