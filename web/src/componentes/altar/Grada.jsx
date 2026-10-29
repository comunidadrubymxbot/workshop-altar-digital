// Una grada del altar, con su encabezado, su contador y sus elementos.

import { useState } from 'react'
import { CUPO_POR_NIVEL } from '../../catalogo/elementos.js'
import Elemento from './Elemento.jsx'

export default function Grada({ nivel, nombre, descripcion, elementos, imagenes, onQuitar, onReordenar }) {
  const lleno = elementos.length >= CUPO_POR_NIVEL

  // id del elemento que se esta arrastrando
  const [dragId, setDragId] = useState(null)
  // id del elemento sobre el que esta volando el cursor
  const [overId, setOverId] = useState(null)

  function handleDragStart(id) {
    setDragId(id)
  }

  function handleDragOver(id) {
    if (id !== dragId) setOverId(id)
  }

  function handleDrop() {
    if (dragId && overId && dragId !== overId) {
      const desde = elementos.findIndex((el) => el.id === dragId)
      const hasta = elementos.findIndex((el) => el.id === overId)
      if (desde !== -1 && hasta !== -1) {
        const siguiente = [...elementos]
        const [movido] = siguiente.splice(desde, 1)
        siguiente.splice(hasta, 0, movido)
        onReordenar(nivel, siguiente)
      }
    }
    setDragId(null)
    setOverId(null)
  }

  function handleDragEnd() {
    setDragId(null)
    setOverId(null)
  }

  return (
    <section className="nivel">
      <div className="nivel-encabezado">
        <h2>
          {nombre}
          <span>{descripcion}</span>
        </h2>
        {/* El contador se pone ambar cuando la grada ya no acepta mas, asi
            nadie descubre el limite hasta que lo choca. */}
        <span className={`nivel-cuenta${lleno ? ' nivel-lleno' : ''}`}>
          {elementos.length} / {CUPO_POR_NIVEL}
        </span>
      </div>

      <ul className="nivel-elementos">
        {elementos.length === 0 ? (
          <li className="nivel-vacio">Todavía no hay nada en este nivel</li>
        ) : (
          elementos.map((el) => (
            // La `key` es lo que arregla el reproductor de Spotify: React
            // reconoce cada elemento entre renders y no vuelve a montar el
            // iframe de una cancion que no cambio.
            <Elemento
              key={el.id}
              elemento={el}
              urlImagen={imagenes.get(el.id)}
              onQuitar={onQuitar}
              isDragging={dragId === el.id}
              isOver={overId === el.id}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onDragEnd={handleDragEnd}
            />
          ))
        )}
      </ul>
    </section>
  )
}
