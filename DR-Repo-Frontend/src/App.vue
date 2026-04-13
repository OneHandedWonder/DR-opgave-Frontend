<script setup>
import { ref, onMounted, computed, reactive } from 'vue'
import { getRecords, createRecord, updateRecord, deleteRecord } from './servises/recordsAPI.js'

const records = ref([])
const loading = ref(true)
const error = ref(null)
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
    error.value = 'Failed to load records.'
  } finally {
    loading.value = false
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

onMounted(fetchRecords)
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
          <button @click="openAddForm" class="btn-ink">+ Add Record</button>
          <button @click="fetchRecords" class="btn-outline">Refresh</button>
        </div>
      </header>

      <section v-if="showForm" class="form-card">
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

      <section class="control-grid">
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

      <section v-if="!loading && !error" class="sort-row">
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

      <div v-if="loading" class="loading">Loading records...</div>
      <div v-if="error" class="error-box">{{ error }}</div>

      <section class="table-wrap" v-if="!loading && !error">
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

      <div v-if="!loading && !error && filteredAndSortedRecords.length === 0" class="empty-state">
        No records found
      </div>
    </main>
  </div>
</template>

<style scoped>
:global(html, body) {
  margin: 0;
  height: 100%;
}

:global(body) {
  --ink: #12343b;
  --soft-line: #d6ddd9;
  --teal: #1f7a69;
  --teal-deep: #14594c;
  --card: rgba(255, 255, 255, 0.82);
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--ink);
  background:
    radial-gradient(circle at 16% 18%, rgba(31, 122, 105, 0.18), transparent 32%),
    radial-gradient(circle at 84% 0%, rgba(18, 52, 59, 0.22), transparent 36%),
    linear-gradient(140deg, #f3ede1 0%, #efece3 42%, #e6efec 100%);
  font-family: "Avenir Next", "Gill Sans", "Trebuchet MS", sans-serif;
}

:global(#app) {
  width: 100%;
  display: flex;
  justify-content: center;
}

.page-shell { position: relative; padding: 2.25rem 1rem; width: 100%; box-sizing: border-box; }

.grain {
  position: fixed; inset: 0; pointer-events: none; opacity: 0.08;
  background-image: radial-gradient(var(--ink) 0.45px, transparent 0.45px);
  background-size: 3px 3px;
}

.records-panel {
  position: relative; max-width: 1100px; margin: 0 auto;
  border: 1px solid rgba(18, 52, 59, 0.18); border-radius: 20px;
  background: var(--card); backdrop-filter: blur(5px);
  box-shadow: 0 20px 48px rgba(17, 44, 50, 0.18); overflow: hidden;
  animation: panel-in 420ms ease-out;
}

.records-header {
  display: flex; align-items: flex-start; justify-content: space-between;
  gap: 1rem; padding: 1.75rem 1.8rem 1.25rem;
  border-bottom: 1px solid var(--soft-line);
}

.header-actions { display: flex; gap: 0.5rem; align-items: center; }

.eyebrow {
  text-transform: uppercase; letter-spacing: 0.12em; margin: 0;
  font-size: 0.74rem; color: var(--teal-deep); font-weight: 700;
}

h1 { margin: 0.2rem 0 0.35rem; font-size: clamp(1.7rem, 3.4vw, 2.35rem); line-height: 1.1; }
.subtitle { margin: 0; color: #406168; font-size: 0.95rem; }

.btn-ink, .btn-outline, .btn-clear, .segmented button, .th-btn, .btn-edit, .btn-delete {
  border: 0; cursor: pointer; font-size: 0.875rem; border-radius: 8px;
}

.btn-ink {
  padding: 0.55rem 1rem;
  background: linear-gradient(145deg, var(--teal), var(--teal-deep));
  color: #fff; font-weight: 650;
  box-shadow: 0 6px 14px rgba(20, 89, 76, 0.28);
  transition: transform 150ms ease;
}
.btn-ink:hover { transform: translateY(-1px); }

.btn-outline {
  padding: 0.55rem 1rem; background: #eef4f1;
  color: var(--teal-deep); font-weight: 650; border: 1px solid #d6e5df;
}

.form-card {
  margin: 1.2rem 1.8rem; padding: 1.4rem;
  border: 1px solid #d0e3dd; border-radius: 14px; background: #f4faf8;
}
.form-card h2 { margin: 0 0 1rem; font-size: 1.1rem; color: var(--teal-deep); }

.form-row { display: flex; gap: 1rem; margin-bottom: 0.75rem; }

.form-row label {
  display: flex; flex-direction: column; flex: 1;
  font-size: 0.82rem; font-weight: 650; color: #3f6466;
  text-transform: uppercase; letter-spacing: 0.05em; gap: 0.3rem;
}

.form-row input {
  padding: 0.42rem 0.65rem; border: 1px solid var(--soft-line);
  border-radius: 10px; font-size: 0.95rem; color: var(--ink); background: #fff;
}

.form-actions { display: flex; gap: 0.5rem; margin-top: 1rem; }

.control-grid {
  display: grid; grid-template-columns: 2fr 1.3fr 0.8fr 0.8fr auto;
  gap: 0.75rem; padding: 1.2rem 1.8rem 0.75rem; align-items: end;
}

.control-block { display: flex; flex-direction: column; gap: 0.35rem; }

.control-block span {
  font-size: 0.76rem; font-weight: 650; color: #3f6466;
  text-transform: uppercase; letter-spacing: 0.06em;
}

.control-block input, .sort-row select {
  height: 2.3rem; border-radius: 12px; border: 1px solid var(--soft-line);
  padding: 0.45rem 0.68rem; background: #fbfcfb; color: var(--ink);
}

.btn-clear {
  height: 2.3rem; border-radius: 12px; background: #eef4f1;
  color: var(--teal-deep); font-weight: 650; border: 1px solid #d6e5df; padding: 0 0.9rem;
}

.sort-row { display: flex; align-items: center; gap: 0.55rem; padding: 0.45rem 1.8rem 1rem; }
.sort-row label { font-size: 0.84rem; color: #3f6466; font-weight: 650; }
.sort-row select { min-width: 138px; }

.segmented { display: inline-flex; border-radius: 10px; border: 1px solid #c8d7d1; overflow: hidden; }
.segmented button { padding: 0.42rem 0.78rem; background: #f5f8f7; color: #2f5559; font-weight: 650; }
.segmented button.active { background: var(--teal); color: #fff; }

.loading, .error-box, .empty-state {
  margin: 0.85rem 1.8rem 1rem; border-radius: 12px; padding: 0.85rem 0.95rem;
}
.loading, .empty-state { background: #f1f5f4; color: #406168; }
.error-box { background: #fff1ec; color: #8d3e2e; border: 1px solid #f3c7ba; }

.table-wrap {
  overflow-x: auto; margin: 0.5rem 1.1rem 1.25rem;
  border-radius: 16px; border: 1px solid #d5e1dc; background: #fdfdfc;
}

table { width: 100%; border-collapse: collapse; min-width: 860px; }

thead th {
  background: linear-gradient(180deg, #1c6458, #14564a);
  color: #f8fffd; font-size: 0.8rem; text-transform: uppercase;
  letter-spacing: 0.05em; border-bottom: 1px solid #2d7b6c; padding: 0.7rem 0.65rem;
}

.th-btn { background: transparent; color: inherit; font: inherit; text-transform: inherit; letter-spacing: inherit; padding: 0; }

tbody td {
  padding: 0.6rem 0.65rem; border-bottom: 1px solid #edf2f0;
  text-align: center; color: #23474f; font-size: 0.92rem;
}
tbody tr { transition: background-color 140ms ease; }
tbody tr:hover { background: #f2f8f5; }

.genre-pill {
  display: inline-block; padding: 0.2rem 0.48rem; border-radius: 999px;
  background: #e6f2ee; color: #1f6256; font-size: 0.8rem; font-weight: 650;
}

.row-actions { display: flex; gap: 0.35rem; justify-content: center; }

.btn-edit { padding: 0.3rem 0.7rem; background: #ff9800; color: #fff; font-weight: 600; }
.btn-delete { padding: 0.3rem 0.7rem; background: #f44336; color: #fff; font-weight: 600; }
.btn-edit:hover, .btn-delete:hover { opacity: 0.85; }

@media (max-width: 900px) { .control-grid { grid-template-columns: 1fr 1fr; } }

@media (max-width: 640px) {
  .records-header { flex-direction: column; align-items: stretch; }
  .control-grid { grid-template-columns: 1fr; }
  .sort-row { flex-wrap: wrap; }
  .form-row { flex-direction: column; }
}

@keyframes panel-in {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
</style>
