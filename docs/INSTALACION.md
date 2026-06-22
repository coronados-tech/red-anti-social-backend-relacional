# Instalación y ejecución

Guía para instalar dependencias, configurar el entorno y levantar el backend de **UnaHur Anti-Social Net**.

## Requisitos previos

- [Node.js](https://nodejs.org/) **18 o superior** (recomendado LTS)
- [npm](https://www.npmjs.com/) (incluido con Node.js)
- Git (para clonar el repositorio)

> Con la configuración por defecto (**SQLite**) no hace falta instalar ningún motor de base de datos aparte.

## 1. Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd anti-social-relational-tp-coronados-tech
```

## 2. Instalar dependencias

```bash
npm install
```

## 3. Configurar variables de entorno

Copiá el archivo de ejemplo y editá los valores si lo necesitás:

```bash
# Windows (PowerShell)
Copy-Item .env.Example .env

# Linux / macOS
cp .env.Example .env
```

### Variables principales

| Variable                  | Descripción                                                    | Valor por defecto                |
| ------------------------- | -------------------------------------------------------------- | -------------------------------- |
| `PORT`                    | Puerto del servidor                                            | `3001`                           |
| `MESES`                   | Antigüedad máxima (en meses) para mostrar comentarios en posts | `6`                              |
| `IDIOMA`                  | Idioma de los mensajes de la API                               | `es`                             |
| `DB_DIALECT`              | Motor de BD: `sqlite`, `mysql`, `mariadb` o `postgres`         | `sqlite`                         |
| `DB_STORAGE`              | Ruta del archivo SQLite (solo si usás SQLite)                  | `data/datastore.db`              |
| `CACHE_POSTS_ENABLED`     | Caché en memoria para GET de posts                             | `true`                           |
| `CACHE_POSTS_TTL_SECONDS` | TTL del caché en segundos                                      | `60`                             |
| `ENABLE_SWAGGER`          | Habilita Swagger UI en producción                              | desactivado salvo que sea `true` |

El archivo `.env.Example` incluye el resto de variables para MySQL, MariaDB y PostgreSQL.

### SQLite (configuración recomendada para desarrollo)

No requiere pasos extra. Al iniciar la app se crea automáticamente la carpeta `data/` y el archivo de base de datos.

```env
DB_DIALECT=sqlite
DB_STORAGE=data/datastore.db
```

### MySQL / MariaDB / PostgreSQL

1. Creá la base de datos en el servidor (por ejemplo `anti-social`).
2. Ajustá `.env`:

```env
DB_DIALECT=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=anti-social
DB_USER=root
DB_PASSWORD=tu_password
```

Para PostgreSQL usá `DB_DIALECT=postgres` y `DB_PORT=5432`.

## 4. Levantar la aplicación

### Modo desarrollo (con recarga automática)

```bash
npm run dev
```

### Modo producción

```bash
npm start
```

Si todo salió bien, verás en consola:

```text
App iniciada en el puerto 3001
```

## 5. Verificar que funciona

| Recurso    | URL                           |
| ---------- | ----------------------------- |
| API base   | http://localhost:3001         |
| Swagger UI | http://localhost:3001/swagger |

Ejemplo rápido:

```bash
curl http://localhost:3001/users
```

Deberías recibir un array JSON (vacío si aún no hay usuarios).

## Probar con Postman

En la carpeta `docs/` está la colección:

- `docs/Api-Antisocial.postman_collection.json`

Importala en Postman y configurá la variable de entorno `baseUrl` con `http://localhost:3001` (o el puerto que hayas definido en `PORT`).

## Estructura generada al ejecutar

La aplicación crea automáticamente:

- `data/` — base de datos SQLite (si usás ese dialecto)
- `uploads/posts/` — imágenes subidas por la API

## Notas importantes

- Swagger UI está habilitado por defecto fuera de `NODE_ENV=production`. En producción podés activarlo con `ENABLE_SWAGGER=true`.
- Las imágenes aceptadas son **JPEG, PNG y WebP**, con un tamaño máximo de **5 MB**.
