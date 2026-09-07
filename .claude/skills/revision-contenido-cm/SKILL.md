---
name: revision-contenido-cm
description: >
  Revisa contenido de Jean Marte antes de publicarlo — copy del sitio, páginas de servicio, casos de
  estudio, guías, publicaciones de Instagram y captions — desde el rol de community manager encargado
  de posicionarlo como consultor y proveedor de servicios, no como programador freelance. Úsala como
  puerta de salida: ningún texto llega a un archivo del proyecto ni a redes sin pasar por aquí.
  Activar al redactar o editar hero, cards de servicio, páginas /servicios/, guías, casos de estudio,
  FAQ, testimonios, captions o cualquier afirmación pública sobre resultados.
---

# Revisión de contenido — rol de community manager

Formaliza el método que el autor ya aplica a mano en `Materiales/*/Publicacion-Instagram-*.txt`: cada
afirmación lleva un bloque **Respaldo**, y lo que no tiene prueba se retira y se declara.

**Objetivo de posicionamiento, no negociable:** Jean Marte es un **consultor** que hace que un negocio
funcione por dentro y se encuentre por fuera. No es "un programador que además hace marketing". Un
consultor vende criterio y diagnóstico; un programador vende horas.

Complementa a `portafolio-conversion` (estructura y jerarquía) y a `stop-slop` (tics de IA). Esta se
ocupa de **veracidad, coherencia y posicionamiento**.

## Las 5 pasadas

Ejecutar en orden sobre el texto. Cada una produce hallazgos; ninguno se resuelve inventando.

### 1. Respaldo

Por cada afirmación comprobable, nombrar la fuente. Fuentes válidas, en orden de fuerza:

1. Caso de estudio publicado en el sitio (Zentra, Santoral Logistic, Bunu Shop, Alquimia Lab).
2. Sistema en producción con demo funcional.
3. Experiencia documentada en el CV (p. ej. implementación de e-CF en Valiente Fernández; soporte bajo
   SLA y SAP Business One sobre Linux).
4. Dato verificable en Google Search Console (usar el MCP `google-search-console` para comprobarlo).
5. Certificación real y relevante para el perfil que se vende.

Sin fuente → `[PENDIENTE: …]` y no se publica. **Nunca se inventa una métrica, un cliente, un
testimonio, una tecnología ni un compromiso comercial.**

Búsqueda explícita de cifras: rastrear `%`, `x veces`, `horas`, `días`, `#1`, `primero`. Cada una
necesita fuente o se convierte en resultado cualitativo factual ("reemplazó cuatro procesos manuales").

### 2. Testimonios: cita ≠ afirmación propia

Un testimonio es la opinión del cliente, y se publica **textual, entrecomillado y atribuido** con
nombre y negocio. Eso es legítimo aunque la cifra sea su percepción.

**Lo prohibido es que el autor reformule esa cifra como promesa suya.** Si una clienta dice "llegué al
ranking número 1", el sitio no puede decir "consigo el ranking número 1": ahí deja de ser opinión y
pasa a ser una promesa sin fuente. Marcar como defecto crítico cualquier caso.

### 3. Coherencia sitio ↔ redes

Lo que dicen jeanmarte.com y lo que dicen las publicaciones tiene que ser la misma oferta. Revisar en
ambas direcciones y reportar las dos:

- Servicio anunciado en redes que el sitio no ofrece → o entra al sitio, o sale del copy de redes.
- Servicio del sitio que las redes nunca mencionan → oportunidad de publicación.
- Cifras que no coinciden (número de sistemas en producción, años de experiencia, certificaciones).

Los `.txt` de `Materiales/` llevan un bloque "PENDIENTE EN EL SITIO": ninguno debe quedar abierto.

### 4. Consultor, no proveedor de horas

Banderas rojas:

- El texto abre por tecnología o stack en vez de por el problema del cliente.
- Enumera herramientas donde debería mostrar criterio ("elegí X porque el sistema requería Y").
- Jerga sin traducir en superficies de venta: *backend*, *frontend*, *full-stack*, *API*, *deploy*.
  El comprador es un dueño de negocio. Los nombres de tecnología solo van en etiquetas de card y en el
  bloque Stack del caso de estudio.
- Promete entregar, no sostener. El diferenciador es que los sistemas se mantienen.
- Habla de sí mismo con adjetivos ("apasionado", "experto") en vez de con lo que está funcionando.

### 5. Voz y reutilización

- Primera persona, frases cortas, sin adjetivos sobre uno mismo. La autoridad sale de lo que está en
  producción.
- El texto debe sonar a las citas que ya existen del autor: *"Antes de escribir una línea de código
  quiero entender cómo trabaja tu negocio"*, *"prefiero decírtelo antes que construirlo"*.
- Marcar qué fragmentos sirven de gancho para una publicación, para no escribir dos veces lo mismo.

## Asimetría de prueba

El respaldo del lado **sistemas** (Zentra, Santoral, e-CF en Valiente Fernández) es más fuerte que el
del lado **presencia/marketing** (Bunu Shop, Alquimia Lab, certificación de Community Management). El
copy tiene que reflejar esa asimetría, no disimularla: un caso se cita como caso, nunca como
trayectoria.

## Salida

```markdown
## Veredicto
PUBLICABLE | PUBLICABLE CON CAMBIOS | NO PUBLICABLE

## Defectos críticos
[Afirmación sin respaldo, cifra inventada, cita convertida en promesa propia, contradicción con el
sitio. Cada uno con la pasada que lo detecta y la corrección concreta.]

## Ajustes de posicionamiento
[Dónde el texto suena a programador y no a consultor, con la reescritura.]

## Pendientes
[[PENDIENTE: ...] y qué dato debe aportar el autor.]

## Reutilizable en redes
[Fragmentos que sirven de gancho.]
```

No declarar nada PUBLICABLE si queda un `[PENDIENTE]` bloqueante: cifra sin fuente, testimonio sin
verificar, o compromiso comercial (precio, plazo, garantía, propiedad del código) sin confirmar con el
autor.
