import { fullName } from './data.js'

const DIACRITICS_RE = new RegExp('[\\u0300-\\u036f]', 'g')

function normalize(str) {
  return str
    .normalize('NFD')
    .replace(DIACRITICS_RE, '')
    .toLowerCase()
    .trim()
}

export function setupSearch(individuals, onSelect) {
  const input = document.getElementById('search-input')
  const results = document.getElementById('search-results')

  const people = Object.values(individuals).map((person) => ({
    id: person.id,
    label: fullName(person),
    normalized: normalize(fullName(person)),
  }))

  function render(matches) {
    results.innerHTML = matches
      .map((p) => `<li data-id="${p.id}">${p.label}</li>`)
      .join('')
    results.hidden = matches.length === 0
  }

  input.addEventListener('input', () => {
    const query = normalize(input.value)
    if (!query) {
      render([])
      return
    }
    const matches = people.filter((p) => p.normalized.includes(query)).slice(0, 12)
    render(matches)
  })

  results.addEventListener('click', (e) => {
    const li = e.target.closest('li[data-id]')
    if (!li) return
    input.value = ''
    render([])
    onSelect(li.dataset.id)
  })

  document.addEventListener('click', (e) => {
    if (!e.target.closest('#search-box')) render([])
  })

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      input.blur()
      render([])
    }
  })
}
