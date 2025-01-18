# Sistema de Gestión Bibliotecaria (SGB)

Un sistema moderno para la gestión de bibliotecas, desarrollado con React y Vite.

## 🚀 Características

- Gestión de usuarios (estudiantes, bibliotecarios, administradores)
- Catálogo de libros con búsqueda avanzada
- Sistema de reservas y préstamos
- Historial de transacciones
- Notificaciones en tiempo real
- Panel de administración
- Reportes y estadísticas
- Interfaz responsiva y moderna

## 🛠️ Tecnologías

- React 18
- Vite
- Firebase (Auth, Firestore, Functions)
- TailwindCSS
- Shadcn/ui
- React Router DOM
- Tanstack Table
- Framer Motion
- Date-fns

## 📦 Instalación

1. Clona el repositorio:

```bash
git clone https://github.com/usuario/sgb.git
cd sgb
```

2. Instala las dependencias:

```bash
npm install
```

3. Crea un archivo `.env` con las variables de entorno necesarias:

```env
VITE_FIREBASE_API_KEY=tu_api_key
VITE_FIREBASE_AUTH_DOMAIN=tu_auth_domain
VITE_FIREBASE_PROJECT_ID=tu_project_id
VITE_FIREBASE_STORAGE_BUCKET=tu_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
VITE_FIREBASE_APP_ID=tu_app_id
```

4. Inicia el servidor de desarrollo:

```bash
npm run dev
```

## 🔧 Comandos Disponibles

- `npm run dev` - Inicia el servidor de desarrollo
- `npm run build` - Crea una build de producción
- `npm run preview` - Previsualiza la build de producción
- `npm run lint` - Ejecuta el linter

## 📱 Capturas de Pantalla

![Bienvenida](/screenshots/dashboard.png)
_Página de bienvenida y dashboard principal_

![Inicio](/screenshots/loans.png)
\_Sistema de gestión de inicio de sesion

![Catálogo](/screenshots/catalog.png)
_Catálogo de libros con sistema de búsqueda_

## 👥 Roles de Usuario

### Estudiante

- Buscar y reservar libros
- Ver historial de préstamos
- Gestionar lista de lecturas futuras
- Recibir notificaciones

### Bibliotecario (ATM)

- Gestionar préstamos y devoluciones
- Administrar catálogo de libros
- Procesar solicitudes de reserva
- Ver reportes básicos

### Administrador

- Gestión completa de usuarios
- Acceso a todos los reportes
- Configuración del sistema
- Gestión de permisos

## 🤝 Contribuir

Las contribuciones son siempre bienvenidas. Por favor, lee el archivo CONTRIBUTING.md para más detalles.

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - mira el archivo LICENSE.md para más detalles.

## 📧 Contacto

Nombre - [@Gothan15](https://twitter.com/Gothan15)
Email - gothanramirez@gmail.com

Link del proyecto: [https://github.com/Gothan15/sgb](https://github.com/Gothan15/sgb)
