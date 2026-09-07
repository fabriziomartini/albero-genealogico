import { fullName, escapeHtml } from './data.js'
import { formatGedcomDate } from './gedcomDate.js'

const panel = document.getElementById('detail-panel')
const content = document.getElementById('detail-content')

function personButton(individuals, id, label) {
  const person = individuals[id]
  const text = person ? fullName(person) : label || id
  return `<button class="person-link" data-id="${id}">${escapeHtml(text)}</button>`
}

function relationLine(labelText, id, individuals) {
  return `<p><span class="field-label">${labelText}</span> ${personButton(individuals, id)}</p>`
}

function buildRelations(raw, person) {
  const { individuals, families } = raw
  const parts = []

  if (person.childOfFamily && families[person.childOfFamily]) {
    const fam = families[person.childOfFamily]
    if (fam.husbandId) parts.push(relationLine('Padre:', fam.husbandId, individuals))
    if (fam.wifeId) parts.push(relationLine('Madre:', fam.wifeId, individuals))
  }

  for (const famId of person.spouseInFamilies || []) {
    const fam = families[famId]
    if (!fam) continue
    const partnerId = fam.husbandId === person.id ? fam.wifeId : fam.husbandId
    const children = (fam.childrenIds || []).filter((id) => individuals[id])
    if (partnerId) {
      const base = children.length ? 'Ebbe figli con:' : 'Insieme a:'
      const label = fam.divorced ? base.replace(':', ' (poi separati):') : base
      parts.push(relationLine(label, partnerId, individuals))
    }
    if (children.length) {
      const links = children.map((id) => personButton(individuals, id)).join(', ')
      parts.push(`<p><span class="field-label">Figli:</span> ${links}</p>`)
    }
  }

  return parts.join('')
}

function fieldLine(labelText, value) {
  if (!value) return ''
  return `<p><span class="field-label">${labelText}</span> ${escapeHtml(value)}</p>`
}

export function showDetail(raw, id, onNavigate) {
  const person = raw.individuals[id]
  if (!person) return

  const name = fullName(person)
  const marriedName = person.marriedName ? ` (${escapeHtml(person.marriedName)})` : ''

  content.innerHTML = `
    <h2>${escapeHtml(name)}${marriedName}</h2>
    ${fieldLine('Nascita:', [formatGedcomDate(person.birthDate), person.birthPlace].filter(Boolean).join(' – ') || null)}
    ${fieldLine('Morte:', [formatGedcomDate(person.deathDate), person.deathPlace].filter(Boolean).join(' – ') || null)}
    ${fieldLine('Causa:', person.deathCause)}
    ${buildRelations(raw, person)}
  `

  panel.hidden = false

  content.querySelectorAll('.person-link').forEach((btn) => {
    btn.addEventListener('click', () => onNavigate(btn.dataset.id))
  })
}

export function hideDetail() {
  panel.hidden = true
}

document.getElementById('detail-close').addEventListener('click', hideDetail)
