-- Migración 002: convierte todas las columnas SET a ENUM.
--
-- Por qué: TypeORM representa las columnas MySQL SET como arreglo de valores
-- seleccionados (ej. ['ATENDIDO']), no como string plano. Esto rompía en
-- silencio cualquier comparación estricta (===) en el backend/frontend contra
-- un string literal, aunque el valor se viera y se comparara bien en otros
-- contextos (JSX, claves de objeto) por coerción implícita de JS.
--
-- MySQL ENUM solo permite UN valor (nunca hubo combinaciones multi-valor
-- reales en estas columnas: son todos estados únicos como A/I, PENDIENTE/
-- ATENDIDO/etc.), así que el cambio es semánticamente seguro. La sintaxis de
-- lista de valores es idéntica entre SET y ENUM, por eso este script solo
-- reemplaza la palabra clave sin tocar valores, orden ni escapes.
--
-- IMPORTANTE: antes de correr esto, hacer backup de la base de datos.

ALTER TABLE `agenda`
  MODIFY COLUMN `ESTADO` enum('CANCELADA','ATENDIDA','APARTADA','DISPONIBLE') NOT NULL;

ALTER TABLE `auditoria`
  MODIFY COLUMN `ESTADO` enum('ABIERTA','CERRADA') NOT NULL;

ALTER TABLE `cargos`
  MODIFY COLUMN `ESTADO` enum('A','I','E') NOT NULL;

ALTER TABLE `citas_canceladas`
  MODIFY COLUMN `ESTADO` enum('A','I') NOT NULL;

ALTER TABLE `clientes`
  MODIFY COLUMN `ESTADO` enum('A','I') NOT NULL;

ALTER TABLE `compras`
  MODIFY COLUMN `ESTADO` enum('A','I') NOT NULL;

ALTER TABLE `consentimiento_informado_plantillas`
  MODIFY COLUMN `TIPO_CONSENTIMIENTO` enum('TELEMEDICINA','PROCEDIMIENTO') NOT NULL,
  MODIFY COLUMN `ESTADO` enum('A','I') NOT NULL;

ALTER TABLE `contratos`
  MODIFY COLUMN `TIPO_CONTRATO` enum('EVENTO','CAPITADO','PAQUETE') NOT NULL,
  MODIFY COLUMN `RIPS` enum('SI','NO') NOT NULL,
  MODIFY COLUMN `ESTADO` enum('A','I') NOT NULL;

ALTER TABLE `cotizaciones`
  MODIFY COLUMN `Estado` enum('A','F') NOT NULL,
  MODIFY COLUMN `TIPO_FACTURA` enum('SERVICIOS','PRODUCTOS') NOT NULL;

ALTER TABLE `cups`
  MODIFY COLUMN `ESTADO` enum('A','I') NOT NULL;

ALTER TABLE `datos_adjuntos`
  MODIFY COLUMN `ESTADO` enum('A','I') NOT NULL;

ALTER TABLE `detalle_compra`
  MODIFY COLUMN `ESTADO` enum('A','I') NOT NULL;

ALTER TABLE `detalle_cotizacion`
  MODIFY COLUMN `ESTADO` enum('ANULADO','FACTURADO') NOT NULL;

ALTER TABLE `detalle_cuenta_cliente`
  MODIFY COLUMN `ESTADO` enum('A','I') NOT NULL;

ALTER TABLE `detalle_factura`
  MODIFY COLUMN `TIPO` enum('C','P','U','H','M','A','O') NOT NULL,
  MODIFY COLUMN `ESTADO` enum('ANULADO','GLOSADO','FACTURADO') NOT NULL;

ALTER TABLE `detalle_factura_productos`
  MODIFY COLUMN `ESTADO` enum('A','I') NOT NULL;

ALTER TABLE `detalle_orden`
  MODIFY COLUMN `TIPO` enum('C','P','U','H','M','A','O') NOT NULL,
  MODIFY COLUMN `ESTADO` enum('PENDIENTE','PROCESO','ATENDIDO','CANCELADO') NOT NULL;

ALTER TABLE `detalle_orden_compra`
  MODIFY COLUMN `ESTADO` enum('REQUERIDO','ASIGNADO','CONFIRMADO','PARCIAL') NOT NULL;

ALTER TABLE `detalle_orden_factura`
  MODIFY COLUMN `TIPO` enum('C','P','U','H','M','A','O') NOT NULL,
  MODIFY COLUMN `ESTADO` enum('PENDIENTE','PROCESO','ATENDIDO','CANCELADO') NOT NULL;

ALTER TABLE `detalle_orden_servicio`
  MODIFY COLUMN `ESTADO` enum('ANULADO','FACTURADO') NOT NULL;

ALTER TABLE `detalle_tarifa`
  MODIFY COLUMN `TIPO_ATENCION` enum('CONSULTA','PROCEDIMIENTO') NOT NULL,
  MODIFY COLUMN `ESTADO` enum('A','I') NOT NULL;

ALTER TABLE `detalle_tarifa_productos`
  MODIFY COLUMN `ESTADO` enum('A','I') NOT NULL;

ALTER TABLE `empleados`
  MODIFY COLUMN `ESTADO` enum('A','I') NOT NULL;

ALTER TABLE `empresa`
  MODIFY COLUMN `ESTADO` enum('A','I') NOT NULL;

ALTER TABLE `entidades`
  MODIFY COLUMN `ESTADO` enum('A','I') NOT NULL;

ALTER TABLE `equipos`
  MODIFY COLUMN `ESTADO` enum('A','I') NOT NULL;

ALTER TABLE `especialidades`
  MODIFY COLUMN `ESTADO` enum('A','I') NOT NULL;

ALTER TABLE `especialistas`
  MODIFY COLUMN `ESTADO` enum('A','I') NOT NULL DEFAULT '';

ALTER TABLE `especimenes`
  MODIFY COLUMN `ESTADO` enum('A','I') NOT NULL;

ALTER TABLE `eventos`
  MODIFY COLUMN `ESTADO` enum('A','I') NOT NULL;

ALTER TABLE `facturas`
  MODIFY COLUMN `Estado` enum('A','F') NOT NULL,
  MODIFY COLUMN `TIPO_FACTURA` enum('SERVICIOS','PRODUCTOS') NOT NULL,
  MODIFY COLUMN `REMISION` enum('F','R') NOT NULL;

ALTER TABLE `forma_realizacion`
  MODIFY COLUMN `ESTADO` enum('A','I') NOT NULL;

ALTER TABLE `historia_clinica`
  MODIFY COLUMN `TANNER_A` enum('-','1','2','3','4','5') NULL DEFAULT NULL,
  MODIFY COLUMN `TANNER_B` enum('-','1','2','3','4','5') NULL DEFAULT NULL,
  MODIFY COLUMN `TANNER_P` enum('-','1','2','3','4','5') NULL DEFAULT NULL,
  MODIFY COLUMN `TANNER_VT` enum('-','1','2','3','4','5','6','8','10','12','15','20','25') NULL DEFAULT NULL,
  MODIFY COLUMN `ESTADO` enum('A','C') NULL DEFAULT NULL;

ALTER TABLE `imagenes`
  MODIFY COLUMN `ESTADO` enum('A','I') NOT NULL;

ALTER TABLE `impresion_detalle_historia`
  MODIFY COLUMN `TABLA` enum('R','D','L','M','O') NOT NULL;

ALTER TABLE `impresion_patologia`
  MODIFY COLUMN `SEXO` enum('M','F') NULL DEFAULT NULL;

ALTER TABLE `informes`
  MODIFY COLUMN `ESTADO` enum('A','I') NOT NULL;

ALTER TABLE `inventario`
  MODIFY COLUMN `MOVIMIENTO` enum('E','S','C','D') NOT NULL,
  MODIFY COLUMN `ESTADO` enum('A','I') NOT NULL;

ALTER TABLE `licencias`
  MODIFY COLUMN `ESTADO` enum('A','S','E') NOT NULL;

ALTER TABLE `marcas`
  MODIFY COLUMN `ESTADO` enum('A','I') NOT NULL;

ALTER TABLE `medicamentos`
  MODIFY COLUMN `ESTADO` enum('A','I') NOT NULL;

ALTER TABLE `medios_pago`
  MODIFY COLUMN `ESTADO` enum('A','I') NOT NULL;

ALTER TABLE `motivo_cancelacion_cita`
  MODIFY COLUMN `ESTADO` enum('A','I') NOT NULL;

ALTER TABLE `orden_compra`
  MODIFY COLUMN `ESTADO` enum('ABIERTA','APROBADA','PARCIAL','CERRADA','ANULADA') NOT NULL;

ALTER TABLE `orden_servicio`
  MODIFY COLUMN `Estado` enum('A','F','P') NOT NULL,
  MODIFY COLUMN `TIPO_ORDEN` enum('SERVICIOS','PRODUCTOS') NOT NULL;

ALTER TABLE `ordenes`
  MODIFY COLUMN `ESTADO` enum('PENDIENTE','PROCESO','ATENDIDO','CANCELADO','FACTURADO') NOT NULL;

ALTER TABLE `ortodoncia`
  MODIFY COLUMN `PERFIL` enum('RECTO','CONCAVO','CONVEXO') NOT NULL,
  MODIFY COLUMN `FRENTE` enum('DEXTROGNATISMO','LEVOGNATISMO') NOT NULL DEFAULT '',
  MODIFY COLUMN `HIPOTONIA` enum('SUPERIOR','INFERIOR') NOT NULL,
  MODIFY COLUMN `HIPERTONIA` enum('SUPERIOR','INFERIOR') NOT NULL,
  MODIFY COLUMN `MACROQUELIA` enum('SUPERIOR','INFERIOR') NOT NULL,
  MODIFY COLUMN `MICROQUELIA` enum('SUPERIOR','INFERIOR') NOT NULL,
  MODIFY COLUMN `PROQUELIA` enum('SUPERIOR','INFERIOR') NOT NULL,
  MODIFY COLUMN `FRENILLO_LABIAL_SUPERIOR` enum('NORMAL','SOBREINSERTADO') NOT NULL,
  MODIFY COLUMN `FRENILLO_LABIAL_INFERIOR` enum('NORMAL','SOBREINSERTADO') NOT NULL,
  MODIFY COLUMN `FRENILLO_LINGUAL` enum('NORMAL','SOBREINSERTADO') NOT NULL;

ALTER TABLE `patologia`
  MODIFY COLUMN `ESTADO` enum('A','I') NOT NULL;

ALTER TABLE `plantillas_informes`
  MODIFY COLUMN `ESTADO` enum('A','I') NOT NULL;

ALTER TABLE `plantillas_patologia`
  MODIFY COLUMN `ESTADO` enum('A','I') NOT NULL;

ALTER TABLE `presentacion_productos`
  MODIFY COLUMN `ESTADO` enum('A','I') NOT NULL;

ALTER TABLE `procedimientos_terapeuticos`
  MODIFY COLUMN `ESTADO` enum('A','I') NOT NULL;

ALTER TABLE `productos`
  MODIFY COLUMN `ESTADO` enum('A','I') NOT NULL;

ALTER TABLE `proveedores`
  MODIFY COLUMN `ESTADO` enum('A','I') NOT NULL;

ALTER TABLE `recibo_caja`
  MODIFY COLUMN `ESTADO` enum('R','A','C') NOT NULL;

ALTER TABLE `resoluciones_dian`
  MODIFY COLUMN `ESTADO` enum('A','I') NOT NULL;

ALTER TABLE `revision_sistemas`
  MODIFY COLUMN `ESTADO` enum('A','I') NOT NULL;

ALTER TABLE `salones`
  MODIFY COLUMN `ESTADO` enum('A','I') NOT NULL;

ALTER TABLE `sedes`
  MODIFY COLUMN `ESTADO` enum('A','I') NOT NULL;

ALTER TABLE `seguimiento_soporte`
  MODIFY COLUMN `TIPO_MENSAJE` enum('PREGUNTA','RESPUESTA') NOT NULL;

ALTER TABLE `servicios`
  MODIFY COLUMN `ESTADO` enum('A','I') NOT NULL;

ALTER TABLE `soporte`
  MODIFY COLUMN `ESTADO` enum('ABIERTO''CANCELADO','CERRADO') NOT NULL;

ALTER TABLE `subentidades`
  MODIFY COLUMN `estado` enum('A','I','E') NOT NULL;

ALTER TABLE `tablas`
  MODIFY COLUMN `ESTADO` enum('A','I') NOT NULL;

ALTER TABLE `tarifa_productos`
  MODIFY COLUMN `ESTADO` enum('A','I') NOT NULL;

ALTER TABLE `tarifas`
  MODIFY COLUMN `ESTADO` enum('A','I') NOT NULL;

ALTER TABLE `tipo_documento`
  MODIFY COLUMN `ESTADO` enum('A','I') NOT NULL;

ALTER TABLE `tipo_estudio`
  MODIFY COLUMN `ESTADO` enum('A','I') NOT NULL;

ALTER TABLE `toma_muestra`
  MODIFY COLUMN `S` enum('1','0') NOT NULL,
  MODIFY COLUMN `U` enum('1','0') NOT NULL,
  MODIFY COLUMN `L` enum('1','0') NOT NULL,
  MODIFY COLUMN `BN` enum('1','0') NOT NULL,
  MODIFY COLUMN `CN` enum('1','0') NOT NULL,
  MODIFY COLUMN `BA` enum('1','0') NOT NULL,
  MODIFY COLUMN `O` enum('1','0') NOT NULL;

ALTER TABLE `unidad_medida`
  MODIFY COLUMN `ESTADO` enum('A','I') NOT NULL;

ALTER TABLE `users`
  MODIFY COLUMN `ESTADO` enum('A','I','E') NULL DEFAULT NULL,
  MODIFY COLUMN `ADMIN` enum('1','0') NOT NULL;

ALTER TABLE `usuarios`
  MODIFY COLUMN `SEXO` enum('M','F') NOT NULL DEFAULT 'F',
  MODIFY COLUMN `ESTADO_CIVIL` enum('CASADO','SOLTERO','DIVORCIADO','VIUDO','UNION LIBRE') NOT NULL DEFAULT 'SOLTERO',
  MODIFY COLUMN `ZONA` enum('R','U') NULL DEFAULT NULL;

ALTER TABLE `via_administracion`
  MODIFY COLUMN `ESTADO` enum('A','I') NOT NULL;

