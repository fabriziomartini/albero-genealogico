const MESI = {
  JAN: 'gennaio', FEB: 'febbraio', MAR: 'marzo', APR: 'aprile',
  MAY: 'maggio', JUN: 'giugno', JUL: 'luglio', AUG: 'agosto',
  SEP: 'settembre', OCT: 'ottobre', NOV: 'novembre', DEC: 'dicembre',
}

/** Converte una data in stile GEDCOM ("15 OCT 1988", "1988") in una stringa leggibile in italiano. */
export function formatGedcomDate(raw) {
  if (!raw) return null
  const parts = raw.trim().split(/\s+/)
  if (parts.length === 3) {
    const [day, mon, year] = parts
    const mese = MESI[mon.toUpperCase()]
    if (mese) return `${parseInt(day, 10)} ${mese} ${year}`
  }
  if (parts.length === 2) {
    const [mon, year] = parts
    const mese = MESI[mon.toUpperCase()]
    if (mese) return `${mese} ${year}`
  }
  return raw
}

/** Estrae il solo anno da una data in stile GEDCOM, se presente. */
export function gedcomYear(raw) {
  if (!raw) return null
  const match = raw.match(/\d{4}/)
  return match ? match[0] : null
}
