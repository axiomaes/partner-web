// partner-web/src/pages/legal/AvisoLegal.tsx
import AppLayout from "@/layout/AppLayout";

const SITE_OWNER = "La Cubierta Barbería"; // <Titular del sitio>
const SITE_HOLDER_ID = "<NIF/CIF>";
const SITE_ADDRESS = "<Dirección completa>";
const SITE_EMAIL = "<correo@tudominio.com>";
const SITE_PHONE = "<+34 ...>";

export default function AvisoLegal() {
  return (
    <AppLayout title="Aviso Legal">
      <div className="prose max-w-none">
        <h2>Identificación</h2>
        <p>
          Titular: <strong>{SITE_OWNER}</strong> — NIF/CIF: {SITE_HOLDER_ID}
          <br />
          Domicilio: {SITE_ADDRESS}
          <br />
          Contacto: {SITE_EMAIL} · {SITE_PHONE}
        </p>

        <h2>Condiciones de uso</h2>
        <p>
          El acceso y uso de este sitio web implica la aceptación de las presentes condiciones y
          de las políticas que se indiquen. Te comprometes a utilizar el sitio conforme a la ley,
          la buena fe y el orden público, y a no realizar conductas que puedan dañar derechos o
          intereses de terceros.
        </p>

        <h2>Propiedad intelectual e industrial</h2>
        <p>
          Salvo indicación en contrario, los contenidos (textos, logotipos, imágenes, interfaz,
          software) pertenecen al titular o a terceros con licencia. Queda prohibida su
          reproducción, transformación o distribución sin autorización expresa.
        </p>

        <h2>Responsabilidad</h2>
        <p>
          El titular no garantiza la ausencia de interrupciones o errores y no se hace responsable
          de daños derivados del uso del sitio cuando concurran causas fuera de su control
          razonable. Los enlaces a sitios de terceros son meramente informativos; el titular no
          asume responsabilidad sobre sus contenidos.
        </p>

        <h2>Protección de datos</h2>
        <p>
          El tratamiento de datos personales se rige por la{" "}
          <a className="link" href="/legal/privacidad">Política de Privacidad</a>.
        </p>

        <h2>Ley aplicable y jurisdicción</h2>
        <p>
          Este aviso se rige por la legislación española. Para cualquier controversia, las partes
          se someten, con renuncia expresa a cualquier otro fuero, a los Juzgados y Tribunales de{" "}
          <strong>Madrid (España)</strong>, salvo que la normativa de consumo disponga otro fuero
          imperativo.
        </p>
      </div>
    </AppLayout>
  );
}
