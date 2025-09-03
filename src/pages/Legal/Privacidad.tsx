// partner-web/src/pages/legal/Privacidad.tsx
import AppLayout from "@/layout/AppLayout";

const BUSINESS_NAME = "La Cubierta Barbería"; // <Rellena razón social exacta>
const BUSINESS_HOLDER = "La Cubierta Barbería"; // <Titular legal si difiere>
const BUSINESS_NIF = "<NIF/CIF>";
const BUSINESS_ADDRESS = "<Dirección completa>";
const BUSINESS_EMAIL = "<correo@tudominio.com>";
const BUSINESS_PHONE = "<+34 ...>";
const DPO_EMAIL = ""; // opcional, si tienes Delegado de Protección de Datos

export default function Privacidad() {
  return (
    <AppLayout title="Política de Privacidad (RGPD)">
      <div className="prose max-w-none">
        <p>
          En esta política te explicamos cómo tratamos tus datos personales conforme al
          Reglamento (UE) 2016/679 (RGPD) y la LOPDGDD.
        </p>

        <h2>1. Responsable del tratamiento</h2>
        <p>
          <strong>{BUSINESS_HOLDER}</strong> ({BUSINESS_NAME}) — NIF: {BUSINESS_NIF}
          <br />
          Domicilio: {BUSINESS_ADDRESS}
          <br />
          Contacto: {BUSINESS_EMAIL} · {BUSINESS_PHONE}
          {DPO_EMAIL ? (
            <>
              <br />
              Delegado de Protección de Datos: {DPO_EMAIL}
            </>
          ) : null}
        </p>

        <h2>2. Datos que tratamos</h2>
        <ul>
          <li>Identificativos: nombre, teléfono, email.</li>
          <li>Datos de uso del programa de fidelización: visitas, recompensas, notas internas.</li>
          <li>Preferencias de comunicación (WhatsApp, email, SMS).</li>
          <li>Opcionalmente: fecha de cumpleaños para promociones y recordatorios.</li>
        </ul>

        <h2>3. Finalidades</h2>
        <ul>
          <li>Gestionar tu adhesión al programa de fidelización y calcular recompensas.</li>
          <li>Atender tu check-in en el establecimiento y registrar visitas.</li>
          <li>
            Enviar comunicaciones transaccionales (p. ej., tu código QR) y, si lo aceptas,
            comunicaciones comerciales sobre servicios, promociones o novedades.
          </li>
          <li>Atender el ejercicio de derechos en materia de protección de datos.</li>
        </ul>

        <h2>4. Legitimación</h2>
        <ul>
          <li>
            <strong>Ejecución de contrato/servicio</strong>: gestionar el programa de
            fidelización y el check-in.
          </li>
          <li>
            <strong>Consentimiento</strong>: comunicaciones comerciales, uso de cumpleaños,
            y canal preferido (WhatsApp/email/SMS).
          </li>
          <li>
            <strong>Interés legítimo</strong>: seguridad, prevención del fraude, mejora del
            servicio (minimizado y ponderado).
          </li>
          <li>
            <strong>Obligación legal</strong>: atención de derechos y requerimientos de
            autoridades.
          </li>
        </ul>

        <h2>5. Conservación</h2>
        <p>
          Conservamos los datos mientras seas cliente del programa y, después, durante los
          plazos necesarios para atender posibles responsabilidades (con carácter general, hasta
          <strong> 6 años</strong> para documentación mercantil/contable y <strong>3 años</strong> para acciones
          relacionadas con publicidad y consentimiento, salvo normas específicas).
        </p>

        <h2>6. Destinatarios y encargados de tratamiento</h2>
        <p>
          No cedemos tus datos a terceros salvo obligación legal. Para prestar el servicio,
          pueden acceder a tus datos nuestros proveedores (encargados del tratamiento), con
          contratos que cumplen el art. 28 RGPD:
        </p>
        <ul>
          <li>
            <strong>Proveedor de hosting y plataforma</strong> (CapRover en nuestra
            infraestructura) — alojamiento de la aplicación y base de datos.
          </li>
          <li>
            <strong>WhatsApp vía Twilio</strong> — envío de mensajes transaccionales y/o
            comerciales. Titular: Twilio Inc./Twilio Ireland Ltd.
          </li>
          <li>
            <strong>CDN/DNS</strong> (p. ej., Cloudflare) — mejora de rendimiento y seguridad.
          </li>
        </ul>

        <h2>7. Transferencias internacionales</h2>
        <p>
          Algunos proveedores pueden realizar tratamientos fuera del EEE. En tales casos,
          garantizamos las salvaguardas adecuadas (p. ej., <em>Standard Contractual Clauses</em>/
          Cláusulas Contractuales Tipo) y medidas adicionales cuando proceda. Puedes solicitar
          información sobre dichas garantías en {BUSINESS_EMAIL}.
        </p>

        <h2>8. Derechos</h2>
        <p>
          Puedes ejercitar tus derechos de acceso, rectificación, supresión, oposición,
          limitación y portabilidad escribiendo a {BUSINESS_EMAIL} y acreditando tu identidad.
          También puedes retirar el consentimiento en cualquier momento.
        </p>
        <p>
          Si consideras que no hemos tratado tus datos conforme a la normativa, puedes presentar
          una reclamación ante la <a className="link" href="https://www.aepd.es" target="_blank">AEPD</a>.
        </p>

        <h2>9. Seguridad</h2>
        <p>
          Aplicamos medidas técnicas y organizativas apropiadas (control de acceso por roles,
          cifrado en tránsito, copias de seguridad y registro de actividad) para proteger la
          información.
        </p>

        <h2>10. Menores</h2>
        <p>
          No recopilamos intencionadamente datos de menores sin autorización de sus tutores. Si
          detectas algo, contáctanos en {BUSINESS_EMAIL}.
        </p>

        <h2>11. Cambios</h2>
        <p>
          Podremos actualizar esta política para reflejar mejoras o cambios legales. Publicaremos
          la versión vigente en esta misma URL.
        </p>
      </div>
    </AppLayout>
  );
}
