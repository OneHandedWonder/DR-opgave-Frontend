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
const signInName = ref('admin')
const signInPassword = ref('admin123')
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

async function fetchRecords() {
  loading.value = true
  error.value = null
  try {
    records.value = await getRecords()
  } catch (e) {
    if (e?.response?.status === 401) {
      error.value = 'Sign in to load records.'
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
    authError.value = 'Invalid username or password.'
  }
}

async function signOut() {
  if (!token.value) return

  try {
    await logout(token.value)
  } catch (e) {
    console.error('Error signing out:', e)
  } finally {
    localStorage.removeItem('dr-token')
    localStorage.removeItem('dr-user')
    token.value = ''
    authUser.value = ''
    records.value = []
    error.value = null
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
        <div>
          <p class="eyebrow">Archive</p>
          <h1>Record Collection</h1>
          <p class="subtitle">Browse, filter, and sort your catalog.</p>
        </div>
        <div class="header-actions">
          <button v-if="isSignedIn" @click="openAddForm" class="btn-ink">+ Add Record</button>
          <button v-if="isSignedIn" @click="fetchRecords" class="btn-outline">Refresh</button>
          <button v-if="isSignedIn" @click="signOut" class="btn-outline">Sign out</button>
        </div>
      </header>

      <section v-if="!isSignedIn" class="form-card">
        <h2>Sign in</h2>
        <div class="form-row">
          <label>Username<input v-model="signInName" autocomplete="username" /></label>
          <label>Password<input v-model="signInPassword" type="password" autocomplete="current-password" /></label>
        </div>
        <div class="form-actions">
          <button type="button" class="btn-ink" @click="signIn">Sign in</button>
        </div>
        <p v-if="authError" class="error-box">{{ authError }}</p>
      </section>

      <section v-else class="loading" style="margin-top: 1rem;">
        Signed in as {{ authUser || 'user' }}
      </section>

      <section v-if="showForm && isSignedIn" class="form-card">
        <h2>{{ editingId !== null ? 'Edit Record' : 'New Record' }}</h2>
        <form @submit.prevent="submitForm">
          <div class="form-row">
            <label>Name<input v-model="form.name" required /></label>
            <label>Artist<input v-model="form.artist" required /></label>
          </div>
          <div class="form-row">
            <label>Genre<input v-model="form.genre" required /></label>
            <label>Release Year<input v-model="form.releaseYear" type="number" required /></label>
          </div>
          <div class="form-row">
            <label>Tracks<input v-model="form.trackCount" type="number" required /></label>
            <label>Duration (s)<input v-model="form.duration" type="number" required /></label>
          </div>
          <div class="form-actions">
            <button type="submit" class="btn-ink">Save</button>
            <button type="button" class="btn-outline" @click="cancelForm">Cancel</button>
          </div>
        </form>
      </section>

      <section v-if="isSignedIn" class="control-grid">
        <label class="control-block">
          <span>Name or artist</span>
          <input v-model="filterText" placeholder="Search text" />
        </label>
        <label class="control-block">
          <span>Genre</span>
          <input v-model="filterGenre" placeholder="Rock, Jazz, Pop..." />
        </label>
        <label class="control-block small">
          <span>Min year</span>
          <input v-model.number="filterMinYear" placeholder="1960" type="number" />
        </label>
        <label class="control-block small">
          <span>Max year</span>
          <input v-model.number="filterMaxYear" placeholder="2026" type="number" />
        </label>
        <button @click="clearFilters" class="btn-clear">Clear filters</button>
      </section>

      <section v-if="isSignedIn && !loading && !error" class="sort-row">
        <label for="sort-column">Sort by</label>
        <select id="sort-column" v-model="sortBy">
          <option value="id">ID</option>
          <option value="name">Name</option>
          <option value="releaseYear">Year</option>
          <option value="artist">Artist</option>
          <option value="genre">Genre</option>
          <option value="trackCount">Tracks</option>
          <option value="duration">Duration</option>
        </select>
        <div class="segmented">
          <button type="button" :class="{ active: sortOrder === 'asc' }" @click="sortOrder = 'asc'">Asc</button>
          <button type="button" :class="{ active: sortOrder === 'desc' }" @click="sortOrder = 'desc'">Desc</button>
        </div>
      </section>

      <div v-if="isSignedIn && loading" class="loading">Loading records...</div>
      <div v-if="error" class="error-box">{{ error }}</div>

      <section class="table-wrap" v-if="isSignedIn && !loading && !error">
        <table>
          <thead>
            <tr>
              <th><button type="button" class="th-btn" @click="setSort('id')">ID {{ sortIndicator('id') }}</button></th>
              <th><button type="button" class="th-btn" @click="setSort('name')">Name {{ sortIndicator('name') }}</button></th>
              <th><button type="button" class="th-btn" @click="setSort('releaseYear')">Year {{ sortIndicator('releaseYear') }}</button></th>
              <th><button type="button" class="th-btn" @click="setSort('artist')">Artist {{ sortIndicator('artist') }}</button></th>
              <th><button type="button" class="th-btn" @click="setSort('genre')">Genre {{ sortIndicator('genre') }}</button></th>
              <th><button type="button" class="th-btn" @click="setSort('trackCount')">Tracks {{ sortIndicator('trackCount') }}</button></th>
              <th><button type="button" class="th-btn" @click="setSort('duration')">Duration {{ sortIndicator('duration') }}</button></th>
              <th>Actions</th>
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
                <button class="btn-edit" @click="openEditForm(record)">Edit</button>
                <button class="btn-delete" @click="removeRecord(record.id)">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <div v-if="isSignedIn && !loading && !error && filteredAndSortedRecords.length === 0" class="empty-state">
        No records found
      </div>
    </main>
  </div>
</template>
