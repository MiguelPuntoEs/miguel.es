---
title: "Teaching materials"
description: "Plantillas y herramientas para la creación de materiales docentes con Pandoc y LaTeX"
layout: "../../layouts/MarkdownLayout.astro"
lang: "es"
---

## Herramientas recomendadas

Tests automatizados:

- [Blooket](https://www.blooket.com)
- [Kahoot](https://kahoot.com/)

## Plantilla para generación de exámenes con LLMs

Usa el siguiente prompt como base para generar exámenes con un LLM (ChatGPT, Claude, etc.). Adapta los campos entre corchetes `[...]` a tu asignatura.

````markdown
Genera un examen con las siguientes características:

**Datos generales:**

- Asignatura: [nombre de la asignatura]
- Universidad: [nombre de la universidad]
- Fecha: [fecha del examen]
- Duración: [duración]
- Puntuación total: [puntos] puntos
- Recursos permitidos: [ninguno / calculadora / apuntes / ...]
- Bloques o temas que cubre: [lista de temas]

**Estructura del examen:**

- [número] ejercicios de [puntos] puntos cada uno.
- Cada ejercicio debe tener entre 3 y 4 apartados.
- La suma de puntos de los apartados debe coincidir con el total del ejercicio.
- Indicar la puntuación de cada apartado entre paréntesis en negrita, por ejemplo: **(0.5 puntos)**.

**Tipos de preguntas a incluir (selecciona los que apliquen):**

- Resolución de problemas: el alumno plantea y resuelve un problema paso a paso.
- Cálculo a mano: el alumno resuelve operaciones mostrando los pasos.
- Interpretación de resultados: dado un output (tabla, gráfico, datos), el alumno lo interpreta.
- Preguntas conceptuales: el alumno explica diferencias, ventajas o justifica decisiones.
- Desarrollo: el alumno redacta una respuesta argumentada sobre un tema.
- Casos prácticos: dado un escenario, el alumno propone y justifica una solución.
- Verdadero/Falso con justificación: el alumno indica si una afirmación es correcta y explica por qué.

**Formato de salida (pandoc markdown):**

- El documento debe ser compatible con pandoc para generar PDF con `pandoc examen.md -o examen.pdf --pdf-engine=xelatex`.
- Usar `#` para el título del examen.
- Cabecera con datos del examen (asignatura, nombre del alumno, duración, puntuación, recursos). Usar `\` al final de cada línea para forzar saltos de línea.
- Separar ejercicios con `---`.
- Cada ejercicio empieza con `**Ejercicio N – Título** (X puntos)`.
- Los apartados dentro de cada ejercicio se numeran con lista ordenada: `1.`, `2.`, `3.`...
- Todo contenido de continuación dentro de un apartado (tablas, sub-listas, texto adicional) debe ir indentado con 3 espacios para que pandoc lo reconozca como parte del mismo ítem.
- Las sub-listas usan `-` con 3 espacios de indentación.
- Las fórmulas matemáticas usan LaTeX: `$...$` en línea, `$$...$$` en bloque.

**Ejemplo de formato de un ejercicio:**

```markdown
**Ejercicio 1 – Título del ejercicio** (2 puntos)

Texto introductorio del ejercicio con el contexto necesario.

1. **(0.5 puntos)** Enunciado del primer apartado.

2. **(0.5 puntos)** Enunciado con sub-apartados:

   - Primer sub-apartado.
   - Segundo sub-apartado.

3. **(0.5 puntos)** Enunciado con una fórmula: $E = mc^2$. Explica su significado.

4. **(0.5 puntos)** Dada la siguiente tabla:

   | Variable | Valor |
   |----------|-------|
   | A        | 10    |
   | B        | 20    |

   Interpreta los resultados.
```

**Instrucciones adicionales:**

- [Basa las preguntas en el contenido del syllabus adjunto / Usa los temas listados arriba]
- [Incluir al menos un ejercicio de interpretación de resultados]
- [Nivel de dificultad: introductorio / intermedio / avanzado]
- [Otros requisitos específicos de la asignatura]

````

## Fichero de configuración de Pandoc

Fichero `~/.config/pandoc/defaults.yaml` para usar con `pandoc --defaults defaults.yaml examen.md -o examen.pdf`:

```yaml
from: markdown
to: pdf

metadata:
  author: "Miguel González Calvo"
  lang: es

variables:
  papersize: a4
  # colorlinks: true
  date: \today
  geometry: margin=2.5cm
```

Fichero `~/.config/pandoc/beamer.yaml` para presentaciones Beamer (`pandoc --defaults beamer.yaml slides.md -o slides.pdf`):

```yaml
from: markdown
to: beamer

metadata:
  author: "Miguel González Calvo"
  lang: es

variables:
  theme: Copenhagen        # Beamer theme
  colortheme: "default"    # Color scheme
  aspectratio: 169         # widescreen 16:9
  date: \today
```

## VSCode Tasks

Fichero `~/Library/Application Support/Code/User/tasks.json` para compilar documentos y presentaciones Beamer directamente desde VSCode con `Ctrl+Shift+B`:

```json
{
    "version": "2.0.0",
    "tasks": [
        {
            "label": "Build Document",
            "type": "shell",
            "command": "pandoc",
            "args": [
                "${file}",
                "--defaults=${env:HOME}/.config/pandoc/defaults.yaml",
                "-o",
                "${fileDirname}/${fileBasenameNoExtension}.pdf"
            ],
            "group": {
                "kind": "build",
                "isDefault": true
            },
            "problemMatcher": [],
            "options": {
                "cwd": "${fileDirname}"
            }
        },
        {
            "label": "Build Beamer Presentation",
            "type": "shell",
            "command": "pandoc",
            "args": [
                "${file}",
                "--defaults=${env:HOME}/.config/pandoc/beamer.yaml",
                "-o",
                "${fileDirname}/${fileBasenameNoExtension}.pdf"
            ],
            "group": {
                "kind": "build",
                "isDefault": false
            },
            "problemMatcher": [],
            "options": {
                "cwd": "${fileDirname}"
            }
        }
    ]
}
```
