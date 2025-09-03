// partner-web/src/pages/legal/Cookies.tsx
import AppLayout from "@/layout/AppLayout";

export default function Cookies() {
  return (
    <AppLayout title="Política de Cookies">
      <div className="prose max-w-none">
        <p>
          En este sitio utilizamos cookies propias necesarias para el funcionamiento y la seguridad
          de la aplicación. No instalamos cookies analíticas o publicitarias sin tu consentimiento.
        </p>

        <h2>¿Qué son las cookies?</h2>
        <p>
          Pequeños archivos que se almacenan en tu dispositivo al navegar. Sirven para recordar tus
          preferencias o mantener la sesión iniciada.
        </p>

        <h2>Cookies que usamos</h2>
        <table>
          <thead>
            <tr>
              <th>Cookie/Storage</th>
              <th>Tipo</th>
              <th>Finalidad</th>
              <th>Duración</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>partner_jwt</code> (localStorage)</td>
              <td>Técnica / necesaria</td>
              <td>Autenticación del panel (staff/admin).</td>
              <td>Hasta cierre de sesión o limpieza del navegador.</td>
            </tr>
            <tr>
              <td><code>axioma_portal</code> (localStorage)</td>
              <td>Técnica / necesaria</td>
              <td>Autenticación del portal de cliente (token OTP).</td>
              <td>Hasta cierre de sesión o limpieza del navegador.</td>
            </tr>
          </tbody>
        </table>

        <p>
          Si en el futuro activamos analíticas (p. ej., Google Analytics) o mediciones de
          conversión, te pediremos consentimiento previo y te informaremos aquí.
        </p>

        <h2>Cómo cambiar o bloquear cookies</h2>
        <p>
          Puedes configurar tu navegador para bloquear o eliminar cookies. Ten en cuenta que las
          cookies técnicas son necesarias para el inicio de sesión y algunas funciones podrían no
          estar disponibles sin ellas.
        </p>

        <h2>Actualizaciones</h2>
        <p>
          Podemos actualizar esta política por requisitos legales o técnicos. Publicaremos siempre
          la versión vigente en esta página.
        </p>
      </div>
    </AppLayout>
  );
}
