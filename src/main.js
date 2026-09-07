import * as f3 from 'family-chart'
import 'family-chart/styles/family-chart.css'
import './style.css'
import { loadRawData, buildChartData, escapeHtml } from './data.js'
import { setupSearch } from './search.js'
import { showDetail } from './detail.js'

const loading = document.getElementById('loading')
const errorBanner = document.getElementById('error-banner')
const hint = document.getElementById('hint')

function getPersonFromUrl() {
  return new URLSearchParams(window.location.search).get('person')
}

function setPersonInUrl(id, { replace = false } = {}) {
  const url = new URL(window.location.href)
  url.searchParams.set('person', id)
  if (replace) window.history.replaceState({ id }, '', url)
  else window.history.pushState({ id }, '', url)
}

function dismissHint() {
  hint.hidden = true
  try {
    localStorage.setItem('fc_hint_dismissed', '1')
  } catch {
    // storage non disponibile: nessun problema, l'hint riapparirà al prossimo giro
  }
}

function initialScale() {
  return window.innerWidth < 640 ? 0.62 : 0.85
}

function personCardHtml(d) {
  const p = d.data.data
  const name = [p.first_name, p.last_name].filter(Boolean).join(' ') || 'Sconosciuto'
  return `
    <div class="fc-card-inner">
      <div class="fc-avatar">${escapeHtml(p.initials)}</div>
      <div class="fc-text">
        <div class="fc-name">${escapeHtml(name)}</div>
        ${p.years ? `<div class="fc-years">${escapeHtml(p.years)}</div>` : ''}
      </div>
    </div>
  `
}

async function main() {
  let raw
  try {
    raw = await loadRawData()
  } catch (err) {
    loading.hidden = true
    errorBanner.hidden = false
    errorBanner.textContent = 'Impossibile caricare i dati dell\'albero genealogico. Riprova più tardi.'
    console.error(err)
    return
  }

  const chartData = buildChartData(raw)
  const validIds = new Set(chartData.map((d) => d.id))

  const requestedId = getPersonFromUrl()
  const initialId = requestedId && validIds.has(requestedId)
    ? requestedId
    : (validIds.has('I500001') ? 'I500001' : chartData[0].id)

  const cont = document.getElementById('chart-cont')
  const chart = f3.createChart(cont, chartData)

  chart
    .setTransitionTime(500)
    .setCardXSpacing(260)
    .setCardYSpacing(140)
    .setSingleParentEmptyCard(false)

  const card = chart.setCardHtml()
  card
    .setCardInnerHtmlCreator(personCardHtml)
    .setOnCardClick((e, d) => {
      recenterOn(d.data.id)
    })

  function recenterOn(id, { pushHistory = true } = {}) {
    if (!validIds.has(id)) return
    chart.updateMainId(id)
    chart.updateTree({ initial: false, tree_position: 'main_to_middle', scale: initialScale() })
    showDetail(raw, id, (targetId) => recenterOn(targetId))
    setPersonInUrl(id, { replace: !pushHistory })
    dismissHint()
  }

  chart.updateMainId(initialId)
  chart.updateTree({ initial: false, tree_position: 'main_to_middle', scale: initialScale() })
  showDetail(raw, initialId, (targetId) => recenterOn(targetId))
  setPersonInUrl(initialId, { replace: true })

  setupSearch(raw.individuals, (id) => recenterOn(id))

  document.getElementById('fit-btn').addEventListener('click', () => {
    chart.updateMainId(initialId)
    chart.updateTree({ initial: false, tree_position: 'fit' })
    showDetail(raw, initialId, (targetId) => recenterOn(targetId))
    setPersonInUrl(initialId, { replace: false })
    dismissHint()
  })

  let hintDismissed = false
  try {
    hintDismissed = localStorage.getItem('fc_hint_dismissed') === '1'
  } catch {
    // storage non disponibile: mostriamo l'hint per sicurezza
  }
  if (hintDismissed) hint.hidden = true

  window.addEventListener('popstate', () => {
    const id = getPersonFromUrl()
    if (id) recenterOn(id, { pushHistory: false })
  })

  loading.hidden = true
}

main()
