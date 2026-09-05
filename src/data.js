import { formatGedcomDate, gedcomYear } from './gedcomDate.js'

/** Carica il JSON statico dei dati genealogici. */
export async function loadRawData() {
  const res = await fetch(`${import.meta.env.BASE_URL}family_tree_data.json`)
  if (!res.ok) throw new Error(`Impossibile caricare i dati (${res.status})`)
  return res.json()
}

function fullName(person) {
  return [person.givenName, person.surname].filter(Boolean).join(' ')
}

function initialsOf(person) {
  const a = (person.givenName || '').trim()[0] || ''
  const b = (person.surname || '').trim()[0] || ''
  return (a + b).toUpperCase() || '?'
}

/** Escapa caratteri HTML per un uso sicuro dentro template literal. */
export function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ))
}

function yearsLabel(person) {
  const birth = gedcomYear(person.birthDate)
  const death = gedcomYear(person.deathDate)
  if (birth && death) return `${birth} – ${death}`
  if (birth && person.deathDate) return `${birth} – ?`
  if (birth) return `${birth}`
  if (death) return `? – ${death}`
  return ''
}

/**
 * Trasforma { individuals, families } nel formato piatto atteso da family-chart:
 * un array di { id, data, rels: { parents, spouses, children } }.
 */
export function buildChartData(raw) {
  const { individuals, families } = raw

  return Object.values(individuals).map((person) => {
    const parents = []
    if (person.childOfFamily && families[person.childOfFamily]) {
      const fam = families[person.childOfFamily]
      if (fam.husbandId) parents.push(fam.husbandId)
      if (fam.wifeId) parents.push(fam.wifeId)
    }

    const spouseIds = new Set()
    const childIds = new Set()
    for (const famId of person.spouseInFamilies || []) {
      const fam = families[famId]
      if (!fam) continue
      const partnerId = fam.husbandId === person.id ? fam.wifeId : fam.husbandId
      if (partnerId) spouseIds.add(partnerId)
      for (const childId of fam.childrenIds || []) {
        childIds.add(childId)
      }
    }

    return {
      id: person.id,
      data: {
        gender: person.sex === 'F' ? 'F' : 'M',
        first_name: person.givenName || '',
        last_name: person.surname || '',
        married_name: person.marriedName || null,
        initials: initialsOf(person),
        years: yearsLabel(person),
        birth_date_label: formatGedcomDate(person.birthDate),
        birth_place: person.birthPlace || null,
        death_date_label: formatGedcomDate(person.deathDate),
        death_place: person.deathPlace || null,
        death_cause: person.deathCause || null,
      },
      rels: {
        parents,
        spouses: [...spouseIds],
        children: [...childIds],
      },
    }
  })
}

/** Indice id -> persona grezza, utile per il pannello dettagli e la ricerca. */
export function indexIndividuals(raw) {
  return raw.individuals
}

export { fullName }
