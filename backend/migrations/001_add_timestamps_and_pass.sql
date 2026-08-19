-- Migración 001: agrega createdAt/updatedAt a las 119 tablas de simdb-web
-- y prepara users.PASS para almacenar hash bcrypt (60 caracteres).
-- Generada automáticamente a partir de simdb.sql. Revisar antes de ejecutar
-- contra la base de datos de producción. Recomendado: backup previo.

-- 1) Ampliar PASS para bcrypt (hash de 60 caracteres). Los valores actuales
--    en texto plano/legado quedan como estaban; se re-hashean la próxima vez
--    que cada usuario inicie sesión o se migren manualmente aparte.
ALTER TABLE `users` MODIFY COLUMN `PASS` VARCHAR(255) NOT NULL;

-- 2) createdAt / updatedAt en cada tabla (nullable, sin default, para no forzar
--    un valor artificial sobre filas históricas ya existentes).
ALTER TABLE `agenda`
  ADD COLUMN `createdAt` DATETIME NULL,
  ADD COLUMN `updatedAt` DATETIME NULL;
ALTER TABLE `ambito_procedimiento`
  ADD COLUMN `createdAt` DATETIME NULL,
  ADD COLUMN `updatedAt` DATETIME NULL;
ALTER TABLE `antecedentes`
  ADD COLUMN `createdAt` DATETIME NULL,
  ADD COLUMN `updatedAt` DATETIME NULL;
ALTER TABLE `auditoria`
  ADD COLUMN `createdAt` DATETIME NULL,
  ADD COLUMN `updatedAt` DATETIME NULL;
ALTER TABLE `bloqueo_registros`
  ADD COLUMN `createdAt` DATETIME NULL,
  ADD COLUMN `updatedAt` DATETIME NULL;
ALTER TABLE `botones`
  ADD COLUMN `createdAt` DATETIME NULL,
  ADD COLUMN `updatedAt` DATETIME NULL;
ALTER TABLE `cargos`
  ADD COLUMN `createdAt` DATETIME NULL,
  ADD COLUMN `updatedAt` DATETIME NULL;
ALTER TABLE `causa_externa`
  ADD COLUMN `createdAt` DATETIME NULL,
  ADD COLUMN `updatedAt` DATETIME NULL;
ALTER TABLE `cierre_caja`
  ADD COLUMN `createdAt` DATETIME NULL,
  ADD COLUMN `updatedAt` DATETIME NULL;
ALTER TABLE `citas_canceladas`
  ADD COLUMN `createdAt` DATETIME NULL,
  ADD COLUMN `updatedAt` DATETIME NULL;
ALTER TABLE `citologia`
  ADD COLUMN `createdAt` DATETIME NULL,
  ADD COLUMN `updatedAt` DATETIME NULL;
ALTER TABLE `clientes`
  ADD COLUMN `createdAt` DATETIME NULL,
  ADD COLUMN `updatedAt` DATETIME NULL;
ALTER TABLE `compras`
  ADD COLUMN `createdAt` DATETIME NULL,
  ADD COLUMN `updatedAt` DATETIME NULL;
ALTER TABLE `consentimiento_informado_plantillas`
  ADD COLUMN `createdAt` DATETIME NULL,
  ADD COLUMN `updatedAt` DATETIME NULL;
ALTER TABLE `contratos`
  ADD COLUMN `createdAt` DATETIME NULL,
  ADD COLUMN `updatedAt` DATETIME NULL;
ALTER TABLE `cotizaciones`
  ADD COLUMN `createdAt` DATETIME NULL,
  ADD COLUMN `updatedAt` DATETIME NULL;
ALTER TABLE `cuentas_clientes`
  ADD COLUMN `createdAt` DATETIME NULL,
  ADD COLUMN `updatedAt` DATETIME NULL;
ALTER TABLE `cups`
  ADD COLUMN `createdAt` DATETIME NULL,
  ADD COLUMN `updatedAt` DATETIME NULL;
ALTER TABLE `datos_adjuntos`
  ADD COLUMN `createdAt` DATETIME NULL,
  ADD COLUMN `updatedAt` DATETIME NULL;
ALTER TABLE `departamentos`
  ADD COLUMN `createdAt` DATETIME NULL,
  ADD COLUMN `updatedAt` DATETIME NULL;
ALTER TABLE `detalle_compra`
  ADD COLUMN `createdAt` DATETIME NULL,
  ADD COLUMN `updatedAt` DATETIME NULL;
ALTER TABLE `detalle_cotizacion`
  ADD COLUMN `createdAt` DATETIME NULL,
  ADD COLUMN `updatedAt` DATETIME NULL;
ALTER TABLE `detalle_cuenta_cliente`
  ADD COLUMN `createdAt` DATETIME NULL,
  ADD COLUMN `updatedAt` DATETIME NULL;
ALTER TABLE `detalle_factura`
  ADD COLUMN `createdAt` DATETIME NULL,
  ADD COLUMN `updatedAt` DATETIME NULL;
ALTER TABLE `detalle_factura_productos`
  ADD COLUMN `createdAt` DATETIME NULL,
  ADD COLUMN `updatedAt` DATETIME NULL;
ALTER TABLE `detalle_orden`
  ADD COLUMN `createdAt` DATETIME NULL,
  ADD COLUMN `updatedAt` DATETIME NULL;
ALTER TABLE `detalle_orden_compra`
  ADD COLUMN `createdAt` DATETIME NULL,
  ADD COLUMN `updatedAt` DATETIME NULL;
ALTER TABLE `detalle_orden_factura`
  ADD COLUMN `createdAt` DATETIME NULL,
  ADD COLUMN `updatedAt` DATETIME NULL;
ALTER TABLE `detalle_orden_servicio`
  ADD COLUMN `createdAt` DATETIME NULL,
  ADD COLUMN `updatedAt` DATETIME NULL;
ALTER TABLE `detalle_pago_factura`
  ADD COLUMN `createdAt` DATETIME NULL,
  ADD COLUMN `updatedAt` DATETIME NULL;
ALTER TABLE `detalle_pago_recibo`
  ADD COLUMN `createdAt` DATETIME NULL,
  ADD COLUMN `updatedAt` DATETIME NULL;
ALTER TABLE `detalle_registro_anestesia`
  ADD COLUMN `createdAt` DATETIME NULL,
  ADD COLUMN `updatedAt` DATETIME NULL;
ALTER TABLE `detalle_tarifa`
  ADD COLUMN `createdAt` DATETIME NULL,
  ADD COLUMN `updatedAt` DATETIME NULL;
ALTER TABLE `detalle_tarifa_productos`
  ADD COLUMN `createdAt` DATETIME NULL,
  ADD COLUMN `updatedAt` DATETIME NULL;
ALTER TABLE `diagnosticos`
  ADD COLUMN `createdAt` DATETIME NULL,
  ADD COLUMN `updatedAt` DATETIME NULL;
ALTER TABLE `documentospdf`
  ADD COLUMN `createdAt` DATETIME NULL,
  ADD COLUMN `updatedAt` DATETIME NULL;
ALTER TABLE `empleados`
  ADD COLUMN `createdAt` DATETIME NULL,
  ADD COLUMN `updatedAt` DATETIME NULL;
ALTER TABLE `empresa`
  ADD COLUMN `createdAt` DATETIME NULL,
  ADD COLUMN `updatedAt` DATETIME NULL;
ALTER TABLE `encabezados`
  ADD COLUMN `createdAt` DATETIME NULL,
  ADD COLUMN `updatedAt` DATETIME NULL;
ALTER TABLE `endoscopias`
  ADD COLUMN `createdAt` DATETIME NULL,
  ADD COLUMN `updatedAt` DATETIME NULL;
ALTER TABLE `entidades`
  ADD COLUMN `createdAt` DATETIME NULL,
  ADD COLUMN `updatedAt` DATETIME NULL;
ALTER TABLE `entrega_resultados`
  ADD COLUMN `createdAt` DATETIME NULL,
  ADD COLUMN `updatedAt` DATETIME NULL;
ALTER TABLE `equipos`
  ADD COLUMN `createdAt` DATETIME NULL,
  ADD COLUMN `updatedAt` DATETIME NULL;
ALTER TABLE `escala_prader`
  ADD COLUMN `createdAt` DATETIME NULL,
  ADD COLUMN `updatedAt` DATETIME NULL;
ALTER TABLE `especialidades`
  ADD COLUMN `createdAt` DATETIME NULL,
  ADD COLUMN `updatedAt` DATETIME NULL;
ALTER TABLE `especialistas`
  ADD COLUMN `createdAt` DATETIME NULL,
  ADD COLUMN `updatedAt` DATETIME NULL;
ALTER TABLE `especimenes`
  ADD COLUMN `createdAt` DATETIME NULL,
  ADD COLUMN `updatedAt` DATETIME NULL;
ALTER TABLE `estudios_generados`
  ADD COLUMN `createdAt` DATETIME NULL,
  ADD COLUMN `updatedAt` DATETIME NULL;
ALTER TABLE `eventos`
  ADD COLUMN `createdAt` DATETIME NULL,
  ADD COLUMN `updatedAt` DATETIME NULL;
ALTER TABLE `examenes_prequirurgicos`
  ADD COLUMN `createdAt` DATETIME NULL,
  ADD COLUMN `updatedAt` DATETIME NULL;
ALTER TABLE `facturas`
  ADD COLUMN `createdAt` DATETIME NULL,
  ADD COLUMN `updatedAt` DATETIME NULL;
ALTER TABLE `finalidad_consulta`
  ADD COLUMN `createdAt` DATETIME NULL,
  ADD COLUMN `updatedAt` DATETIME NULL;
ALTER TABLE `finalidad_procedimiento`
  ADD COLUMN `createdAt` DATETIME NULL,
  ADD COLUMN `updatedAt` DATETIME NULL;
ALTER TABLE `forma_realizacion`
  ADD COLUMN `createdAt` DATETIME NULL,
  ADD COLUMN `updatedAt` DATETIME NULL;
ALTER TABLE `historia_clinica`
  ADD COLUMN `createdAt` DATETIME NULL,
  ADD COLUMN `updatedAt` DATETIME NULL;
ALTER TABLE `historia_detalle`
  ADD COLUMN `createdAt` DATETIME NULL,
  ADD COLUMN `updatedAt` DATETIME NULL;
ALTER TABLE `historia_diagnosticos`
  ADD COLUMN `createdAt` DATETIME NULL,
  ADD COLUMN `updatedAt` DATETIME NULL;
ALTER TABLE `historia_laboratorios`
  ADD COLUMN `createdAt` DATETIME NULL,
  ADD COLUMN `updatedAt` DATETIME NULL;
ALTER TABLE `historia_medicamentos`
  ADD COLUMN `createdAt` DATETIME NULL,
  ADD COLUMN `updatedAt` DATETIME NULL;
ALTER TABLE `historia_procedimientos`
  ADD COLUMN `createdAt` DATETIME NULL,
  ADD COLUMN `updatedAt` DATETIME NULL;
ALTER TABLE `historia_rxs`
  ADD COLUMN `createdAt` DATETIME NULL,
  ADD COLUMN `updatedAt` DATETIME NULL;
ALTER TABLE `imagenes`
  ADD COLUMN `createdAt` DATETIME NULL,
  ADD COLUMN `updatedAt` DATETIME NULL;
ALTER TABLE `imagenes_temporales`
  ADD COLUMN `createdAt` DATETIME NULL,
  ADD COLUMN `updatedAt` DATETIME NULL;
ALTER TABLE `impresion`
  ADD COLUMN `createdAt` DATETIME NULL,
  ADD COLUMN `updatedAt` DATETIME NULL;
ALTER TABLE `impresion_detalle_historia`
  ADD COLUMN `createdAt` DATETIME NULL,
  ADD COLUMN `updatedAt` DATETIME NULL;
ALTER TABLE `impresion_endoscopia`
  ADD COLUMN `createdAt` DATETIME NULL,
  ADD COLUMN `updatedAt` DATETIME NULL;
ALTER TABLE `impresion_historia`
  ADD COLUMN `createdAt` DATETIME NULL,
  ADD COLUMN `updatedAt` DATETIME NULL;
ALTER TABLE `impresion_patologia`
  ADD COLUMN `createdAt` DATETIME NULL,
  ADD COLUMN `updatedAt` DATETIME NULL;
ALTER TABLE `informes`
  ADD COLUMN `createdAt` DATETIME NULL,
  ADD COLUMN `updatedAt` DATETIME NULL;
ALTER TABLE `ingreso`
  ADD COLUMN `createdAt` DATETIME NULL,
  ADD COLUMN `updatedAt` DATETIME NULL;
ALTER TABLE `inventario`
  ADD COLUMN `createdAt` DATETIME NULL,
  ADD COLUMN `updatedAt` DATETIME NULL;
ALTER TABLE `licencias`
  ADD COLUMN `createdAt` DATETIME NULL,
  ADD COLUMN `updatedAt` DATETIME NULL;
ALTER TABLE `marcas`
  ADD COLUMN `createdAt` DATETIME NULL,
  ADD COLUMN `updatedAt` DATETIME NULL;
ALTER TABLE `medicamentos`
  ADD COLUMN `createdAt` DATETIME NULL,
  ADD COLUMN `updatedAt` DATETIME NULL;
ALTER TABLE `medios_pago`
  ADD COLUMN `createdAt` DATETIME NULL,
  ADD COLUMN `updatedAt` DATETIME NULL;
ALTER TABLE `menu`
  ADD COLUMN `createdAt` DATETIME NULL,
  ADD COLUMN `updatedAt` DATETIME NULL;
ALTER TABLE `motivo_cancelacion_cita`
  ADD COLUMN `createdAt` DATETIME NULL,
  ADD COLUMN `updatedAt` DATETIME NULL;
ALTER TABLE `municipios`
  ADD COLUMN `createdAt` DATETIME NULL,
  ADD COLUMN `updatedAt` DATETIME NULL;
ALTER TABLE `optometria`
  ADD COLUMN `createdAt` DATETIME NULL,
  ADD COLUMN `updatedAt` DATETIME NULL;
ALTER TABLE `orden_compra`
  ADD COLUMN `createdAt` DATETIME NULL,
  ADD COLUMN `updatedAt` DATETIME NULL;
ALTER TABLE `orden_servicio`
  ADD COLUMN `createdAt` DATETIME NULL,
  ADD COLUMN `updatedAt` DATETIME NULL;
ALTER TABLE `ordenes`
  ADD COLUMN `createdAt` DATETIME NULL,
  ADD COLUMN `updatedAt` DATETIME NULL;
ALTER TABLE `ortodoncia`
  ADD COLUMN `createdAt` DATETIME NULL,
  ADD COLUMN `updatedAt` DATETIME NULL;
ALTER TABLE `patologia`
  ADD COLUMN `createdAt` DATETIME NULL,
  ADD COLUMN `updatedAt` DATETIME NULL;
ALTER TABLE `percentiles`
  ADD COLUMN `createdAt` DATETIME NULL,
  ADD COLUMN `updatedAt` DATETIME NULL;
ALTER TABLE `persona_atiende`
  ADD COLUMN `createdAt` DATETIME NULL,
  ADD COLUMN `updatedAt` DATETIME NULL;
ALTER TABLE `plantillas_informes`
  ADD COLUMN `createdAt` DATETIME NULL,
  ADD COLUMN `updatedAt` DATETIME NULL;
ALTER TABLE `plantillas_patologia`
  ADD COLUMN `createdAt` DATETIME NULL,
  ADD COLUMN `updatedAt` DATETIME NULL;
ALTER TABLE `presentacion_productos`
  ADD COLUMN `createdAt` DATETIME NULL,
  ADD COLUMN `updatedAt` DATETIME NULL;
ALTER TABLE `privilegios`
  ADD COLUMN `createdAt` DATETIME NULL,
  ADD COLUMN `updatedAt` DATETIME NULL;
ALTER TABLE `procedimientos_terapeuticos`
  ADD COLUMN `createdAt` DATETIME NULL,
  ADD COLUMN `updatedAt` DATETIME NULL;
ALTER TABLE `productos`
  ADD COLUMN `createdAt` DATETIME NULL,
  ADD COLUMN `updatedAt` DATETIME NULL;
ALTER TABLE `proveedores`
  ADD COLUMN `createdAt` DATETIME NULL,
  ADD COLUMN `updatedAt` DATETIME NULL;
ALTER TABLE `recibo_caja`
  ADD COLUMN `createdAt` DATETIME NULL,
  ADD COLUMN `updatedAt` DATETIME NULL;
ALTER TABLE `registros`
  ADD COLUMN `createdAt` DATETIME NULL,
  ADD COLUMN `updatedAt` DATETIME NULL;
ALTER TABLE `resoluciones_dian`
  ADD COLUMN `createdAt` DATETIME NULL,
  ADD COLUMN `updatedAt` DATETIME NULL;
ALTER TABLE `revision_sistemas`
  ADD COLUMN `createdAt` DATETIME NULL,
  ADD COLUMN `updatedAt` DATETIME NULL;
ALTER TABLE `salones`
  ADD COLUMN `createdAt` DATETIME NULL,
  ADD COLUMN `updatedAt` DATETIME NULL;
ALTER TABLE `sedes`
  ADD COLUMN `createdAt` DATETIME NULL,
  ADD COLUMN `updatedAt` DATETIME NULL;
ALTER TABLE `seguimiento_soporte`
  ADD COLUMN `createdAt` DATETIME NULL,
  ADD COLUMN `updatedAt` DATETIME NULL;
ALTER TABLE `servicios`
  ADD COLUMN `createdAt` DATETIME NULL,
  ADD COLUMN `updatedAt` DATETIME NULL;
ALTER TABLE `sesiones`
  ADD COLUMN `createdAt` DATETIME NULL,
  ADD COLUMN `updatedAt` DATETIME NULL;
ALTER TABLE `soporte`
  ADD COLUMN `createdAt` DATETIME NULL,
  ADD COLUMN `updatedAt` DATETIME NULL;
ALTER TABLE `subentidades`
  ADD COLUMN `createdAt` DATETIME NULL,
  ADD COLUMN `updatedAt` DATETIME NULL;
ALTER TABLE `submenu`
  ADD COLUMN `createdAt` DATETIME NULL,
  ADD COLUMN `updatedAt` DATETIME NULL;
ALTER TABLE `tablas`
  ADD COLUMN `createdAt` DATETIME NULL,
  ADD COLUMN `updatedAt` DATETIME NULL;
ALTER TABLE `tarifa_productos`
  ADD COLUMN `createdAt` DATETIME NULL,
  ADD COLUMN `updatedAt` DATETIME NULL;
ALTER TABLE `tarifas`
  ADD COLUMN `createdAt` DATETIME NULL,
  ADD COLUMN `updatedAt` DATETIME NULL;
ALTER TABLE `tipo_afiliado`
  ADD COLUMN `createdAt` DATETIME NULL,
  ADD COLUMN `updatedAt` DATETIME NULL;
ALTER TABLE `tipo_diagnostico`
  ADD COLUMN `createdAt` DATETIME NULL,
  ADD COLUMN `updatedAt` DATETIME NULL;
ALTER TABLE `tipo_documento`
  ADD COLUMN `createdAt` DATETIME NULL,
  ADD COLUMN `updatedAt` DATETIME NULL;
ALTER TABLE `tipo_estudio`
  ADD COLUMN `createdAt` DATETIME NULL,
  ADD COLUMN `updatedAt` DATETIME NULL;
ALTER TABLE `tipo_identificacion`
  ADD COLUMN `createdAt` DATETIME NULL,
  ADD COLUMN `updatedAt` DATETIME NULL;
ALTER TABLE `tipo_usuario`
  ADD COLUMN `createdAt` DATETIME NULL,
  ADD COLUMN `updatedAt` DATETIME NULL;
ALTER TABLE `toma_muestra`
  ADD COLUMN `createdAt` DATETIME NULL,
  ADD COLUMN `updatedAt` DATETIME NULL;
ALTER TABLE `unidad_medida`
  ADD COLUMN `createdAt` DATETIME NULL,
  ADD COLUMN `updatedAt` DATETIME NULL;
ALTER TABLE `users`
  ADD COLUMN `createdAt` DATETIME NULL,
  ADD COLUMN `updatedAt` DATETIME NULL;
ALTER TABLE `usuarios`
  ADD COLUMN `createdAt` DATETIME NULL,
  ADD COLUMN `updatedAt` DATETIME NULL;
ALTER TABLE `via_administracion`
  ADD COLUMN `createdAt` DATETIME NULL,
  ADD COLUMN `updatedAt` DATETIME NULL;
