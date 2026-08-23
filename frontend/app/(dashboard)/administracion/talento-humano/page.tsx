import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, Users } from "lucide-react";
import { ModulePlaceholder } from "@/components/layout/ModulePlaceholder";
import { Separator } from "@/components/ui/separator";
import Cargos from "./component/Cargos";
import Empleados from "./component/Empleados";

export default function TalentoHumanoPage() {
    return (
        <>
            <div className="flex flex-col gap-6 pb-6">
                <ModulePlaceholder
                    module="Administración"
                    title="Talento Humano"
                    description="Gestión de cargos y del personal asistencial y administrativo."
                />
            </div>
            <Separator />
            <div className="flex flex-col gap-6 pt-6">
                <Tabs defaultValue="empleados" className="w-full">
                    <TabsList className="flex w-fit items-center justify-start gap-1 bg-muted/50 p-1 border rounded-xl overflow-x-auto">
                        <TabsTrigger value="empleados" className="flex items-center gap-2 px-6 py-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200">
                            <Users className="h-4 w-4" />
                            <span className="font-medium">Empleados</span>
                        </TabsTrigger>
                        <TabsTrigger value="cargos" className="flex items-center gap-2 px-6 py-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200">
                            <Briefcase className="h-4 w-4" />
                            <span className="font-medium">Cargos</span>
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="empleados" className="mt-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Users className="h-5 w-5 text-primary" />
                                    Gestión de Empleados
                                </CardTitle>
                                <CardDescription>
                                    Administre el personal asistencial y administrativo, su cargo y especialidad.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="border-t border-dashed">
                                <Empleados />
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="cargos" className="mt-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Briefcase className="h-5 w-5 text-primary" />
                                    Gestión de Cargos
                                </CardTitle>
                                <CardDescription>
                                    Administre el catálogo de cargos del personal.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="border-t border-dashed">
                                <Cargos />
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </>
    );
}
