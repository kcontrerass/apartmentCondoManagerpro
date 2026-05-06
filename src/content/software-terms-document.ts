/**
 * Texto legal: Términos y Condiciones de Uso y Política de Uso y Tratamiento de Datos (ADESSO-365).
 * Idioma oficial del documento: español.
 */
export const SOFTWARE_TERMS_PREAMBLE =
    'Al acceder, registrarse o utilizar la plataforma ADESSO-365, usted reconoce que ha leído, entendido y aceptado los presentes Términos y Condiciones, así como la Política de Uso y Tratamiento de Datos aquí contenida. El uso del sistema implica la aceptación expresa de estas condiciones por parte del cliente y de los usuarios autorizados por este.';

export const SOFTWARE_TERMS_DOC_TITLE =
    'Términos y Condiciones de Uso y Política de Uso de Datos';

export const SOFTWARE_TERMS_META_LINES = [
    'Última actualización: 05 de mayo de 2026',
    'Titular del servicio: ADESSO S.A.',
    'Nombre comercial: ADESSO-365',
    'Domicilio: (PENDIENTE DE CONFIRMAR)',
    'NIT: (PENDIENTE DE CONFIRMAR)',
    'Correo de contacto: (PENDIENTE DE DEFINIR)',
    'Teléfono: (PENDIENTE DE CONFIRMAR)',
] as const;

export type SoftwareTermsSection = { id: number; title: string; body: string };

export const SOFTWARE_TERMS_SECTIONS: SoftwareTermsSection[] = [
    {
        id: 1,
        title: 'Objeto del servicio',
        body: `La plataforma ADESSO-365 es un software en modalidad de suscripción diseñado para la gestión y administración de condominios residenciales, centros comerciales, edificios de clínicas y edificios de oficinas. Sus funciones pueden incluir, entre otras, administración de unidades, residentes, huéspedes temporales, propietarios, inquilinos, proveedores, amenidades, cobros, avisos, eventos, incidentes, votaciones, estados de cuenta, comunicación interna, tickets de mantenimiento, control de accesos, reservas, reportes de uso, comunicaciones, conciliaciones de pago y gestión de personal administrativo.

El servicio se presta únicamente para fines administrativos, operativos y de control relacionados con el inmueble o conjunto administrado. Queda prohibido el uso del sistema para fines ilícitos, fraudulentos o distintos a los autorizados por el cliente.`,
    },
    {
        id: 2,
        title: 'Definiciones',
        body: `Para efectos de este documento, se entenderá por:

Cliente: La persona individual o jurídica que contrata el servicio.
Usuario: Toda persona autorizada por el Cliente para acceder a la plataforma.
Titular de datos: Persona cuyos datos personales o de pago son incorporados al sistema.
Datos: Información personal, operativa, financiera, de acceso, facturación o administración cargada o generada dentro de la plataforma.
Servicios de pago: Pasarelas, bancos, procesadores o intermediarios financieros que facilitan los cobros mensuales.`,
    },
    {
        id: 3,
        title: 'Registro y cuentas',
        body: `El Cliente será responsable de crear, administrar y supervisar las cuentas de usuario dentro de su entorno. Cada usuario deberá mantener la confidencialidad de sus credenciales de acceso y notificar de inmediato cualquier uso no autorizado.

Toda acción realizada desde una cuenta se presumirá realizada por su titular o por una persona autorizada por este, salvo prueba en contrario. El Cliente será responsable de la veracidad, exactitud y actualización de la información cargada al sistema.`,
    },
    {
        id: 4,
        title: 'Licencia de uso',
        body: `El proveedor concede al Cliente una licencia limitada, no exclusiva, revocable, intransferible y no sublicenciable para utilizar la plataforma durante la vigencia de la suscripción y conforme al plan contratado.

Esta licencia no transfiere propiedad intelectual sobre el software, sus diseños, bases de datos, interfaces, marcas, documentación o componentes tecnológicos. Todos los derechos no expresamente otorgados quedan reservados a favor del proveedor.`,
    },
    {
        id: 5,
        title: 'Uso aceptable',
        body: `El Cliente y los Usuarios se obligan a:

Utilizar la plataforma únicamente para la administración de inmuebles de condominios residenciales, centros comerciales, edificios de clínicas y edificios de oficinas.
No alterar, copiar, descompilar, intervenir o intentar vulnerar la seguridad del sistema.
No ingresar información falsa o engañosa de manera deliberada.
No usar la plataforma para actividades contrarias a la ley, la moral, el orden público o los derechos de terceros.
No intentar acceder a datos de otros clientes o a módulos no autorizados.

El proveedor podrá restringir, suspender o cancelar cuentas que incumplan estas condiciones.`,
    },
    {
        id: 6,
        title: 'Suscripción, facturación y pagos mensuales',
        body: `El servicio se presta bajo modalidad de suscripción mensual, salvo que se acuerde por escrito otra periodicidad. El Cliente autoriza al proveedor a facturar y cobrar de manera recurrente el monto correspondiente al plan contratado, más impuestos, cargos financieros, comisiones o recargos que resulten aplicables conforme al contrato comercial.

El pago podrá realizarse mediante tarjeta, transferencia bancaria, débito automático, enlace de pago, pasarela electrónica u otro medio habilitado por el proveedor. Cuando el Cliente autorice el cargo recurrente, acepta que los pagos se procesen automáticamente en cada período de facturación hasta que la suscripción sea cancelada conforme a este documento o al contrato específico.

Si un pago es rechazado, revertido, objetado o no completado por cualquier causa imputable al medio de pago, el proveedor podrá:

Reintentar el cobro.
Notificar al Cliente para que actualice su medio de pago.
Suspender temporalmente el acceso al servicio.
Cerrar la cuenta por falta de pago si la mora persiste.

La suspensión por falta de pago no libera al Cliente de sus obligaciones pendientes. Los saldos vencidos seguirán siendo exigibles conforme a los términos comerciales pactados.`,
    },
    {
        id: 7,
        title: 'Renovación y cancelación',
        body: `Salvo cancelación expresa del Cliente antes del siguiente ciclo de facturación, la suscripción se renovará automáticamente de forma mensual. La cancelación deberá realizarse por los medios que el proveedor habilite dentro de la plataforma o por escrito al correo de soporte indicado.

La cancelación no exime al Cliente de pagar los importes generados hasta la fecha efectiva de terminación. El proveedor podrá conservar información de facturación, auditoría y respaldo durante el plazo requerido por obligaciones legales, contables o contractuales.`,
    },
    {
        id: 8,
        title: 'Procesamiento de datos de pago',
        body: `La plataforma podrá procesar información asociada a pagos internos y externos de cada usuario, incluyendo:

Identificadores de transacción.
Referencias de pago.
Estado de cobro.
Últimos cuatro dígitos de tarjetas.
Tokens de pago.
Cuentas bancarias o medios de pago registrados.
Comprobantes y confirmaciones de transacción.
Historial de conciliación y aplicación de pagos.

El sistema no deberá almacenar credenciales completas de tarjetas, códigos de seguridad, contraseñas bancarias o información sensible no necesaria para la ejecución del cobro, salvo que ello sea estrictamente necesario y se realice a través de proveedores especializados y debidamente protegidos.

Cuando el cobro se efectúe por medio de terceros, el Cliente autoriza la transmisión de los datos estrictamente necesarios para completar, registrar, conciliar o auditar la transacción.`,
    },
    {
        id: 9,
        title: 'Información administrativa y operativa',
        body: `El sistema podrá almacenar, procesar y generar información relacionada con:

Propietarios, residentes, arrendatarios y ocupantes.
Unidades residenciales, locales comerciales, clínicas, oficinas o espacios comunes.
Cuotas ordinarias, extraordinarias, recargos, multas y estados de cuenta.
Solicitudes de mantenimiento, incidencias y reservas.
Comunicaciones internas, votaciones y notificaciones.
Control de acceso, visitas, proveedores y entregas.
Documentos adjuntos relacionados con la administración del inmueble.

El Cliente será responsable de contar con base legítima para cargar datos de terceros y de informar a los titulares, cuando corresponda, sobre su incorporación al sistema.`,
    },
    {
        id: 10,
        title: 'Propiedad y responsabilidad sobre los datos',
        body: `El Cliente conserva la titularidad y responsabilidad sobre los datos que ingresa al sistema o que solicita procesar mediante la plataforma. El proveedor actúa como prestador tecnológico y podrá tratar los datos exclusivamente para:

Prestar el servicio.
Dar soporte técnico.
Realizar respaldos y restauración.
Mantener seguridad y trazabilidad.
Prevenir fraudes e incidentes.
Cumplir obligaciones legales o requerimientos de autoridad competente.

El Cliente garantiza que los datos ingresados son lícitos, pertinentes, exactos y obtenidos conforme a la normativa aplicable y a sus propias políticas internas.`,
    },
    {
        id: 11,
        title: 'Confidencialidad y seguridad',
        body: `El proveedor implementará medidas razonables de seguridad técnicas, administrativas y organizativas para proteger la información contra acceso no autorizado, pérdida, alteración, divulgación o destrucción.

Estas medidas podrán incluir, entre otras, control de acceso, autenticación, cifrado, registro de eventos, segregación de entornos, respaldos y monitoreo de seguridad. Sin embargo, el proveedor no garantiza seguridad absoluta frente a eventos ajenos a su control, como fallas de internet, ataques de terceros, errores del usuario o incidentes de proveedores externos.

El Cliente también deberá adoptar medidas de seguridad internas en sus cuentas, dispositivos y políticas de acceso.`,
    },
    {
        id: 12,
        title: 'Encargados y terceros',
        body: `El proveedor podrá apoyarse en proveedores tecnológicos, servicios de alojamiento, mensajería, analítica, almacenamiento, soporte y procesamiento de pagos para operar la plataforma. Dichos terceros podrán tener acceso limitado a los datos estrictamente necesarios para cumplir su función.

En la medida aplicable, el proveedor exigirá a estos terceros, obligaciones de confidencialidad, seguridad y tratamiento restringido de información.`,
    },
    {
        id: 13,
        title: 'Transferencia y alojamiento de datos',
        body: `El Cliente acepta que los datos puedan ser almacenados o procesados en servidores ubicados dentro o fuera de Guatemala, siempre que ello sea necesario para la prestación del servicio y sujeto a medidas razonables de protección y confidencialidad.

Cuando corresponda una transferencia internacional, el proveedor tomará medidas contractuales y técnicas para resguardar la información y limitar su uso a las finalidades establecidas en este documento.`,
    },
    {
        id: 14,
        title: 'Derechos de los titulares',
        body: `En ausencia de una ley integral única plenamente vigente sobre protección de datos personales en Guatemala, este documento reconoce como principios de tratamiento la finalidad, proporcionalidad, confidencialidad, acceso razonable, rectificación, actualización y cancelación cuando proceda, en armonía con la protección constitucional de la privacidad y el acceso/corrección de datos.

El titular de los datos podrá solicitar al Cliente o al canal designado por este:

Acceso a sus datos.
Corrección o actualización.
Eliminación o supresión cuando legalmente sea posible.
Limitación del uso en los casos aplicables.

Las solicitudes deberán dirigirse al correo de privacidad indicado por el proveedor o por el Cliente administrador, según corresponda.`,
    },
    {
        id: 15,
        title: 'Conservación de información',
        body: `Los datos se conservarán mientras exista relación contractual y, posteriormente, durante el tiempo necesario para:

Cumplir obligaciones legales, contables o fiscales.
Atender auditorías o controversias.
Mantener trazabilidad histórica de pagos y administración.
Responder requerimientos de autoridad competente.

Una vez vencidos esos plazos, los datos podrán ser eliminados, anonimizados o bloqueados de forma segura, según corresponda.`,
    },
    {
        id: 16,
        title: 'Notificaciones electrónicas',
        body: `El Cliente y los Usuarios aceptan que las comunicaciones realizadas por correo electrónico, dentro de la plataforma o por otros medios electrónicos habilitados tendrán validez para efectos operativos, administrativos y de notificación, en la medida permitida por la legislación aplicable. El marco guatemalteco reconoce la validez de las comunicaciones y firmas electrónicas bajo el Decreto 47-2008.`,
    },
    {
        id: 17,
        title: 'Firma y aceptación electrónica',
        body: `La aceptación de estos Términos y Condiciones mediante casilla de verificación, clic de aceptación, firma electrónica, correo de confirmación o cualquier otro mecanismo electrónico habilitado por el proveedor se considerará una manifestación válida de consentimiento, siempre que permita identificar razonablemente al aceptante y conservar evidencia de la aceptación.`,
    },
    {
        id: 18,
        title: 'Limitación de responsabilidad',
        body: `En la máxima medida permitida por la ley, el proveedor no será responsable por:

Caídas de internet, fallas eléctricas o interrupciones de terceros.
Errores derivados de información incorrecta cargada por el Cliente.
Rechazos de pago por parte de bancos, emisores o pasarelas.
Pérdidas indirectas, daños consecuenciales o lucro cesante.
Uso indebido de la plataforma por usuarios o terceros autorizados por el Cliente.

La responsabilidad del proveedor, si llegare a existir, quedará limitada a los supuestos expresamente previstos en el contrato comercial aplicable y dentro de los límites permitidos por la ley.`,
    },
    {
        id: 19,
        title: 'Suspensión y terminación del servicio',
        body: `El proveedor podrá suspender o terminar el acceso al servicio, con o sin previo aviso cuando sea legalmente procedente, si ocurre cualquiera de los siguientes supuestos:

Falta de pago.
Incumplimiento de estos Términos.
Riesgo de fraude o seguridad.
Uso ilícito o no autorizado de la plataforma.
Requerimiento de autoridad competente.

Al terminar el servicio, el acceso del Cliente podrá ser desactivado, sin perjuicio de la conservación de respaldos, registros o facturación conforme a la ley y a este documento.`,
    },
    {
        id: 20,
        title: 'Modificaciones',
        body: `El proveedor podrá modificar estos Términos y Condiciones y esta Política de Uso de Datos cuando lo estime necesario por razones operativas, legales, de seguridad o de mejora del servicio. La versión vigente será la publicada en la plataforma o comunicada al Cliente por los medios disponibles.

El uso continuado del servicio después de la fecha de entrada en vigor de una modificación implicará la aceptación de los cambios.`,
    },
    {
        id: 21,
        title: 'Ley aplicable y jurisdicción',
        body: `Este documento se regirá por las leyes de la República de Guatemala. Cualquier controversia derivada de su interpretación, ejecución o cumplimiento será sometida a los tribunales competentes de Guatemala, salvo que el contrato comercial aplicable establezca un mecanismo distinto de solución de controversias.`,
    },
    {
        id: 22,
        title: 'Contacto',
        body: `Para consultas relacionadas con estos Términos, la privacidad de datos o el tratamiento de pagos, puede contactarnos en:

Correo: (PENDIENTE DE CONFIRMAR)
Teléfono: (PENDIENTE DE CONFIRMAR)
Dirección: (PENDIENTE DE CONFIRMAR)`,
    },
];
