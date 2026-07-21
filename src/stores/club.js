import { defineStore } from 'pinia'

const WORKING_KEY = 'cdsp_working_v1'

const POSITIONS = ['Base', 'Escolta', 'Alero', 'Ala-Pívot', 'Pívot']

// Categorías por defecto (semilla para una BD vacía o migración de datos antiguos).
// En runtime las categorías viven en db.categories y se editan desde el dashboard.
const DEFAULT_CATEGORIES = [
  { key: 'adulto', label: 'Adulto — Todo Competidor', short: 'Adulto', icon: 'fa-solid fa-basketball', desc: 'Nuestra categoría principal y competitiva. Abierta a todo competidor con ganas de mejorar, entrenar en serio y representar al club en la liga regional.' },
  { key: 'senior', label: 'Senior', short: 'Senior', icon: 'fa-solid fa-medal', desc: 'Para jugadores +35 que mantienen viva la pasión por el básquetbol. Entrenamiento adaptado, competencia sana y mucho compañerismo.' },
  { key: 'femenino', label: 'Femenino', short: 'Femenino', icon: 'fa-solid fa-fire-flame-curved', desc: 'Un espacio para que las jugadoras crezcan, compitan y hagan comunidad. Todos los niveles bienvenidos, del debut a la competencia.' },
]

function uid(pfx) {
  return (pfx || 'x') + Math.random().toString(36).slice(2, 9)
}

// Genera una clave URL-friendly a partir del nombre de la categoría.
function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function emptyDb() {
  return {
    settings: { heroVariant: 'split', venue: 'Gimnasio Municipal Project', contact: {} },
    categories: JSON.parse(JSON.stringify(DEFAULT_CATEGORIES)),
    cover: { badge: '', title: '', subtitle: '' },
    membership: { fee: 20000 },
    trainings: [],
    players: [],
    championships: [],
    gallery: [],
  }
}

export const useClubStore = defineStore('club', {
  state: () => ({
    db: emptyDb(),
    baseline: null, // último JSON publicado conocido (para detectar cambios sin publicar)
    loaded: false,
    dirty: false, // hay cambios locales sin publicar
    toast: null,
    _toastT: null,
  }),

  getters: {
    categoryList: (s) => s.db.categories || [],
    categories() {
      return this.categoryList.map((c) => c.key)
    },
    positions: () => POSITIONS,
    catOptions() {
      return this.categoryList.map((c) => ({ value: c.key, label: c.label }))
    },
    // Devuelven una función de lookup (reactiva ante cambios en db.categories).
    catLabel: (s) => (k) => { const c = (s.db.categories || []).find((x) => x.key === k); return c ? c.label : k },
    catShort: (s) => (k) => { const c = (s.db.categories || []).find((x) => x.key === k); return c ? c.short : k },
    catIcon: (s) => (k) => { const c = (s.db.categories || []).find((x) => x.key === k); return c && c.icon ? c.icon : 'fa-solid fa-basketball' },
    catDesc: (s) => (k) => { const c = (s.db.categories || []).find((x) => x.key === k); return c && c.desc ? c.desc : '' },
    // Fecha ISO (YYYY-MM-DD) → "12 jul". Formato libre/antiguo se muestra tal cual.
    formatDate: () => (iso) => {
      if (!iso) return 'Por confirmar'
      const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
      if (!m) return iso
      const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
      return `${parseInt(m[3], 10)} ${months[parseInt(m[2], 10) - 1]}`
    },
    venue: (s) => s.db.settings?.venue || 'Gimnasio Municipal Project',
    contactInfo: (s) => s.db.settings?.contact || {},
    heroVariant: (s) => s.db.settings?.heroVariant || 'split',
    fee: (s) => (s.db.membership && s.db.membership.fee != null ? s.db.membership.fee : 20000),
    feeLabel() {
      return '$' + this.fee.toLocaleString('es-CL')
    },
  },

  actions: {
    async load() {
      // Baseline = JSON publicado en el repo
      let baseline
      try {
        const res = await fetch(import.meta.env.BASE_URL + 'data/club.json', { cache: 'no-store' })
        baseline = await res.json()
      } catch (e) {
        baseline = emptyDb()
      }
      this.baseline = baseline

      // Working copy local (cambios del admin sin publicar)
      let working = null
      try {
        const raw = localStorage.getItem(WORKING_KEY)
        if (raw) working = JSON.parse(raw)
      } catch (e) {
        working = null
      }

      this.db = working || JSON.parse(JSON.stringify(baseline))

      // Migración: datos antiguos sin categorías → sembrar (del baseline o el default).
      if (!this.db.categories || !this.db.categories.length) {
        const seed = baseline && baseline.categories && baseline.categories.length
          ? baseline.categories
          : DEFAULT_CATEGORIES
        this.db.categories = JSON.parse(JSON.stringify(seed))
      }

      this.dirty = !!working && JSON.stringify(working) !== JSON.stringify(baseline)
      this.loaded = true
    },

    persist() {
      try {
        localStorage.setItem(WORKING_KEY, JSON.stringify(this.db))
      } catch (e) { /* almacenamiento lleno / no disponible */ }
      this.dirty = JSON.stringify(this.db) !== JSON.stringify(this.baseline)
    },

    discardChanges() {
      this.db = JSON.parse(JSON.stringify(this.baseline))
      try { localStorage.removeItem(WORKING_KEY) } catch (e) { /* noop */ }
      this.dirty = false
      this.showToast('Cambios descartados')
    },

    markPublished() {
      // Tras publicar, el baseline pasa a ser el estado actual
      this.baseline = JSON.parse(JSON.stringify(this.db))
      try { localStorage.removeItem(WORKING_KEY) } catch (e) { /* noop */ }
      this.dirty = false
    },

    showToast(msg) {
      this.toast = msg
      if (this._toastT) clearTimeout(this._toastT)
      this._toastT = setTimeout(() => { this.toast = null }, 3500)
    },
    closeToast() {
      this.toast = null
    },

    // ——— Portada / ajustes ———
    setCover(field, val) {
      this.db.cover[field] = val
      this.persist()
    },
    setFee(val) {
      if (!this.db.membership) this.db.membership = { fee: 20000 }
      this.db.membership.fee = parseInt(String(val).replace(/\D/g, ''), 10) || 0
      this.persist()
    },
    setHeroVariant(v) {
      if (!this.db.settings) this.db.settings = {}
      this.db.settings.heroVariant = v
      this.persist()
    },
    setVenue(val) {
      if (!this.db.settings) this.db.settings = {}
      this.db.settings.venue = val
      this.persist()
    },
    setContactField(field, val) {
      if (!this.db.settings) this.db.settings = {}
      if (!this.db.settings.contact) this.db.settings.contact = {}
      this.db.settings.contact[field] = val
      this.persist()
    },

    // ——— Categorías ———
    // Cuántos elementos referencian una categoría (para bloquear su eliminación).
    categoryUsage(key) {
      return {
        players: this.db.players.filter((p) => p.category === key).length,
        trainings: this.db.trainings.filter((t) => t.category === key).length,
        championships: this.db.championships.filter((c) => c.category === key).length,
      }
    },
    saveCategory(item) {
      if (!this.db.categories) this.db.categories = []
      const clean = {
        label: (item.label || '').trim(),
        short: (item.short || '').trim() || (item.label || '').trim(),
        icon: (item.icon || '').trim() || 'fa-solid fa-basketball',
        desc: (item.desc || '').trim(),
      }
      if (!clean.label) { this.showToast('El nombre es obligatorio'); return false }
      if (item.key) {
        const i = this.db.categories.findIndex((c) => c.key === item.key)
        if (i >= 0) this.db.categories[i] = { key: item.key, ...clean }
      } else {
        let base = slugify(clean.label) || 'categoria'
        let key = base
        let n = 2
        while (this.db.categories.some((c) => c.key === key)) key = `${base}-${n++}`
        this.db.categories.push({ key, ...clean })
      }
      this.persist()
      this.showToast('Categoría guardada')
      return true
    },
    deleteCategory(key) {
      const u = this.categoryUsage(key)
      const total = u.players + u.trainings + u.championships
      if (total > 0) {
        this.showToast(`No se puede eliminar: ${total} elemento(s) usan esta categoría`)
        return false
      }
      this.db.categories = (this.db.categories || []).filter((c) => c.key !== key)
      this.persist()
      this.showToast('Categoría eliminada')
      return true
    },

    // ——— Entrenamientos ———
    saveTraining(item) {
      if (item.id) {
        const i = this.db.trainings.findIndex((x) => x.id === item.id)
        if (i >= 0) this.db.trainings[i] = { ...this.db.trainings[i], ...item }
      } else {
        this.db.trainings.push({ id: uid('t'), ...item })
      }
      this.persist()
      this.showToast('Entrenamiento guardado')
    },
    deleteTraining(id) {
      this.db.trainings = this.db.trainings.filter((x) => x.id !== id)
      this.persist()
      this.showToast('Entrenamiento eliminado')
    },

    // ——— Jugadores ———
    savePlayer(item) {
      const p = { ...item, number: +item.number || 0 }
      if (p.id) {
        const i = this.db.players.findIndex((x) => x.id === p.id)
        if (i >= 0) this.db.players[i] = { ...this.db.players[i], ...p }
      } else {
        this.db.players.push({ id: uid('p'), ...p })
      }
      this.persist()
      this.showToast('Jugador guardado')
    },
    deletePlayer(id) {
      this.db.players = this.db.players.filter((x) => x.id !== id)
      this.persist()
      this.showToast('Jugador eliminado')
    },

    // ——— Campeonatos ———
    saveChampionship(item) {
      if (item.id) {
        const i = this.db.championships.findIndex((x) => x.id === item.id)
        if (i >= 0) {
          this.db.championships[i].name = item.name
          this.db.championships[i].category = item.category
          this.db.championships[i].status = item.status || 'En curso'
        }
      } else {
        this.db.championships.push({
          id: uid('c'), name: item.name, category: item.category,
          status: item.status || 'En curso', standings: [], results: [],
        })
      }
      this.persist()
      this.showToast('Campeonato guardado')
    },
    deleteChampionship(id) {
      this.db.championships = this.db.championships.filter((x) => x.id !== id)
      this.persist()
      this.showToast('Campeonato eliminado')
    },

    saveStanding(champId, item) {
      const ch = this.db.championships.find((x) => x.id === champId)
      if (!ch) return
      const row = { team: item.team, pj: +item.pj || 0, pg: +item.pg || 0, pp: +item.pp || 0 }
      if (item.id) {
        const i = ch.standings.findIndex((x) => x.id === item.id)
        if (i >= 0) ch.standings[i] = { id: item.id, ...row }
      } else {
        ch.standings.push({ id: uid('s'), ...row })
      }
      this.persist()
      this.showToast('Tabla actualizada')
    },
    deleteStanding(champId, id) {
      const ch = this.db.championships.find((x) => x.id === champId)
      if (ch) ch.standings = ch.standings.filter((x) => x.id !== id)
      this.persist()
      this.showToast('Equipo eliminado')
    },

    saveResult(champId, item) {
      const ch = this.db.championships.find((x) => x.id === champId)
      if (!ch) return
      const row = {
        id: item.id || uid('r'), date: item.date, home: item.home, away: item.away,
        hs: +item.hs || 0, as: +item.as || 0, status: item.status,
      }
      if (item.id) {
        const i = ch.results.findIndex((x) => x.id === item.id)
        if (i >= 0) ch.results[i] = row
      } else {
        ch.results.push(row)
      }
      this.persist()
      this.showToast('Partido guardado')
    },
    deleteResult(champId, id) {
      const ch = this.db.championships.find((x) => x.id === champId)
      if (ch) ch.results = ch.results.filter((x) => x.id !== id)
      this.persist()
      this.showToast('Partido eliminado')
    },

    // ——— Galería ———
    saveGalleryImage(item) {
      if (!this.db.gallery) this.db.gallery = []
      if (item.id) {
        const i = this.db.gallery.findIndex((x) => x.id === item.id)
        if (i >= 0) this.db.gallery[i] = { ...this.db.gallery[i], ...item }
      } else {
        this.db.gallery.push({ id: uid('g'), src: item.src, caption: item.caption || '' })
      }
      this.persist()
      this.showToast('Imagen guardada')
    },
    deleteGalleryImage(id) {
      this.db.gallery = (this.db.gallery || []).filter((x) => x.id !== id)
      this.persist()
      this.showToast('Imagen eliminada')
    },

    // ——— Utilidades de cálculo ———
    rankedStandings(ch) {
      const rows = (ch.standings || []).map((s) => ({ ...s, pts: s.pg * 2 }))
      rows.sort((a, b) => b.pts - a.pts || b.pg - a.pg || a.pp - b.pp)
      return rows.map((r, i) => ({ ...r, rank: i + 1 }))
    },

    exportJson() {
      return JSON.stringify(this.db, null, 2)
    },
  },
})
