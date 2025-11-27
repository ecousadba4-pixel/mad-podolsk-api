<template>
  <button class="export-pdf-btn" @click="onClick" :disabled="loading || props.disabled">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M12 3v10" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M8 9l4 4 4-4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M21 21H3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
    <span>PDF</span>
  </button>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useDashboardDataStore } from '../../store/dashboardDataStore.js'
import { useDashboardUiStore } from '../../store/dashboardUiStore.js'

const props = defineProps({
  selector: { type: String, default: '#report-to-print' },
  fileName: { type: String, default: 'report.pdf' },
  disabled: { type: Boolean, default: false }
})

const loading = ref(false)

function ensureHtml2pdf() {
  return new Promise(async (resolve, reject) => {
    if (window.html2pdf) return resolve(window.html2pdf)
    try {
      await new Promise((res, rej) => {
        const existing = document.querySelector('script[data-html2pdf]')
        if (existing) return existing.addEventListener('load', () => res(null))

        const s = document.createElement('script')
        s.setAttribute('data-html2pdf', '1')

        // Prefer local vendor copy (copied to /vendor via npm script). Fallback to CDN if not present.
        const localPath = '/vendor/html2pdf.bundle.min.js'
        const tryLocal = () => {
          // attempt to fetch the local file quickly to avoid a 404 being added as a script src
          fetch(localPath, { method: 'HEAD' }).then(r => {
            if (r.ok) s.src = localPath
            else s.src = 'https://unpkg.com/html2pdf.js@0.10.1/dist/html2pdf.bundle.min.js'
            s.async = true
            s.onload = () => res(null)
            s.onerror = () => rej(new Error('html2pdf load failed'))
            document.head.appendChild(s)
          }).catch(() => {
            s.src = 'https://unpkg.com/html2pdf.js@0.10.1/dist/html2pdf.bundle.min.js'
            s.async = true
            s.onload = () => res(null)
            s.onerror = () => rej(new Error('html2pdf load failed'))
            document.head.appendChild(s)
          })
        }

        tryLocal()
      })
      return resolve(window.html2pdf)
    } catch (err) { return reject(err) }
  })
}

function waitForSelector(selector, timeout = 3000, interval = 150) {
  const start = Date.now()
  return new Promise(resolve => {
    const check = () => {
      const el = document.querySelector(selector)
      if (el) return resolve(el)
      if (Date.now() - start > timeout) return resolve(null)
      setTimeout(check, interval)
    }
    check()
  })
}

const router = useRouter()

async function onClick() {
  // If button is disabled (e.g., we're on Daily view), don't proceed
  if (props.disabled) {
    alert('Экспорт доступен только в представлении "По месяцам"')
    return
  }

  const dataStore = useDashboardDataStore()
  const uiStore = useDashboardUiStore()
  const month = uiStore.selectedMonth.value
  if (!month) {
    alert('Не выбран месяц для экспорта')
    return
  }

  loading.value = true
  try {
    try { await dataStore.refetchSmetaCards() } catch (_) {}
    const getVal = (v) => (v && v.value !== undefined ? v.value : v)
    const cards = getVal(dataStore.smetaCards) || []

    const smetaNameMap = {
      leto: 'Лето',
      zima: 'Зима',
      vnereglament: 'Внерегламент'
    }

    const groups = []
    for (const card of cards) {
      uiStore.setSelectedSmeta(card.smeta_key)
      try { await dataStore.refetchSmetaDetails() } catch (_) {}
      const details = getVal(dataStore.smetaDetails) || []
      const key = card.smeta_key || card.smeta_key === 0 ? card.smeta_key : null
      const mapped = key && smetaNameMap[key] ? smetaNameMap[key] : null
      const title = mapped || card.title_ru || card.title || card.smeta_name || card.smeta_key
      groups.push({ title, rows: details, smeta_key: key })
    }

    const container = document.createElement('div')
    container.id = 'report-to-print-monthly'
    container.className = 'report-root'
    const title = `Отчёт по работам — ${month}`
    const generated = new Date().toLocaleString()

    const escapeHtml = (s) => String(s == null ? '' : s).replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]))

    let html = `\n      <header class="report-header">\n        <div>\n          <div class="report-title">${escapeHtml(title)}</div>\n        </div>\n        <div class="report-meta">\n          <div>Город: Подольск</div>\n          <div>Сформировано: ${escapeHtml(generated)}</div>\n        </div>\n      </header>\n    `

    html += '<section>'
    // Ensure generated HTML contains its own print-friendly styles so table fits A4 page
    html += `<style>
      .report-root{box-sizing:border-box;max-width:210mm;width:210mm;padding:8px;font-family:inherit}
      .report-table{width:100%;table-layout:fixed;border-collapse:collapse;border-spacing:0;font-size:12px}
      .report-table th,.report-table td{padding:6px 8px;border:0;vertical-align:top;white-space:normal;overflow-wrap:anywhere}
      .report-table th{font-weight:700;text-align:left}
      .report-row-compact td{padding-top:4px;padding-bottom:4px}
      .report-smeta-row td{background:transparent;font-weight:700;padding-top:8px;padding-bottom:8px}
      .report-total-row td,.report-smeta-row td{border-top:1px solid #ddd}
      .numeric{text-align:right}
    </style>`

    html += '<table class="report-table compact">'
    // define column widths to keep everything inside page width
    html += '<colgroup><col style="width:60%"><col style="width:10%"><col style="width:15%"><col style="width:15%"></colgroup>'
    html += '<thead><tr><th>Смета / Вид работы</th><th>Ед.</th><th>Объём</th><th>Сумма</th></tr></thead>'
    html += '<tbody>'

    let grandTotal = 0
    for (const g of groups) {
      // prefer Russian title fields if present
      const title = g.title_ru || g.title_ru_name || g.title || g.smeta_name || g.smeta_key || g.title
        const rows = (g.rows || []).map(r => {
          const amountNum = Number(r.fact_total ?? r.fact_amount ?? r.fact ?? r.amount ?? 0) || 0
          return { raw: r, amountNum }
        }).sort((a, b) => b.amountNum - a.amountNum)

        // compute group total first so we can show it inline in the smeta title row
        const groupTotal = rows.reduce((s, it) => s + (Number(it.amountNum) || 0), 0)
        const groupTotalStr = escapeHtml(groupTotal.toLocaleString('ru-RU'))
        grandTotal += groupTotal

        // render smeta title row with subtotal in the last column
        html += `<tr class="report-smeta-row"><td>${escapeHtml(title)}</td><td></td><td></td><td class="numeric" style="font-weight:700">${groupTotalStr}</td></tr>`

        for (const item of rows) {
          const r = item.raw
          const name = escapeHtml(r.title || r.name || r.description || '')

          // Robust unit extraction: prefer explicit `unit` fields
          const rawUnit = r.unit || r.unit_name || r.unit_ru || r.unit_short || r.units || r.unitName || ''
          const unit = escapeHtml(rawUnit || '')

          // Robust volume extraction: prefer `total_volume` then several fallbacks
          let rawVolume = null
          if (r.total_volume !== undefined && r.total_volume !== null && r.total_volume !== '') rawVolume = r.total_volume
          else if (r.totalVolume !== undefined && r.totalVolume !== null && r.totalVolume !== '') rawVolume = r.totalVolume
          else if (r.volume !== undefined && r.volume !== null && r.volume !== '') rawVolume = r.volume
          else if (r.volume_number !== undefined && r.volume_number !== null) rawVolume = r.volume_number
          else if (r.planned !== undefined && r.planned !== null) rawVolume = r.planned
          else if (r.planned_amount !== undefined && r.planned_amount !== null) rawVolume = r.planned_amount
          else if (r.plan !== undefined && r.plan !== null) rawVolume = r.plan

          let volume = ''
          if (rawVolume !== null && rawVolume !== undefined && rawVolume !== '') {
            const num = Number(rawVolume)
            if (!Number.isNaN(num)) {
              // Only the numeric value in the volume column (no unit appended)
              volume = num.toLocaleString('ru-RU')
            } else {
              volume = escapeHtml(String(rawVolume))
            }
          }

          const amount = item.amountNum
          const amountStr = escapeHtml(amount.toLocaleString('ru-RU'))
          html += `<tr class="report-row-compact"><td>${name}</td><td>${unit}</td><td>${escapeHtml(volume)}</td><td class="numeric">${amountStr}</td></tr>`
        }
    }

    // overall total
    const grandTotalStr = escapeHtml(grandTotal.toLocaleString('ru-RU'))
    html += `<tr class="report-total-row"><td colspan="3" style="text-align:right;font-weight:800">Итого</td><td class="numeric">${grandTotalStr}</td></tr>`

    html += '</tbody></table></section>'
    container.innerHTML = html
    document.body.appendChild(container)

    const html2pdf = await ensureHtml2pdf()
    if (!html2pdf) throw new Error('html2pdf not available')

    const opt = {
      margin: [8, 8, 8, 8],
      filename: props.fileName,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    }

    await html2pdf().set(opt).from(container).save()
    setTimeout(() => container.remove(), 2000)
  } catch (e) {
    console.error('Monthly PDF export failed', e)
    alert('Не удалось сформировать PDF — проверьте консоль для подробностей.')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.export-pdf-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
  /* Match header control appearance */
  background: var(--bg-card);
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-md);
  color: var(--text-main);
  cursor: pointer;
  font-weight: 600;
  height: 100%;
  min-height: 0;
}
.export-pdf-btn:disabled { opacity: 0.6; cursor: default }
.export-pdf-btn svg { color: var(--text-main); }
</style>
