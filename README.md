<div align="center">

# 🤖 DarBot

### Sistema Integral de Gestión Escolar

**Sitio público dinámico + Panel administrativo + Chatbot inteligente**

[![Java](https://img.shields.io/badge/Java-17-orange?style=for-the-badge\&logo=openjdk)](https://openjdk.org/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-4.1.0-6DB33F?style=for-the-badge\&logo=spring-boot)](https://spring.io/projects/spring-boot)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?style=for-the-badge\&logo=postgresql)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge\&logo=docker)](https://www.docker.com/)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

</div>

---

## 📖 Descripción

**DarBot** es una plataforma web para la **Institución Educativa Darío Torregroza Pérez**, orientada a centralizar y administrar la información institucional mediante una aplicación web con base de datos.

El sistema integra un **sitio web público**, un **panel administrativo** y un **chatbot institucional**, permitiendo gestionar contenidos sin modificar directamente el código fuente.

### 🎯 Objetivos

* Centralizar la información institucional en una base de datos.
* Permitir que el personal autorizado gestione el contenido desde un panel administrativo.
* Facilitar el acceso público a información institucional.
* Proporcionar un chatbot capaz de responder preguntas utilizando información almacenada en la base de datos.
* Mantener una arquitectura modular, escalable y mantenible.

---

## ✨ Funcionalidades

### 🌐 Sitio público

* Información institucional.
* Misión, visión e historia.
* Sedes y servicios.
* Noticias y eventos.
* Documentos institucionales.
* Galería de imágenes.
* Información de matrícula.
* Información de contacto.
* Chatbot institucional.

### 🔐 Panel administrativo

* Gestión de usuarios y roles.
* Gestión de noticias.
* Gestión de eventos.
* Gestión de documentos.
* Gestión de galería.
* Gestión de información institucional.
* Gestión de estadísticas.
* Gestión del equipo.
* Gestión de valores institucionales.
* Gestión de servicios.
* Configuración general.
* Gestión del chatbot.
* Gestión de preguntas sin respuesta.
* Estadísticas del chatbot.
* Gestión de caché.
* Perfil del administrador.

---

## 🤖 Chatbot

DarBot incorpora un chatbot institucional basado en conocimiento almacenado en PostgreSQL.

El sistema no depende de una API externa de inteligencia artificial. El procesamiento de las preguntas utiliza información estructurada en la base de datos y diferentes mecanismos de identificación:

* Palabras clave.
* Frases específicas.
* Sinónimos.
* Contexto de conversación.
* Patrones de negación.
* Registro de preguntas sin respuesta.
* Sistema de retroalimentación.

### Flujo de procesamiento

```text
Usuario
   │
   ▼
Pregunta
   │
   ▼
Normalización del texto
   │
   ▼
Detección de intención
   │
   ├── Palabras clave
   ├── Frases específicas
   ├── Sinónimos
   ├── Patrones de negación
   └── Contexto de conversación
   │
   ▼
Búsqueda de información
   │
   ├── FAQs
   ├── Noticias
   ├── Eventos
   ├── Documentos
   └── Información institucional
   │
   ▼
Generación de respuesta
   │
   ▼
Usuario
```

Las preguntas que no pueden ser respondidas correctamente pueden registrarse para su posterior análisis y gestión desde el panel administrativo.

---

## 🛠️ Tecnologías utilizadas

### Backend

| Tecnología      | Versión / Uso          |
| --------------- | ---------------------- |
| Java            | 17                     |
| Spring Boot     | 4.1.0                  |
| Spring Data JPA | Persistencia           |
| Hibernate       | ORM                    |
| Spring Security | Seguridad              |
| JWT             | Autenticación          |
| BCrypt          | Cifrado de contraseñas |
| Maven           | Gestión y construcción |
| Caffeine        | Caché                  |

### Base de datos

| Tecnología | Versión |
| ---------- | ------- |
| PostgreSQL | 15      |

### Frontend

| Tecnología      | Uso                  |
| --------------- | -------------------- |
| HTML5           | Estructura           |
| CSS3            | Estilos              |
| JavaScript ES6+ | Lógica e interacción |
| Bootstrap 5.3   | Componentes y diseño |
| Font Awesome 6  | Iconografía          |
| AOS             | Animaciones          |

### DevOps

| Tecnología       | Uso                        |
| ---------------- | -------------------------- |
| Docker           | Contenedores               |
| Docker Compose   | Orquestación               |
| Volúmenes Docker | Persistencia de PostgreSQL |
| Git / GitHub     | Control de versiones       |

---

## 📋 Requisitos

Para ejecutar el proyecto mediante Docker se recomienda contar con:

| Herramienta    | Versión mínima |
| -------------- | -------------- |
| Docker         | 20.10+         |
| Docker Compose | 2.0+           |

Para ejecución local:

| Herramienta | Versión                         |
| ----------- | ------------------------------- |
| Java        | 17+                             |
| Maven       | Incluido mediante Maven Wrapper |
| Python      | 3.8+                            |

---

## 🚀 Instalación y Ejecución

### Opción 1: Docker Compose (Recomendado)

Docker Compose permite ejecutar DarBot junto con PostgreSQL sin instalar ni configurar manualmente el servidor de base de datos.

```bash
# 1. Clonar el repositorio
git clone https://github.com/Olaya10/DarBot.git
cd DarBot

# 2. Construir las imágenes y levantar los servicios
docker compose up -d --build

# 3. Verificar el estado de los contenedores
docker compose ps
```

Los servicios principales son:

* **Backend:** Spring Boot + Java 17
* **Base de datos:** PostgreSQL 15
* **Persistencia:** volumen Docker `pgdata_darbot`

Una vez iniciados los servicios:

| Servicio      | URL                         |
| ------------- | --------------------------- |
| Backend / API | `http://localhost:8080`     |
| API           | `http://localhost:8080/api` |
| PostgreSQL    | `localhost:5432`            |

Para detener los servicios:

```bash
docker compose down
```

Para detenerlos y eliminar también el volumen de PostgreSQL:

```bash
docker compose down -v
```

> **Nota:** El comando `docker compose down -v` elimina los datos almacenados en el volumen de PostgreSQL.

### Opción 2: Ejecución local

Para ejecutar el backend sin Docker, se requiere Java 17.

```bash
cd backend
./mvnw spring-boot:run
```

El backend estará disponible en:

```text
http://localhost:8080
```

Para ejecutar el frontend de forma independiente:

```bash
cd frontend
python3 -m http.server 5500
```

El sitio público estará disponible en:

```text
http://localhost:5500
```

Y el panel administrativo en:

```text
http://localhost:5500/admin/
```

> **Nota:** La ejecución local del backend requiere una instancia de PostgreSQL configurada de acuerdo con las propiedades de conexión de la aplicación.

---

## 🔐 Autenticación

DarBot utiliza **Spring Security** y **JWT** para proteger los recursos administrativos.

Endpoints principales:

| Método | Endpoint             | Descripción         |
| ------ | -------------------- | ------------------- |
| POST   | `/api/auth/login`    | Inicio de sesión    |
| POST   | `/api/auth/register` | Registro de usuario |
| GET    | `/api/auth/me`       | Usuario autenticado |
| POST   | `/api/auth/logout`   | Cierre de sesión    |

---

## 🔌 API

La API REST está organizada por módulos funcionales:

| Módulo         | Ruta base            | Función                                   |
| -------------- | -------------------- | ----------------------------------------- |
| Autenticación  | `/api/auth`          | Login, registro y sesión                  |
| Público        | `/api/public`        | Información pública                       |
| Institucional  | `/api/institucional` | Información, sedes, contactos y servicios |
| Contenidos     | `/api/contenidos`    | Noticias, eventos y documentos            |
| Chatbot        | `/api/chatbot`       | Preguntas y retroalimentación             |
| Administración | `/api/admin`         | Gestión administrativa                    |

---

## 📁 Estructura del proyecto

```text
DarBot/
├── backend/
│   ├── src/
│   ├── pom.xml
│   ├── mvnw
│   └── Dockerfile
│
├── frontend/
│   ├── admin/
│   ├── imagenes/
│   ├── documentos/
│   ├── index.html
│   ├── institucional.html
│   ├── noticias.html
│   ├── documentos.html
│   ├── galeria.html
│   ├── matricula.html
│   ├── contacto.html
│   ├── script.js
│   ├── style.css
│   └── config.js
│
├── database/
├── docs/
├── docker-compose.yml
└── README.md
```

---

## 🧩 Arquitectura del backend

El backend está organizado por módulos y responsabilidades:

* **auth:** autenticación, autorización y gestión de sesiones.
* **chatbot:** procesamiento de preguntas, intenciones, conocimiento, contexto, feedback y preguntas sin respuesta.
* **contenidos:** noticias, eventos y documentos.
* **galeria:** gestión de imágenes de la institución.
* **institucional:** información general, sedes, áreas, contactos y servicios.
* **publico:** recursos disponibles para visitantes.
* **usuarios:** administración de usuarios y roles.
* **config:** configuración general de la aplicación.
* **common:** componentes y utilidades compartidas.

Esta organización busca mantener separadas las responsabilidades principales del sistema y facilitar su mantenimiento y evolución.

---

## 🐳 Docker

El backend utiliza una construcción **multi-stage** para separar el proceso de compilación del entorno de ejecución.

La aplicación se ejecuta sobre **Java 17** y los servicios se comunican mediante una red Docker definida en `docker-compose.yml`.

PostgreSQL utiliza un volumen persistente para conservar la información de la aplicación entre reinicios de los contenedores.

### Contenedores

El entorno principal está compuesto por:

```text
┌──────────────────────────────┐
│            DarBot            │
│                              │
│    Spring Boot / Java 17     │
│          Puerto 8080         │
└──────────────┬───────────────┘
               │
               │ JDBC
               ▼
┌──────────────────────────────┐
│         PostgreSQL 15        │
│          Puerto 5432         │
│                              │
│      Volumen pgdata_darbot   │
└──────────────────────────────┘
```

---

## 📊 Estado del proyecto

DarBot se encuentra en desarrollo y cuenta actualmente con:

* Backend funcional basado en Spring Boot.
* Base de datos PostgreSQL.
* API REST organizada por módulos.
* Autenticación mediante JWT.
* Sitio web público.
* Panel administrativo.
* Gestión de contenidos mediante base de datos.
* Chatbot basado en conocimiento almacenado en base de datos.
* Registro de preguntas sin respuesta.
* Sistema de retroalimentación del chatbot.
* Ejecución mediante Docker Compose.

---

## 📄 Licencia

Este proyecto se distribuye bajo la licencia MIT.

---

<div align="center">

**DarBot - Institución Educativa Darío Torregroza Pérez**

Desarrollado como proyecto académico de Ingeniería de Sistemas.

</div>
