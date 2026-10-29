// Adornos de la pagina.
//
// Son azulejos que se repiten horizontalmente con CSS: el papel picado
// de arriba, las cuerdas de ring que rematan cada grada del altar, y los
// esquineros que van en las cuatro esquinas. Van como data URL para que
// no haya ni un archivo de imagen que pueda faltar.
//
// La paleta sale de las referencias: morado profundo de fondo, naranja de
// cempasuchil, y los colores de papel picado de verdad.
// Las cuerdas y esquineros usan la paleta Death Riders: negro y rojo.

export const COLORES = {
  morado: '#2e1f42',
  naranja: '#f57c1f',
  naranjaClaro: '#ffa02e',
  amarillo: '#ffc629',
  rosa: '#e0366e',
  verde: '#2ec27e',
  turquesa: '#35c2c7',
  crema: '#fff4e0',
  // Death Riders
  negro: '#0d0d0d',
  rojo: '#cc0000',
  rojoOscuro: '#8b0000',
  metalico: '#c0a060',
}

function dataUrl(svg) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

// Un banderin de papel picado: rectangulo con el borde de abajo picado y
// los huecos hechos con una mascara, para que se vea el fondo a traves y
// no un color pintado encima.
function banderin(id, x, color, alto) {
  const ancho = 68
  return `
    <mask id="${id}">
      <rect x="${x}" y="8" width="${ancho}" height="${alto}" fill="#fff"/>
      <circle cx="${x + 18}" cy="${alto * 0.34}" r="7" fill="#000"/>
      <circle cx="${x + 50}" cy="${alto * 0.34}" r="7" fill="#000"/>
      <circle cx="${x + 34}" cy="${alto * 0.52}" r="4.5" fill="#000"/>
      <rect x="${x + 22}" y="${alto * 0.66}" width="5" height="9" rx="2" fill="#000"/>
      <rect x="${x + 32}" y="${alto * 0.66}" width="5" height="9" rx="2" fill="#000"/>
      <rect x="${x + 42}" y="${alto * 0.66}" width="5" height="9" rx="2" fill="#000"/>
      <circle cx="${x + 10}" cy="${alto * 0.2}" r="3" fill="#000"/>
      <circle cx="${x + 58}" cy="${alto * 0.2}" r="3" fill="#000"/>
    </mask>
    <g mask="url(#${id})">
      <rect x="${x}" y="8" width="${ancho}" height="${alto - 10}" fill="${color}"/>
      <circle cx="${x + 8}" cy="${alto - 2}" r="8" fill="${color}"/>
      <circle cx="${x + 25}" cy="${alto - 2}" r="8" fill="${color}"/>
      <circle cx="${x + 42}" cy="${alto - 2}" r="8" fill="${color}"/>
      <circle cx="${x + 59}" cy="${alto - 2}" r="8" fill="${color}"/>
    </g>`
}

// El azulejo del papel picado: cuatro banderines de colores distintos que
// al repetirse dan una tira continua.
export function papelPicado() {
  const colores = [COLORES.naranja, COLORES.verde, COLORES.rosa, COLORES.amarillo]
  const altos = [86, 92, 84, 90]
  const banderines = colores
    .map((color, i) => banderin(`p${i}`, 6 + i * 76, color, altos[i]))
    .join('')
  return dataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 310 100" width="310" height="100">
      <path d="M0 10 Q 78 2 155 10 Q 232 18 310 10" stroke="${COLORES.crema}" stroke-width="2.5" fill="none"/>
      ${banderines}
    </svg>`)
}

// Las tres cuerdas de ring estilo Death Riders (negro y rojo) que rematan
// cada grada del altar por abajo. El azulejo mide 40x28 px y se repite.
export function cuerdas() {
  return dataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 28" width="40" height="28">
      <!-- sombra debajo de cada cuerda para dar volumen -->
      <rect x="0" y="5"  width="40" height="5" rx="2.5" fill="${COLORES.rojoOscuro}"/>
      <rect x="0" y="13" width="40" height="5" rx="2.5" fill="${COLORES.rojoOscuro}"/>
      <rect x="0" y="21" width="40" height="5" rx="2.5" fill="${COLORES.rojoOscuro}"/>
      <!-- cuerdas rojas -->
      <rect x="0" y="4"  width="40" height="4" rx="2" fill="${COLORES.rojo}"/>
      <rect x="0" y="12" width="40" height="4" rx="2" fill="${COLORES.rojo}"/>
      <rect x="0" y="20" width="40" height="4" rx="2" fill="${COLORES.rojo}"/>
      <!-- brillo superior en cada cuerda -->
      <rect x="0" y="4"  width="40" height="1.5" rx="1" fill="#ff4444" opacity="0.6"/>
      <rect x="0" y="12" width="40" height="1.5" rx="1" fill="#ff4444" opacity="0.6"/>
      <rect x="0" y="20" width="40" height="1.5" rx="1" fill="#ff4444" opacity="0.6"/>
    </svg>`)
}

// Un esquinero de ring: poste negro con capuchon metalico dorado.
// Se usa como imagen de fondo en ::before y ::after de .nivel.
export function esquinero() {
  return dataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 48" width="24" height="48">
      <!-- poste negro -->
      <rect x="8" y="0" width="8" height="48" rx="4" fill="${COLORES.negro}"/>
      <rect x="9" y="0" width="3" height="48" rx="1.5" fill="#2a2a2a"/>
      <!-- capuchon metalico dorado arriba -->
      <rect x="4" y="0" width="16" height="7" rx="3" fill="${COLORES.metalico}"/>
      <rect x="6" y="1" width="6" height="3" rx="1.5" fill="#e8c878" opacity="0.7"/>
      <!-- union de cuerdas: tres aros rojos -->
      <rect x="5"  y="12" width="14" height="4" rx="2" fill="${COLORES.rojo}"/>
      <rect x="5"  y="20" width="14" height="4" rx="2" fill="${COLORES.rojo}"/>
      <rect x="5"  y="28" width="14" height="4" rx="2" fill="${COLORES.rojo}"/>
    </svg>`)
}

// Pinta los adornos en la pagina. Se llama una vez al arrancar.
export function montarAdornos() {
  const papel = document.querySelector('#papel')
  if (papel) papel.style.backgroundImage = `url("${papelPicado()}")`

  // Cuerdas de ring: reemplazan los petalos como remate inferior de cada grada.
  document.documentElement.style.setProperty('--cuerdas', `url("${cuerdas()}")`)
  // Esquinero: poste en las cuatro esquinas de cada nivel.
  document.documentElement.style.setProperty('--esquinero', `url("${esquinero()}")`)
  // Mantener --petalos por si algo mas lo referencia (queda en 'none').
  document.documentElement.style.setProperty('--petalos', 'none')
}
