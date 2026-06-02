# Flujo de inicio de sesión de paciente — Portal Clínico ↔ Unity (VR)

> Documento de contrato entre el **Portal Clínico** (React), la **API Central** (backend Go)
> y la **aplicación VR en Unity**. Define la secuencia estandarizada que ocurre cuando una
> nueva sesión de un paciente debe empezar, y cómo el `session_id` viaja hasta Unity para
> que pueda usarlo en sus llamadas de ajuste de dificultad.

## Decisiones de diseño

Estas tres decisiones gobiernan todo el flujo descrito en este documento:

1. **Handoff por lookup de paciente.** Unity no crea la sesión ni la recibe por *push*;
   la **recupera** consultando por el paciente seleccionado vía
   `GET /sessions/active?patient_id=X`.
2. **El neurólogo gatea el arranque.** La sesión **no existe** hasta que el neurólogo
   presiona "Iniciar sesión" en el portal. Unity espera (con polling) a que aparezca.
3. **Stream de Cloudflare estático y compartido.** Se usa un único `VITE_CF_STREAM_ID`
   fijo. Esto asume **un solo headset transmitiendo a la vez** (una sesión simultánea).

## Actores

| Actor | Rol en el flujo |
|-------|-----------------|
| **Neurólogo (Portal)** | Selecciona paciente, crea la sesión, supervisa el monitor y cierra la sesión. |
| **API Central (Backend)** | Fuente de verdad de la sesión y su ciclo de vida. Expone los endpoints. |
| **Operador + Unity (VR)** | Coloca el headset, identifica al paciente, recupera el `session_id` y ejecuta los niveles. |
| **Microservicio de dificultad** | Llamado por la API Central en cada nivel para devolver la dificultad recomendada. |
| **Cloudflare Stream** | Recibe el video del headset (ingest) y lo reproduce en el monitor del portal. |

## Ciclo de vida de la sesión

```
            POST /sessions                 1er POST /levels            PATCH /complete
   (none) ───────────────► pending ───────────────────► active ───────────────────► completed
                              │
                              │  TTL (~15 min sin engancharse)
                              └───────────────────────► expired
```

- **pending** — creada por el neurólogo; aún ningún headset se ha enganchado ni ha empezado a jugar.
- **active** — Unity envió el primer nivel; la sesión está en curso.
- **completed** — cerrada por el neurólogo tras finalizar.
- **expired** — nadie se enganchó dentro del TTL; se libera para no dejar sesiones colgadas.

## Secuencia paso a paso

### Fase 1 — El neurólogo abre la sesión (Portal)

1. El neurólogo selecciona al paciente y presiona **"Iniciar sesión"**.
2. El portal ejecuta `POST /sessions { patient_id }`. El backend crea la fila en estado
   **`pending`** y responde `{ session_id, started_at, patient_id, status }`.
3. El portal navega al **Monitor de sesión** y el reproductor de Cloudflare se conecta al
   stream estático, mostrando *"esperando señal"* hasta que el headset comience a transmitir.

### Fase 2 — Unity se engancha (VR)

4. El operador coloca el headset y **selecciona al mismo paciente** dentro de Unity.
5. Unity hace **polling** a `GET /sessions/active?patient_id=X` cada ~3 segundos:
   - **404 Not Found** → no hay sesión `pending`/`active` → Unity muestra
     *"Esperando a que el neurólogo inicie la sesión…"* y reintenta.
   - **200 OK** → recibe `{ session_id, ... }` → **Unity guarda el `session_id` en memoria.**
6. El **404 actúa como guard natural**: si el operador eligió el paciente equivocado, no
   encontrará sesión, evitando un emparejamiento incorrecto.
7. El headset empieza a transmitir a Cloudflare → el monitor del portal ya muestra video.

### Fase 3 — Empezar a jugar (Unity ↔ API Central)

8. El operador presiona **"Empezar"** y Unity arranca el **Nivel 1**.
9. En cada nivel, Unity llama `POST /sessions/:id/levels { level, metrics }`, usando el
   `session_id` guardado. La API Central invoca al microservicio de dificultad y responde
   con la dificultad recomendada para el siguiente nivel.
10. El **primer** `POST /levels` cambia el estado de la sesión `pending → active`. El backend
    emite por WebSocket el evento `level_completed`, y el neurólogo ve métricas, clase SPS y
    recomendación en vivo en el monitor.

### Fase 4 — Cierre

11. Tras el último nivel, Unity envía su `POST /levels` final y el backend emite
    `session_completed`.
12. El neurólogo presiona **"Cerrar sesión"** → `PATCH /sessions/:id/complete` → estado
    `completed`.

## Diagrama de secuencia

```
Portal              API Central            Unity(VR)
  │                     │                     │
[Iniciar sesión]        │                     │
  ├─POST /sessions ────►│ status=pending      │
  │◄{session_id}        │                     │
  │ abre Monitor 🎥     │   [paciente X]      │
  │                     │◄GET /sessions/active?patient_id=X (poll)
  │                     │  404 → espera…      │
  │                     ├─200 {session_id} ──►│ guarda session_id ✅
  │   🎥 stream ◄───────────────────────────┤ headset transmite
  │                     │      [Empezar]      │
  │                     │◄POST /sessions/:id/levels ──┤ (pending→active)
  │◄WS level_completed──┤  → microservicio    │
  │  métricas en vivo   │                     │
  │                     │◄POST /levels (último)┤
  │◄WS session_completed┤                     │
[Cerrar sesión]         │                     │
  ├─PATCH /complete ───►│ status=completed    │
```

## Endpoint nuevo a implementar: `GET /sessions/active`

### Propósito

Este endpoint es la pieza que cierra el flujo: es el mecanismo por el cual la aplicación de
Unity obtiene el `session_id` de una sesión que el neurólogo ya inició desde el portal. Dado
que la decisión de diseño es que **el neurólogo gatea el arranque** y que **el handoff hacia
Unity ocurre por lookup de paciente**, Unity nunca crea la sesión ni la recibe por un canal
de *push*; en su lugar, consulta repetidamente a este endpoint usando el identificador del
paciente que el operador seleccionó en el headset. Mientras el neurólogo no haya presionado
"Iniciar sesión", el endpoint responde `404` y Unity permanece en una pantalla de espera; en
el instante en que la sesión existe en estado `pending`, la siguiente consulta de Unity
devuelve `200` con el `session_id`, que la aplicación guarda en memoria para usarlo en todas
sus llamadas posteriores de `POST /sessions/:id/levels`.

### Parámetro de entrada

El endpoint requiere **un único query parameter, `patient_id`, y nada más**. Su valor es el
**UUID** del paciente (por ejemplo `3f2504e0-4f89-41d3-9a0c-0305e82c3301`). No hay parámetros
de paginación, ni filtros adicionales, ni cuerpo de petición: la firma completa del endpoint
es `GET /sessions/active?patient_id=<uuid>`. El backend debe **validar que el valor sea un
UUID bien formado** antes de consultar la base de datos; si el parámetro está ausente, vacío
o no es un UUID sintácticamente válido, debe responderse `400 Bad Request` para distinguir
claramente un error del cliente de un caso legítimo de "no hay sesión" (que es `404`). Esta
validación temprana evita ejecutar consultas con identificadores malformados y le da a Unity
una señal inequívoca de que el problema está en la petición y no en el estado del servidor.

### Semántica de la consulta

Conceptualmente, el endpoint responde a la pregunta *"¿existe ahora mismo una sesión vigente
para este paciente?"*. Una sesión se considera **vigente** cuando su estado es `pending` o
`active`: `pending` cubre el intervalo entre que el neurólogo la creó y que Unity envió el
primer nivel, y `active` cubre la sesión ya en curso. Estados terminales como `completed` y
`expired` **no** deben devolverse, porque representan sesiones que ya no admiten nuevos
niveles. Como el sistema garantiza —mediante una restricción a nivel de base de datos— que
exista **a lo sumo una** sesión `pending`/`active` por paciente, la consulta nunca debería
encontrar más de un candidato; aun así, como defensa en profundidad, si por alguna anomalía
hubiera varias filas vigentes, el backend debe devolver la **más reciente** (la de mayor
`started_at`) para tener un comportamiento determinista. Esta única-sesión-por-paciente es lo
que hace que el lookup por `patient_id` sea suficiente y no se necesite ningún otro
identificador para desambiguar.

### Respuesta exitosa (200 OK)

Cuando existe una sesión vigente, el endpoint devuelve `200 OK` con la representación de esa
sesión. El campo crítico para Unity es `session_id`; el resto del objeto le da contexto y le
permite confirmar que se enganchó al paciente correcto. La forma de la respuesta debe ser
consistente con la que ya devuelve `POST /sessions` para que ambos clientes deserialicen el
mismo modelo:

```json
{
  "session_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "patient_id": "3f2504e0-4f89-41d3-9a0c-0305e82c3301",
  "status": "pending",
  "started_at": "2026-06-02T03:26:19Z"
}
```

Unity debe leer `session_id` y persistirlo en memoria durante toda la sesión, y puede usar
`status` para decidir su pantalla: si recibe `pending` puede pasar a la pantalla de
"Empezar"; si recibe `active`, significa que la sesión ya tiene niveles registrados (por
ejemplo, tras una reconexión del headset) y Unity puede **reanudar** en lugar de empezar
desde el Nivel 1.

### Respuesta sin sesión (404 Not Found)

Si no existe ninguna sesión `pending` ni `active` para ese `patient_id`, el endpoint debe
responder `404 Not Found`. Este **no es un error excepcional** sino un estado esperado y
frecuente del flujo: es exactamente lo que Unity recibe mientras el neurólogo todavía no ha
iniciado la sesión, y es también el guard que protege contra que el operador seleccione un
paciente equivocado en el headset. Por eso Unity debe tratar el `404` como una señal de
"sigue esperando" y continuar su *polling* cada ~3 segundos, mostrando un mensaje del tipo
*"Esperando a que el neurólogo inicie la sesión…"*, en lugar de mostrar un error. El cuerpo
del `404` puede incluir un objeto de error informativo, pero Unity no necesita leerlo: el
código de estado por sí solo es suficiente para distinguir "todavía no" de "ya está lista".

### Códigos de estado

| Código | Significado | Acción esperada en Unity |
|--------|-------------|--------------------------|
| `200 OK` | Existe una sesión vigente. | Guardar `session_id`; pasar a "Empezar" (o reanudar si `active`). |
| `404 Not Found` | No hay sesión vigente para el paciente. | Seguir en pantalla de espera; reintentar el polling. |
| `400 Bad Request` | `patient_id` ausente, vacío o no es un UUID válido. | Corregir la petición; es un bug del cliente, no reintentar igual. |
| `401 Unauthorized` | (Futuro) Unity no presentó credenciales válidas. | Renovar/registrar el token de dispositivo. |

### Consideraciones de seguridad (deuda conocida)

Actualmente el middleware de autenticación del backend está comentado, por lo que este
endpoint quedaría desprotegido como el resto. Cuando se reactive, hay que decidir cómo se
autentica Unity, ya que **no es un navegador con cookie de sesión** sino un dispositivo: lo
natural es un **token de dispositivo** o API key que el headset presente en sus peticiones,
tanto a `GET /sessions/active` como a `POST /sessions/:id/levels`. Mientras esa decisión no
se implemente, este documento asume acceso abierto, pero el `401` ya queda reservado en la
tabla de arriba para cuando exista.

## Resumen de endpoints del flujo

| Método | Ruta | Quién lo llama | Propósito |
|--------|------|----------------|-----------|
| `POST` | `/sessions` | Portal | Crear la sesión (`pending`). |
| `GET`  | `/sessions/active?patient_id=X` | **Unity** | **Recuperar el `session_id` por paciente.** |
| `POST` | `/sessions/:id/levels` | Unity | Registrar nivel + obtener dificultad recomendada. Primer nivel: `pending → active`. |
| `PATCH`| `/sessions/:id/complete` | Portal | Cerrar la sesión (`completed`). |

## Trabajo pendiente por componente

**Backend**
- Implementar `GET /sessions/active?patient_id=X` (UUID, validación, 200/404/400).
- Añadir el estado `pending` y un **TTL** que lo lleve a `expired`.
- Restringir en base de datos a **una sola sesión `pending`/`active` por paciente**.
- En el primer `POST /sessions/:id/levels`, hacer flip `pending → active`.

**Portal**
- Manejar el estado `pending` devuelto por `POST /sessions`.
- En el monitor, indicar *"esperando que el paciente se conecte"* mientras no haya señal.

**Unity**
- Polling a `GET /sessions/active?patient_id=X` tras seleccionar paciente.
- **Persistir el `session_id`** y usarlo en cada `POST /sessions/:id/levels`.
- Pantalla de espera ante `404`; lógica de reanudación ante `200` con `status=active`.
