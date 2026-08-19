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

// Mock data for Medicamentos
const mockMedicamentos = [
    { code: "MED001", name: "ACETAMINOFÉN", concentration: "500 mg", form: "Tableta", category: "Analgésico", status: "Activo" },
    { code: "MED002", name: "IBUPROFENO", concentration: "400 mg", form: "Tableta", category: "AINE", status: "Activo" },
    { code: "MED003", name: "AMOXICILINA", concentration: "500 mg", form: "Cápsula", category: "Antibiótico", status: "Activo" },
    { code: "MED004", name: "LOSARTÁN POTÁSICO", concentration: "50 mg", form: "Tableta", category: "Antihipertensivo", status: "Activo" },
    { code: "MED005", name: "METFORMINA CLORHIDRATO", concentration: "850 mg", form: "Tableta", category: "Antidiabético", status: "Activo" },
    { code: "MED006", name: "OMEPRAZOL", concentration: "20 mg", form: "Cápsula", category: "Antiulceroso", status: "Activo" },
    { code: "MED007", name: "SALBUTAMOL", concentration: "100 mcg", form: "Inhalador", category: "Broncodilatador", status: "Activo" },
];

export default function Medicamentos() {
    const [searchTerm, setSearchTerm] = useState("");

    const filteredMedicamentos = mockMedicamentos.filter(item =>
        item.code.includes(searchTerm.toUpperCase()) ||
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Card className="border-none shadow-none bg-transparent">
            <CardHeader className="px-0 pt-0">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <CardTitle className="text-xl font-bold flex items-center gap-2">
                            Catálogo de Medicamentos
                        </CardTitle>
                        <CardDescription>
                            Gestión y consulta del vademécum farmacéutico institucional.
                        </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className="h-9">
                            <Download className="mr-2 h-4 w-4" />
                            Exportar
                        </Button>
                        <Button size="sm" className="h-9">
                            <Plus className="mr-2 h-4 w-4" />
                            Añadir Medicamento
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="px-0">
                <div className="mb-6 flex items-center gap-2">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Buscar por nombre, código o categoría..."
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
                                <TableHead className="font-bold">Nombre Generico</TableHead>
                                <TableHead className="w-[120px] font-bold">Concentración</TableHead>
                                <TableHead className="w-[120px] font-bold">Forma</TableHead>
                                <TableHead className="w-[150px] font-bold">Categoría</TableHead>
                                <TableHead className="w-[100px] font-bold text-center">Estado</TableHead>
                                <TableHead className="w-[80px] text-right font-bold">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredMedicamentos.length > 0 ? (
                                filteredMedicamentos.map((item) => (
                                    <TableRow key={item.code} className="hover:bg-muted/30 transition-colors">
                                        <TableCell className="font-medium text-primary">
                                            {item.code}
                                        </TableCell>
                                        <TableCell className="max-w-md">
                                            <div className="flex items-center gap-2">
                                                <span className="truncate font-semibold">{item.name}</span>
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <button className="text-muted-foreground hover:text-foreground">
                                                                <Info className="h-3.5 w-3.5" />
                                                            </button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p className="max-w-xs">{item.name} - {item.concentration}</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            </div>
                                        </TableCell>
                                        <TableCell>{item.concentration}</TableCell>
                                        <TableCell>{item.form}</TableCell>
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
                        Mostrando {filteredMedicamentos.length} de {mockMedicamentos.length} registros
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
