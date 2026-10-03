# Website Documentation / Documentación del sitio web

## English

### Overview

This project is an event registration and certificate website for the IV Simposio at Universidad de Cartagena. It supports attendee and speaker registrations, participant accounts, personalized certificates, and a sample certificate preview.

### Website features

- Homepage with event information and registration entry points.
- Registration form for full name, email, phone/WhatsApp, institution, username, password, and participation type (attendee or speaker).
- Automatically assigned participant IDs in the format `UDC-YYYY-NNNN` (for example, `UDC-2026-0001`). The server assigns the final sequential number when it saves the registration.
- Login area for registered participants.
- Personalized attendance or speaker certificate using the supplied certificate artwork. The certificate includes the participant name and ID, and can be previewed and downloaded as a high-resolution PNG or printed/saved as PDF.
- Sample certificate preview and download. Its sample ID is for demonstration only; the certificate is marked as a sample and is not valid proof of attendance.

### Technology and files

- `index.html`: responsive website interface, registration and login forms, certificate preview, and browser-side certificate export.
- `server.mjs`: Node.js HTTP server and JSON API. It also serves the website files.
- `certificate-template.jpg`: certificate background artwork.
- `unicartagena-logo.png`: university crest artwork used in the header.
- `registrations.db`: SQLite database created automatically when the server starts.
- `render.yaml`: Render Blueprint configuration for hosting the Node.js app with a persistent disk.
- `.node-version`: specifies Node.js 22.

The database uses a single `registrations` table. It stores participant details and a salted password hash. Passwords are not stored as readable text. A unique index prevents duplicate usernames.

### Run locally

1. Install Node.js 22 or newer.
2. Open a terminal in the project folder.
3. Start the website:

   ```sh
   node server.mjs
   ```

4. Open [http://localhost:8000](http://localhost:8000).

The server creates `registrations.db` and the `registrations` table on first startup. Keep the database file safe and backed up if it contains real registrations.

### API routes

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | Server health check |
| `GET` | `/api/next-id` | Preview the next available participant ID |
| `POST` | `/api/register` | Validate and save a participant registration |
| `POST` | `/api/login` | Sign in and start a session |
| `GET` | `/api/me` | Return the signed-in participant |
| `POST` | `/api/logout` | End the current session |

### Hosting notes

GitHub Pages hosts static files only. It can display the homepage and sample certificate, but it cannot run `server.mjs`, save registrations, log participants in, or issue unique IDs by itself. Those features require the Node.js server to be hosted and the site to send `/api` requests to that server. When using GitHub Pages as the frontend, set the `api-base` meta tag in `index.html` to the backend service's origin and set the backend's `PUBLIC_SITE_ORIGIN` environment variable to `https://raghwendraranjeet.github.io`. The server allows credentialed API requests from that exact origin. The included Render Blueprint is one hosting option; persistent storage for SQLite requires a paid persistent disk. Check the provider's current prices before creating paid resources. Do not use a temporary filesystem for real registrations because it can be cleared when a service restarts or redeploys.

---

## Español

### Descripción general

Este proyecto es un sitio web de inscripción y certificados para el IV Simposio de la Universidad de Cartagena. Permite inscribir asistentes y ponentes, crear cuentas de participantes, generar certificados personalizados y mostrar una vista previa de un certificado de muestra.

### Funciones del sitio

- Página principal con información del evento y opciones para inscribirse.
- Formulario de inscripción con nombre completo, correo electrónico, teléfono/WhatsApp, institución, nombre de usuario, contraseña y tipo de participación (asistente o ponente).
- Generación automática del ID de participante con el formato `UDC-AAAA-NNNN` (por ejemplo, `UDC-2026-0001`). El servidor asigna el número consecutivo definitivo al guardar la inscripción.
- Área de inicio de sesión para participantes inscritos.
- Certificado personalizado de asistencia o ponencia, basado en el diseño suministrado. Incluye el nombre y el ID del participante; se puede previsualizar, descargar como PNG de alta resolución o imprimir/guardar como PDF.
- Vista previa y descarga de un certificado de muestra. Su ID es solo demostrativo; el certificado está marcado como muestra y no acredita asistencia.

### Tecnologías y archivos

- `index.html`: interfaz adaptable, formularios de inscripción e inicio de sesión, vista previa y exportación del certificado en el navegador.
- `server.mjs`: servidor HTTP de Node.js y API JSON. También sirve los archivos del sitio.
- `certificate-template.jpg`: imagen de fondo del certificado.
- `unicartagena-logo.png`: imagen del escudo universitario del encabezado.
- `registrations.db`: base de datos SQLite que se crea automáticamente al iniciar el servidor.
- `render.yaml`: configuración Blueprint de Render para alojar la aplicación Node.js con disco persistente.
- `.node-version`: especifica Node.js 22.

La base de datos utiliza una sola tabla llamada `registrations`. Guarda los datos de los participantes y un hash de contraseña con salt. Las contraseñas no se almacenan como texto legible. Un índice único evita nombres de usuario duplicados.

### Ejecutar en el equipo local

1. Instala Node.js 22 o una versión posterior.
2. Abre una terminal en la carpeta del proyecto.
3. Inicia el sitio:

   ```sh
   node server.mjs
   ```

4. Abre [http://localhost:8000](http://localhost:8000).

Al iniciar por primera vez, el servidor crea `registrations.db` y la tabla `registrations`. Si contiene inscripciones reales, conserva una copia de seguridad del archivo de base de datos.

### Rutas de la API

| Método | Ruta | Función |
| --- | --- | --- |
| `GET` | `/api/health` | Comprobar el estado del servidor |
| `GET` | `/api/next-id` | Consultar una vista previa del siguiente ID disponible |
| `POST` | `/api/register` | Validar y guardar una inscripción |
| `POST` | `/api/login` | Iniciar sesión y crear una sesión |
| `GET` | `/api/me` | Consultar el participante con sesión iniciada |
| `POST` | `/api/logout` | Finalizar la sesión actual |

### Notas de alojamiento

GitHub Pages solo aloja archivos estáticos. Puede mostrar la página principal y el certificado de muestra, pero por sí solo no puede ejecutar `server.mjs`, guardar inscripciones, iniciar sesiones ni asignar IDs únicos. Esas funciones requieren alojar el servidor Node.js y enviar las solicitudes `/api` del sitio a ese servidor. Si se usa GitHub Pages como interfaz, configura la etiqueta meta `api-base` en `index.html` con el origen del servicio backend y configura la variable de entorno `PUBLIC_SITE_ORIGIN` del servidor como `https://raghwendraranjeet.github.io`. El servidor permite solicitudes API con credenciales desde ese origen exacto. El Blueprint de Render incluido es una opción de alojamiento; el almacenamiento persistente de SQLite requiere un disco de pago. Consulta los precios vigentes antes de crear recursos pagos. No uses un sistema de archivos temporal para inscripciones reales, porque los datos pueden borrarse al reiniciar o volver a publicar el servicio.

