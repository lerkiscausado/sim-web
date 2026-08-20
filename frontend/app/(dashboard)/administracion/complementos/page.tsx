import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Stethoscope, Pill, Building2, GraduationCap, TestTube } from "lucide-react";
import { ModulePlaceholder } from "@/components/layout/ModulePlaceholder";
import { Separator } from "@/components/ui/separator";
import Cups from "./component/Cups";
import Cie10 from "./component/Cie10";
import Medicamentos from "./component/Medicamentos";
import Entidades from "./component/Entidades";
import Especialidades from "./component/Especialidades";
import Especimenes from "./component/Especimenes";

export default function ComplementosPage() {
    return (
        <>
            <div className="flex flex-col gap-6 pb-6">
                <ModulePlaceholder
                    module="Administración"
                    title="Complementos"
                    description="Gestión de complementos: CUPS, CIE10, Medicamentos, Entidades, Especialidades y Especímenes."
                />
            </div>
            <Separator />
            <div className="flex flex-col gap-6 pt-6">
                <Tabs defaultValue="cups" className="w-full">
                    <TabsList className="flex w-fit items-center justify-start gap-1 bg-muted/50 p-1 border rounded-xl overflow-x-auto">
                        <TabsTrigger value="cups" className="flex items-center gap-2 px-6 py-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200">
                            <Activity className="h-4 w-4" />
                            <span className="font-medium">CUPS</span>
                        </TabsTrigger>
                        <TabsTrigger value="cie10" className="flex items-center gap-2 px-6 py-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200">
                            <Stethoscope className="h-4 w-4" />
                            <span className="font-medium">CIE10</span>
                        </TabsTrigger>
                        <TabsTrigger value="medicamentos" className="flex items-center gap-2 px-6 py-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200">
                            <Pill className="h-4 w-4" />
                            <span className="font-medium">Medicamentos</span>
                        </TabsTrigger>
                        <TabsTrigger value="entidades" className="flex items-center gap-2 px-6 py-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200">
                            <Building2 className="h-4 w-4" />
                            <span className="font-medium">Entidades</span>
                        </TabsTrigger>
                        <TabsTrigger value="especialidades" className="flex items-center gap-2 px-6 py-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200">
                            <GraduationCap className="h-4 w-4" />
                            <span className="font-medium">Especialidades</span>
                        </TabsTrigger>
                        <TabsTrigger value="especimenes" className="flex items-center gap-2 px-6 py-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200">
                            <TestTube className="h-4 w-4" />
                            <span className="font-medium">Especímenes</span>
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="cups" className="mt-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Activity className="h-5 w-5 text-primary" />
                                    Clasificación Única de Procedimientos en Salud (CUPS)
                                </CardTitle>
                                <CardDescription>
                                    Gestione y consulte los códigos CUPS utilizados para la facturación y registro clínico.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="border-t border-dashed">
                                <Cups />
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="cie10" className="mt-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Stethoscope className="h-5 w-5 text-primary" />
                                    Diagnósticos CIE10
                                </CardTitle>
                                <CardDescription>
                                    Acceda a la Clasificación Internacional de Enfermedades (Décima Versión).
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="border-t border-dashed">
                                <Cie10 />
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="medicamentos" className="mt-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Pill className="h-5 w-5 text-primary" />
                                    Gestión de Medicamentos
                                </CardTitle>
                                <CardDescription>
                                    Administre el catálogo de fármacos, presentaciones y vademécum.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="border-t border-dashed">
                                <Medicamentos />
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="entidades" className="mt-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Building2 className="h-5 w-5 text-primary" />
                                    Gestión de Entidades
                                </CardTitle>
                                <CardDescription>
                                    Administre el catálogo de entidades.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="border-t border-dashed">
                                <Entidades />
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="especialidades" className="mt-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <GraduationCap className="h-5 w-5 text-primary" />
                                    Gestión de Especialidades
                                </CardTitle>
                                <CardDescription>
                                    Administre las especialidades médicas del cuerpo asistencial.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="border-t border-dashed">
                                <Especialidades />
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="especimenes" className="mt-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <TestTube className="h-5 w-5 text-primary" />
                                    Gestión de Especímenes
                                </CardTitle>
                                <CardDescription>
                                    Administre los tipos de muestra utilizados en órdenes y patología.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="border-t border-dashed">
                                <Especimenes />
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </>
    );
}
