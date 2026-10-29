// Donde se guarda el altar — versión nube.
//
// Las cuatro funciones (listar, agregar, borrar, urlDeImagen) mantienen
// la misma firma que la versión de navegador, así que ningún componente
// cambia. La diferencia está aquí adentro: en vez de leer y escribir en
// localStorage, cada operación llama a la API desplegada en AWS.
//
// altarId = window.location.hostname, para que la misma URL consulte el
// mismo altar desde cualquier dispositivo (laptop, teléfono…).
//
// Primera carga: si la API está vacía y hay datos en localStorage, los
// importamos automáticamente, incluidas las imágenes.

import { reducirABlob } from '../lib/imagen.js'

// Cambiado a 'nube' para que el banner de la página diga la verdad.
export const MODO = 'nube'

// La URL base viene de la variable de entorno inyectada por Amplify/Vite.
// Se normaliza sin diagonal final para que las rutas queden limpias.
const BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')

// El identificador del altar es el hostname de la página. Así la laptop y
// el teléfono (con la misma URL de Amplify) ven exactamente el mismo altar.
const altarId = window.location.hostname

const LLAVE_LOCAL = 'ofrenda:elementos'
const LLAVE_NOMBRE = 'ofrenda:nombre'

// ------------------------------------------------------------------ //
// Ayudantes de red                                                     //
// ------------------------------------------------------------------ //

async function get(ruta) {
  const res = await fetch(`${BASE}${ruta}`)
  if (!res.ok) {
    const info = await res.json().catch(() => ({}))
    throw new Error(info.error || `Error ${res.status}`)
  }
  return res.json()
}

async function post(ruta, cuerpo) {
  const res = await fetch(`${BASE}${ruta}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cuerpo),
  })
  if (!res.ok) {
    const info = await res.json().catch(() => ({}))
    throw new Error(info.error || `Error ${res.status}`)
  }
  return res.json()
}

// ------------------------------------------------------------------ //
// Importar desde localStorage en la primera carga                     //
// ------------------------------------------------------------------ //

async function importarDesdeLocal(elementosLocales) {
  for (const el of elementosLocales) {
    const { imagenLocal, id: _id, creadoEn: _cre, sk: _sk, ...campos } = el

    // Subir imagen si el elemento la trae como data URL
    let imageKey
    if (imagenLocal) {
      try {
        // Convertir data URL a Blob para subirla
        const respBlob = await fetch(imagenLocal)
        const blob = await respBlob.blob()
        const contentType = blob.type || 'image/jpeg'
        const firmado = await post('/uploads', { altarId, contentType })
        await fetch(firmado.url, {
          method: 'PUT',
          headers: { 'Content-Type': contentType },
          body: blob,
        })
        imageKey = firmado.imageKey
      } catch {
        // Si falla la imagen, el elemento igual se guarda sin ella
      }
    }

    await post('/elements', { altarId, ...campos, ...(imageKey ? { imageKey } : {}) })
  }
}

// ------------------------------------------------------------------ //
// API pública del almacen                                              //
// ------------------------------------------------------------------ //

/** Todos los elementos del altar en orden de creación. */
export async function listar() {
  const { elementos } = await get(`/elements?altarId=${encodeURIComponent(altarId)}`)

  // Primera carga: si la API devuelve vacío, importar desde localStorage
  if (elementos.length === 0) {
    try {
      const crudo = localStorage.getItem(LLAVE_LOCAL)
      if (crudo) {
        const lista = JSON.parse(crudo)
        if (Array.isArray(lista) && lista.length > 0) {
          await importarDesdeLocal(lista)
          // Volver a pedir ahora que ya se importó
          const { elementos: importados } = await get(
            `/elements?altarId=${encodeURIComponent(altarId)}`,
          )
          return importados
        }
      }
    } catch {
      // Si falla la importación, devolver el altar vacío; no bloquear la app
    }
  }

  return elementos
}

/**
 * Agrega un elemento al altar y devuelve cómo quedó guardado.
 *
 * Si trae `imagen` (el File del formulario), la reduce y la sube a S3
 * con una URL firmada antes de guardar el elemento.
 */
export async function agregar(elemento) {
  const { imagen, ...campos } = elemento

  let imageKey
  if (imagen) {
    // Reducir a JPEG y subir a S3 con URL firmada
    const blob = await reducirABlob(imagen)
    const firmado = await post('/uploads', { altarId, contentType: 'image/jpeg' })
    await fetch(firmado.url, {
      method: 'PUT',
      headers: { 'Content-Type': 'image/jpeg' },
      body: blob,
    })
    imageKey = firmado.imageKey
  }

  return post('/elements', { altarId, ...campos, ...(imageKey ? { imageKey } : {}) })
}

/** Quita un elemento del altar. */
export async function borrar(id) {
  await post('/elements', { altarId, borrar: true, id })
}

/**
 * URL firmada de lectura de una imagen guardada en S3.
 *
 * Si el elemento no tiene imageKey, devuelve null.
 */
export async function urlDeImagen(elemento) {
  if (!elemento.imageKey) return null
  // imageKey tiene la forma "<altarId>/<uuid>.jpeg". El slash es un separador
  // real de ruta que {proxy+} captura. No se codifica nada: el altarId es un
  // hostname y el uuid solo tiene caracteres seguros [a-z0-9-].
  const { url } = await get(`/uploads/${elemento.imageKey}`)
  return url
}

/** Quien está poniendo cosas en el altar. Se pregunta una sola vez. */
export function nombre() {
  return localStorage.getItem(LLAVE_NOMBRE) || ''
}

export function guardarNombre(valor) {
  localStorage.setItem(LLAVE_NOMBRE, valor.slice(0, 40))
}
