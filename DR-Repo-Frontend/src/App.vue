<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useApiHealth } from './composables/useApiHealth.js'
import { useAuthRecords } from './composables/useAuthRecords.js'
import { useRadioPlayer } from './composables/useRadioPlayer.js'
import { useTracksView } from './composables/useTracksView.js'
import './stylesheet.css'

const activeView = ref('albums')
const isAlbumsView = computed(() => activeView.value === 'albums')
const isTracksView = computed(() => activeView.value === 'tracks')

const authRecords = useAuthRecords()
const tracksView = useTracksView()
const radioPlayer = useRadioPlayer()
const apiHealth = useApiHealth()

const {
  records,
  loading,
  error,
  authUser,
  token,
  signInName,
  signInPassword,
  authError,
  filterText,
  filterGenre,
  filterMinYear,
  filterMaxYear,
  sortBy,
  sortOrder,
  showForm,
  editingId,
  form,
  isSignedIn,
  filteredAndSortedRecords,
  fetchRecords,
  signIn,
  signOut,
  clearFilters,
  setSort,
  sortIndicator,
  openAddForm,
  openEditForm,
  cancelForm,
  submitForm,
  removeRecord,
} = authRecords

const {
  tracks,
  tracksLoading,
  tracksError,
  tracksUpdatedAt,
  tracksLoaded,
  trackFilterText,
  trackSortBy,
  trackSortOrder,
  filteredAndSortedTracks,
  fetchTracks,
  clearTrackFilters,
  trackSortIndicator,
  setTrackSort,
  displayChannelLabel,
  formatPlayedAt,
} = tracksView

const {
  radioNowPlaying,
  radioLoading,
  radioError,
  radioUpdatedAt,
  radioPlaybackError,
  listeningStationSlug,
  isStationPlaying,
  radioVolume,
  radioMuted,
  radioCards,
  currentListeningStation,
  canListenToStation,
  listenButtonLabel,
  fetchRadioNowPlaying,
  toggleStationPlayback,
  toggleGlobalPlayback,
  stopPlayback,
  setRadioVolume,
  toggleMute,
  startRadioPolling,
  stopRadioPolling,
  initializeAudio,
  disposeAudio,
} = radioPlayer

const {
  apiHealthStatus,
  apiHealthCheckedAt,
  apiHealthDetails,
  isHealthDrawerOpen,
  apiHealthLabel,
  apiHealthClass,
  healthChecks,
  healthTables,
  fetchApiHealthStatus,
  toggleHealthDrawer,
  closeHealthDrawer,
  startHealthPolling,
  stopHealthPolling,
} = apiHealth

function formatHealthTimestamp(value) {
  if (!value) return 'N/A'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'N/A'
  return date.toLocaleString('da-DK', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function switchView(view) {
  activeView.value = view
}

async function refreshCurrentView() {
  if (isTracksView.value) {
    await fetchTracks()
    return
  }

  await fetchRecords()
}

watch(activeView, async (view) => {
  if (view === 'tracks' && !tracksLoaded.value && !tracksLoading.value) {
    await fetchTracks()
  }
})

onMounted(() => {
  initializeAudio()

  fetchRadioNowPlaying()
  fetchApiHealthStatus()
  startRadioPolling()
  startHealthPolling()

  if (token.value) {
    fetchRecords()
  } else {
    loading.value = false
  }
})

onUnmounted(() => {
  disposeAudio()
  stopRadioPolling()
  stopHealthPolling()
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
            <p class="subtitle">Skift mellem albums og tracks uden at miste overblikket</p>
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

      <section v-if="isHealthDrawerOpen" id="health-drawer" class="health-drawer" aria-label="API sundhedsdetaljer">
        <div class="health-drawer-header">
          <h2>API Sundhed</h2>
          <div class="health-drawer-actions">
            <button type="button" class="btn-outline" @click="fetchApiHealthStatus">Opdater</button>
            <button type="button" class="btn-outline" @click="closeHealthDrawer">Luk</button>
          </div>
        </div>

        <div class="health-summary-grid">
          <article class="health-summary-card">
            <h3>Status</h3>
            <p>{{ apiHealthStatus }}</p>
          </article>
          <article class="health-summary-card">
            <h3>Sidst tjekket</h3>
            <p>{{ apiHealthCheckedAt ? apiHealthCheckedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A' }}</p>
          </article>
          <article class="health-summary-card">
            <h3>Total varighed</h3>
            <p>{{ apiHealthDetails?.totalDurationMs != null ? `${Math.round(apiHealthDetails.totalDurationMs)} ms` : 'N/A' }}</p>
          </article>
        </div>

        <div class="health-grid">
          <div class="health-card">
            <h3>Checks</h3>
            <div v-if="healthChecks.length === 0" class="health-empty">Ingen checks fundet.</div>
            <ul v-else class="health-list">
              <li v-for="item in healthChecks" :key="item.name" class="health-list-item">
                <div class="health-list-title">{{ item.name }}</div>
                <div class="health-list-meta">
                  <span class="badge" :class="item.statusClass">{{ item.status }}</span>
                  <span>{{ item.durationMs != null ? `${Math.round(item.durationMs)} ms` : 'N/A' }}</span>
                </div>
                <p v-if="item.description" class="health-desc">{{ item.description }}</p>
              </li>
            </ul>
          </div>

          <div class="health-card">
            <h3>Tabeller</h3>
            <div v-if="healthTables.length === 0" class="health-empty">Ingen tabeldata fundet.</div>
            <ul v-else class="health-list">
              <li v-for="table in healthTables" :key="table.name" class="health-list-item">
                <div class="health-list-title">{{ table.name }}</div>
                <div class="health-list-meta">
                  <span class="badge" :class="table.statusClass">{{ table.status }}</span>
                  <span>Rows: {{ table.rowCount ?? 'N/A' }}</span>
                </div>
                <p class="health-desc">Newest: {{ formatHealthTimestamp(table.newestRowTimestampUtc) }}</p>
                <p v-if="table.error" class="health-error">{{ table.error }}</p>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section class="now-playing-banner" aria-label="Aktuelt på DR">
        <div class="now-playing-header">
          <div>
            <p class="eyebrow">Live på DR</p>
            <h2>Aktuelle numre på P1 - P6</h2>
          </div>
          <div class="now-playing-meta">
            <span v-if="radioLoading">Opdaterer...</span>
            <span v-else-if="radioUpdatedAt">Senest opdateret {{ radioUpdatedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}</span>
          </div>
        </div>

        <div v-if="radioError" class="radio-error">{{ radioError }}</div>
        <div v-if="radioPlaybackError" class="radio-error">{{ radioPlaybackError }}</div>

        <div v-if="currentListeningStation" class="audio-control-bar" role="group" aria-label="Lydkontrol">
          <div class="audio-control-meta">
            <p class="audio-control-kicker">Afspiller nu</p>
            <p class="audio-control-station">{{ currentListeningStation.channelTitle }}</p>
          </div>
          <div class="audio-control-actions">
            <button type="button" class="btn-outline" @click="toggleGlobalPlayback">
              {{ isStationPlaying ? 'Pause' : 'Afspil' }}
            </button>
            <button type="button" class="btn-outline" @click="stopPlayback">Stop</button>
            <button type="button" class="btn-outline" @click="toggleMute">{{ radioMuted ? 'Unmute' : 'Mute' }}</button>
            <label class="volume-wrap" for="live-volume">
              Lyd
              <input
                id="live-volume"
                type="range"
                min="0"
                max="100"
                :value="radioVolume"
                @input="setRadioVolume($event.target.value)"
              />
              <span>{{ radioVolume }}%</span>
            </label>
          </div>
        </div>

        <div class="now-playing-grid">
          <article v-for="station in radioCards" :key="station.channelSlug" class="now-playing-card">
            <div class="now-playing-channel">{{ station.channelTitle }}</div>
            <div class="now-playing-track">{{ station.displayTrack }}</div>
            <div class="now-playing-program">{{ station.programTitle }}</div>
            <div class="now-playing-actions">
              <button
                type="button"
                class="btn-outline listen-btn"
                :disabled="!canListenToStation(station)"
                @click="toggleStationPlayback(station)"
              >
                {{ listenButtonLabel(station) }}
              </button>
            </div>
          </article>
        </div>
      </section>

      <section v-if="isAlbumsView && !isSignedIn" class="form-card">
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

      <section v-else-if="isAlbumsView" class="session-banner">
        Logget ind som <strong>{{ authUser || 'user' }}</strong>
      </section>

      <section v-if="isAlbumsView && showForm && isSignedIn" class="form-card">
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

      <section v-if="isAlbumsView && isSignedIn" class="control-grid">
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

      <section v-if="isAlbumsView && isSignedIn && !loading && !error" class="sort-row">
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

      <div v-if="isAlbumsView && isSignedIn && loading" class="loading">Henter plader...</div>
      <div v-if="isAlbumsView && error" class="error-box">{{ error }}</div>

      <section class="table-wrap" v-if="isAlbumsView && isSignedIn && !loading && !error">
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

      <div v-if="isAlbumsView && isSignedIn && !loading && !error && filteredAndSortedRecords.length === 0" class="empty-state">
        Ingen plader fundet
      </div>

      <section v-if="isTracksView" class="control-grid track-controls">
        <label class="control-block wide">
          <span>Søg i tracks</span>
          <input v-model="trackFilterText" placeholder="Titel, artist eller kanal" />
        </label>
        <button @click="clearTrackFilters" class="btn-clear">Ryd filtre</button>
      </section>

      <section v-if="isTracksView && !tracksLoading && !tracksError" class="sort-row">
        <label for="track-sort-column">Sorter efter</label>
        <select id="track-sort-column" v-model="trackSortBy" @change="setTrackSort(trackSortBy)">
          <option value="id">ID</option>
          <option value="name">Titel</option>
          <option value="artist">Artist</option>
          <option value="channel">Kanal</option>
          <option value="playedAt">Afspillet</option>
        </select>
        <div class="segmented">
          <button type="button" :class="{ active: trackSortOrder === 'asc' }" @click="trackSortOrder = 'asc'">Asc</button>
          <button type="button" :class="{ active: trackSortOrder === 'desc' }" @click="trackSortOrder = 'desc'">Desc</button>
        </div>
        <span class="table-count">{{ filteredAndSortedTracks.length }} tracks</span>
      </section>

      <div v-if="isTracksView && tracksLoading" class="loading">Henter tracks...</div>
      <div v-if="isTracksView && tracksError" class="error-box">{{ tracksError }}</div>

      <section class="table-wrap" v-if="isTracksView && !tracksLoading && !tracksError">
        <table>
          <thead>
            <tr>
              <th><button type="button" class="th-btn" @click="setTrackSort('id')">ID {{ trackSortIndicator('id') }}</button></th>
              <th><button type="button" class="th-btn" @click="setTrackSort('name')">Titel {{ trackSortIndicator('name') }}</button></th>
              <th><button type="button" class="th-btn" @click="setTrackSort('artist')">Artist {{ trackSortIndicator('artist') }}</button></th>
              <th><button type="button" class="th-btn" @click="setTrackSort('channel')">Kanal {{ trackSortIndicator('channel') }}</button></th>
              <th><button type="button" class="th-btn" @click="setTrackSort('playedAt')">Afspillet {{ trackSortIndicator('playedAt') }}</button></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="track in filteredAndSortedTracks" :key="track.id">
              <td>{{ track.id }}</td>
              <td>{{ track.name }}</td>
              <td>{{ track.artist }}</td>
              <td><span class="genre-pill">{{ displayChannelLabel(track.channel) }}</span></td>
              <td>{{ formatPlayedAt(track.playedAt) }}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <div v-if="isTracksView && !tracksLoading && !tracksError && filteredAndSortedTracks.length === 0" class="empty-state">
        Ingen tracks fundet
      </div>
    </main>
  </div>
</template>
