<script setup>
import { ref, onMounted, computed, reactive } from 'vue'
import { getRecords, createRecord, updateRecord, deleteRecord } from './services/RecordsAPI.js'
import { login, logout } from './services/Auth.js'
import './stylesheet.css'
const records = ref([])
const loading = ref(true)
const error = ref(null)
const authUser = ref(localStorage.getItem('dr-user') || '')
const token = ref(localStorage.getItem('dr-token') || '')
const signInName = ref('')
const signInPassword = ref('')
const authError = ref(null)
const filterText = ref('')
const filterGenre = ref('')
const filterMinYear = ref(null)
const filterMaxYear = ref(null)
const sortBy = ref('id')
const sortOrder = ref('asc')
const showForm = ref(false)
const editingId = ref(null)

const emptyForm = () => ({ name: '', artist: '', genre: '', releaseYear: '', trackCount: '', duration: '' })
const form = reactive(emptyForm())

const isSignedIn = computed(() => Boolean(token.value))

const filteredAndSortedRecords = computed(() => {
  const text = filterText.value.trim().toLowerCase()
  const genre = filterGenre.value.trim().toLowerCase()
  const minYear = filterMinYear.value
  const maxYear = filterMaxYear.value

  const filtered = records.value.filter((r) => {
    const matchesText = text === '' || (r.name ?? '').toLowerCase().includes(text) || (r.artist ?? '').toLowerCase().includes(text)
    const matchesGenre = genre === '' || (r.genre ?? '').toLowerCase().includes(genre)
    const matchesMin = minYear == null || r.releaseYear >= minYear
    const matchesMax = maxYear == null || r.releaseYear <= maxYear
    return matchesText && matchesGenre && matchesMin && matchesMax
  })

  return [...filtered].sort((a, b) => {
    const av = a[sortBy.value] ?? ''
    const bv = b[sortBy.value] ?? ''
    const cmp = typeof av === 'string' ? av.localeCompare(bv) : av - bv
    return sortOrder.value === 'asc' ? cmp : -cmp
  })
})

function clearAuthState() {
  localStorage.removeItem('dr-token')
  localStorage.removeItem('dr-user')
  token.value = ''
  authUser.value = ''
  records.value = []
  error.value = null
}

async function fetchRecords() {
  loading.value = true
  error.value = null
  try {
    records.value = await getRecords()
  } catch (e) {
    if (e?.response?.status === 401) {
      clearAuthState()
      authError.value = 'Your session has expired. Please sign in again.'
    } else {
      error.value = 'Failed to load records.'
    }
  } finally {
    loading.value = false
  }
}

async function signIn() {
  authError.value = null
  try {
    const result = await login(signInName.value, signInPassword.value)
    token.value = result.token
    authUser.value = result.username
    localStorage.setItem('dr-token', result.token)
    localStorage.setItem('dr-user', result.username)
    await fetchRecords()
  } catch (e) {
    if (e?.response?.status === 401) {
      authError.value = 'Invalid username or password.'
    } else {
      authError.value = 'Failed to sign in. Please try again.'
    }
  }
}

async function signOut() {
  if (!token.value) return

  try {
    await logout(token.value)
  } catch (e) {
    console.error('Error signing out:', e)
  } finally {
    clearAuthState()
  }
}

function clearFilters() {
  filterText.value = ''
  filterGenre.value = ''
  filterMinYear.value = null
  filterMaxYear.value = null
}

function setSort(col) {
  if (sortBy.value === col) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortBy.value = col
    sortOrder.value = 'asc'
  }
}

function sortIndicator(col) {
  if (sortBy.value !== col) return ''
  return sortOrder.value === 'asc' ? '▲' : '▼'
}

function openAddForm() {
  Object.assign(form, emptyForm())
  editingId.value = null
  showForm.value = true
}

function openEditForm(record) {
  Object.assign(form, {
    name: record.name,
    artist: record.artist,
    genre: record.genre,
    releaseYear: record.releaseYear,
    trackCount: record.trackCount,
    duration: record.duration,
  })
  editingId.value = record.id
  showForm.value = true
}

function cancelForm() {
  showForm.value = false
  editingId.value = null
}

async function submitForm() {
  const payload = {
    name: form.name,
    artist: form.artist,
    genre: form.genre,
    releaseYear: Number(form.releaseYear),
    trackCount: Number(form.trackCount),
    duration: Number(form.duration),
  }
  try {
    if (editingId.value !== null) {
      const updated = await updateRecord(editingId.value, payload)
      const i = records.value.findIndex((r) => r.id === editingId.value)
      if (i !== -1) records.value[i] = updated
    } else {
      const created = await createRecord(payload)
      records.value.push(created)
    }
    cancelForm()
  } catch (e) {
    console.error('Error saving record:', e)
  }
}

async function removeRecord(id) {
  if (!confirm('Delete this record?')) return
  try {
    await deleteRecord(id)
    records.value = records.value.filter((r) => r.id !== id)
  } catch (e) {
    console.error('Error deleting record:', e)
  }
}


onMounted(() => {
  if (token.value) {
    fetchRecords()
  } else {
    loading.value = false
  }
})
</script>

<template>
  <div class="page-shell">
    <div class="grain"></div>
    <main class="records-panel">
      <header class="records-header">
        <div class="brand-wrap">
          <img class="dr-mark-img" src="/DRLYD_logo.png" alt="DR mark" />
          <div>
            <p class="eyebrow">Danmarks Radio</p>
            <h1>Musikarkiv</h1>
            <p class="subtitle">Se, filtrer og sorter samlingen</p>
          </div>
        </div>
        <div class="header-actions">
          <button id="create-record-button" v-if="isSignedIn" @click="openAddForm" class="btn-ink">+ Tilføj plade</button>
          <button v-if="isSignedIn" @click="fetchRecords" class="btn-outline">Opdater</button>
          <button v-if="isSignedIn" @click="signOut" class="btn-outline">Log ud</button>
          <!-- Previous variant kept for reference:
          <button id="create-record-button" @click="openAddForm" class="btn-ink">+ Add Record</button>
          <button @click="fetchRecords" class="btn-outline">Refresh</button>
          -->
        </div>
      </header>

      <section v-if="!isSignedIn" class="form-card">
        <h2>Log ind</h2>
        <div class="form-row">
          <label>Brugernavn<input v-model="signInName" autocomplete="username" /></label>
          <label>Kodeord<input v-model="signInPassword" type="password" autocomplete="current-password" /></label>
        </div>
        <div class="form-actions">
          <button type="button" class="btn-ink" @click="signIn">Log ind</button>
        </div>
        <p v-if="authError" class="error-box">{{ authError }}</p>
      </section>

      <section v-else class="session-banner">
        Logget ind som <strong>{{ authUser || 'user' }}</strong>
      </section>

      <section v-if="showForm && isSignedIn" class="form-card">
        <h2>{{ editingId !== null ? 'Rediger plade' : 'Ny plade' }}</h2>
        <form @submit.prevent="submitForm">
          <div class="form-row">
            <label>Titel<input v-model="form.name" required /></label>
            <label>Artist<input v-model="form.artist" required /></label>
          </div>
          <div class="form-row">
            <label>Genre<input v-model="form.genre" required /></label>
            <label>Udgivelsesar<input v-model="form.releaseYear" type="number" required /></label>
          </div>
          <div class="form-row">
            <label>Numre<input v-model="form.trackCount" type="number" required /></label>
            <label>Varighed (s)<input v-model="form.duration" type="number" required /></label>
          </div>
          <div class="form-actions">
            <button type="submit" class="btn-ink">Gem</button>
            <button type="button" class="btn-outline" @click="cancelForm">Annuller</button>
          </div>
        </form>
      </section>

      <section v-if="isSignedIn" class="control-grid">
        <label class="control-block">
          <span>Titel eller artist</span>
          <input v-model="filterText" placeholder="Søg i tekst" />
        </label>
        <label class="control-block">
          <span>Genre</span>
          <input v-model="filterGenre" placeholder="Rock, Jazz, Pop" />
        </label>
        <label class="control-block small">
          <span>Fra ar</span>
          <input v-model.number="filterMinYear" placeholder="1960" type="number" />
        </label>
        <label class="control-block small">
          <span>Til ar</span>
          <input v-model.number="filterMaxYear" placeholder="2026" type="number" />
        </label>
        <button @click="clearFilters" class="btn-clear">Ryd filtre</button>
      </section>

      <section v-if="isSignedIn && !loading && !error" class="sort-row">
        <label for="sort-column">Sorter efter</label>
        <select id="sort-column" v-model="sortBy">
          <option value="id">ID</option>
          <option value="name">Titel</option>
          <option value="releaseYear">Ar</option>
          <option value="artist">Artist</option>
          <option value="genre">Genre</option>
          <option value="trackCount">Numre</option>
          <option value="duration">Varighed (s)</option>
        </select>
        <div class="segmented">
          <button type="button" :class="{ active: sortOrder === 'asc' }" @click="sortOrder = 'asc'">Asc</button>
          <button type="button" :class="{ active: sortOrder === 'desc' }" @click="sortOrder = 'desc'">Desc</button>
        </div>
      </section>

      <div v-if="isSignedIn && loading" class="loading">Henter plader...</div>
      <div v-if="error" class="error-box">{{ error }}</div>

      <section class="table-wrap" v-if="isSignedIn && !loading && !error">
        <table>
          <thead>
            <tr>
              <th><button type="button" class="th-btn" @click="setSort('id')">ID {{ sortIndicator('id') }}</button></th>
              <th><button type="button" class="th-btn" @click="setSort('name')">Titel {{ sortIndicator('name') }}</button></th>
              <th><button type="button" class="th-btn" @click="setSort('releaseYear')">Ar {{ sortIndicator('releaseYear') }}</button></th>
              <th><button type="button" class="th-btn" @click="setSort('artist')">Artist {{ sortIndicator('artist') }}</button></th>
              <th><button type="button" class="th-btn" @click="setSort('genre')">Genre {{ sortIndicator('genre') }}</button></th>
              <th><button type="button" class="th-btn" @click="setSort('trackCount')">Numre {{ sortIndicator('trackCount') }}</button></th>
              <th><button type="button" class="th-btn" @click="setSort('duration')">Varighed (s) {{ sortIndicator('duration') }}</button></th>
              <th>Handlinger</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="record in filteredAndSortedRecords" :key="record.id">
              <td>{{ record.id }}</td>
              <td>{{ record.name }}</td>
              <td>{{ record.releaseYear }}</td>
              <td>{{ record.artist }}</td>
              <td><span class="genre-pill">{{ record.genre }}</span></td>
              <td>{{ record.trackCount }}</td>
              <td>{{ record.duration }}</td>
              <td class="row-actions">
                <button class="btn-edit edit-record-button" @click="openEditForm(record)">Rediger</button>
                <button class="btn-delete delete-record-button" @click="removeRecord(record.id)">Slet</button>
                <!-- Previous variant kept for reference:
                <button class="btn-edit edit-record-button" @click="openEditForm(record)">Edit</button>
                <button class="btn-delete delete-record-button" @click="removeRecord(record.id)">Delete</button>
                -->
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <div v-if="isSignedIn && !loading && !error && filteredAndSortedRecords.length === 0" class="empty-state">
        Ingen plader fundet
      </div>
    </main>
  </div>
</template>
