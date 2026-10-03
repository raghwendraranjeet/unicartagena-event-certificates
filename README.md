# IV Simposio — Registro y certificados

Aplicación web para inscribir asistentes o ponentes y generar certificados personalizados de la Universidad de Cartagena.

## Iniciar

Requiere Node.js 22 o posterior. Desde esta carpeta, ejecuta:

```powershell
node server.mjs
```

Luego abre [http://localhost:8000](http://localhost:8000). La primera ejecución crea `registrations.db` con una sola tabla (`registrations`). Los certificados se pueden imprimir o guardar como PDF desde el diálogo de impresión del navegador.

## Publicar en Render

Este repositorio incluye `render.yaml` para crear un servicio web con almacenamiento persistente para SQLite. En Render, elige **New > Blueprint**, conecta este repositorio y confirma la configuración. El servicio necesita un plan de pago para conservar la base de datos; Render factura el cómputo y el disco por separado. Consulta [precios actuales](https://render.com/pricing) antes de confirmar la creación.

## Datos guardados

La tabla guarda nombre, ID de participante, correo, teléfono, institución, tipo de participación, nombre de usuario y hash de contraseña. El ID se genera como `UDC-año-serial`; la contraseña se almacena con salt y hash, nunca como texto legible. Cada usuario inicia sesión desde la sección de certificados para abrir e imprimir o guardar el certificado.

