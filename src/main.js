import * as f3 from 'family-chart'
import 'family-chart/styles/family-chart.css'
import './style.css'
import { loadRawData, buildChartData } from './data.js'
import { setupSearch } from './search.js'
import { showDetail } from './detail.js'

const loading = document.getElementById('loading')
const errorBanner = document.getElementById('error-banner')

function getPersonFromUrl() {
  return new URLSearchParams(window.location.search).get('person')
}

function setPersonInUrl(id, { replace = false } = {}) {
  const url = new URL(window.location.href)
  url.searchParams.set('person', id)
  if (replace) window.history.replaceState({ id }, '', url)
  else window.history.pushState({ id }, '', url)
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
    .setTransitionTime(600)
    .setCardXSpacing(220)
    .setCardYSpacing(150)

  const card = chart.setCardHtml()
  card
    .setCardDisplay([['first_name', 'last_name'], ['years']])
    .setStyle('rect')
    .setOnCardClick((e, d) => {
      recenterOn(d.data.id)
    })

  function recenterOn(id, { pushHistory = true } = {}) {
    if (!validIds.has(id)) return
    chart.updateMainId(id)
    chart.updateTree({ tree_position: 'main_to_middle' })
    showDetail(raw, id, (targetId) => recenterOn(targetId))
    setPersonInUrl(id, { replace: !pushHistory })
  }

  chart.updateMainId(initialId)
  chart.updateTree({ initial: true, tree_position: 'main_to_middle' })
  showDetail(raw, initialId, (targetId) => recenterOn(targetId))
  setPersonInUrl(initialId, { replace: true })

  setupSearch(raw.individuals, (id) => recenterOn(id))

  window.addEventListener('popstate', () => {
    const id = getPersonFromUrl()
    if (id) recenterOn(id, { pushHistory: false })
  })

  loading.hidden = true
}

main()
