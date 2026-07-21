import { defineStore } from 'pinia'

const WORKING_KEY = 'cdsp_working_v1'

const CAT_LABELS = { adulto: 'Adulto — Todo Competidor', senior: 'Senior', femenino: 'Femenino' }
const CAT_SHORT = { adulto: 'Adulto', senior: 'Senior', femenino: 'Femenino' }
const CAT_ICONS = { adulto: 'fa-solid fa-basketball', senior: 'fa-solid fa-medal', femenino: 'fa-solid fa-fire-flame-curved' }
const CAT_DESCS = {
  adulto: 'Nuestra categoría principal y competitiva. Abierta a todo competidor con ganas de mejorar, entrenar en serio y representar al club en la liga regional.',
  senior: 'Para jugadores +35 que mantienen viva la pasión por el básquetbol. Entrenamiento adaptado, competencia sana y mucho compañerismo.',
  femenino: 'Un espacio para que las jugadoras crezcan, compitan y hagan comunidad. Todos los niveles bienvenidos, del debut a la competencia.',
}
const POSITIONS = ['Base', 'Escolta', 'Alero', 'Ala-Pívot', 'Pívot']
const CATEGORIES = ['adulto', 'senior', 'femenino']

function uid(pfx) {
  return (pfx || 'x') + Math.random().toString(36).slice(2, 9)
}

function emptyDb() {
  return {
    settings: { heroVariant: 'split', venue: 'Gimnasio Municipal Project', contact: {} },
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
    categories: () => CATEGORIES,
    positions: () => POSITIONS,
    catOptions: () => CATEGORIES.map((k) => ({ value: k, label: CAT_LABELS[k] })),
    venue: (s) => s.db.settings?.venue || 'Gimnasio Municipal Project',
    contactInfo: (s) => s.db.settings?.contact || {},
    heroVariant: (s) => s.db.settings?.heroVariant || 'split',
    fee: (s) => (s.db.membership && s.db.membership.fee != null ? s.db.membership.fee : 20000),
    feeLabel() {
      return '$' + this.fee.toLocaleString('es-CL')
    },
  },

  actions: {
    catLabel: (k) => CAT_LABELS[k] || k,
    catShort: (k) => CAT_SHORT[k] || k,
    catIcon: (k) => CAT_ICONS[k] || 'fa-solid fa-basketball',
    catDesc: (k) => CAT_DESCS[k] || '',

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
        }
      } else {
        this.db.championships.push({
          id: uid('c'), name: item.name, category: item.category,
          status: 'En curso', standings: [], results: [],
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
