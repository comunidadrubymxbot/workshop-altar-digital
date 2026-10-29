// Una grada del altar, con su encabezado, su contador y sus elementos.

import { useState } from 'react'
import { CUPO_POR_NIVEL } from '../../catalogo/elementos.js'
import Elemento from './Elemento.jsx'

export default function Grada({ nivel, nombre, descripcion, elementos, imagenes, onQuitar, onReordenar }) {
  const lleno = elementos.length >= CUPO_POR_NIVEL

  // id del elemento sobre el que esta volando el cursor (para resaltarlo)
  const [overId, setOverId] = useState(null)

  function handleDragStart(e, id) {
    // dataTransfer es el unico canal fiable entre dragstart y drop,
    // especialmente cuando el evento viene de un hijo (SVG, imagen).
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', id)
  }

  function handleDragOver(e, id) {
    // Obligatorio para que el drop sea valido.
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setOverId(id)
  }

  function handleDrop(e, targetId) {
    e.preventDefault()
    const sourceId = e.dataTransfer.getData('text/plain')
    setOverId(null)

    if (!sourceId || sourceId === targetId) return

    const desde = elementos.findIndex((el) => el.id === sourceId)
    const hasta = elementos.findIndex((el) => el.id === targetId)
    if (desde === -1 || hasta === -1) return

    const siguiente = [...elementos]
    const [movido] = siguiente.splice(desde, 1)
    siguiente.splice(hasta, 0, movido)
    onReordenar(nivel, siguiente)
  }

  function handleDragLeave(e) {
    // Solo limpiar si el cursor sale de la lista entera, no de un hijo.
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setOverId(null)
    }
  }

  function handleDragEnd() {
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

      <ul
        className="nivel-elementos"
        onDragLeave={handleDragLeave}
      >
        {elementos.length === 0 ? (
          <li className="nivel-vacio">Todavía no hay nada en este nivel</li>
        ) : (
          elementos.map((el) => (
            <Elemento
              key={el.id}
              elemento={el}
              urlImagen={imagenes.get(el.id)}
              onQuitar={onQuitar}
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
