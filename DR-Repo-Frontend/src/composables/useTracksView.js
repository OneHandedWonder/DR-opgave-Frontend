import { computed, ref } from 'vue'
import { getTracks } from '../services/RecordsAPI.js'

export function useTracksView() {
  const tracks = ref([])
  const tracksLoading = ref(false)
  const tracksError = ref(null)
  const tracksUpdatedAt = ref(null)
  const tracksLoaded = ref(false)

  const trackFilterText = ref('')
  const trackSortBy = ref('playedAt')
  const trackSortOrder = ref('desc')

  const filteredAndSortedTracks = computed(() => {
    const text = trackFilterText.value.trim().toLowerCase()

    const filtered = tracks.value.filter((track) => {
      if (text === '') return true

      const fields = [track.name, track.artist, track.channel]
      return fields.some((value) => (value ?? '').toLowerCase().includes(text))
    })

    return [...filtered].sort((a, b) => {
      const av = a[trackSortBy.value] ?? ''
      const bv = b[trackSortBy.value] ?? ''

      let comparison = 0
      if (trackSortBy.value === 'playedAt') {
        comparison = new Date(av).getTime() - new Date(bv).getTime()
      } else if (typeof av === 'string') {
        comparison = av.localeCompare(bv)
      } else {
        comparison = av - bv
      }

      return trackSortOrder.value === 'asc' ? comparison : -comparison
    })
  })

  async function fetchTracks() {
    tracksLoading.value = true
    tracksError.value = null

    try {
      tracks.value = await getTracks()
      tracksLoaded.value = true
      tracksUpdatedAt.value = new Date()
    } catch (e) {
      console.error('Error fetching tracks:', e)
      tracksError.value = 'Failed to load tracks.'
    } finally {
      tracksLoading.value = false
    }
  }

  function clearTrackFilters() {
    trackFilterText.value = ''
  }

  function trackSortIndicator(column) {
    if (trackSortBy.value !== column) return ''
    return trackSortOrder.value === 'asc' ? '▲' : '▼'
  }

  function setTrackSort(column) {
    if (trackSortBy.value === column) {
      trackSortOrder.value = trackSortOrder.value === 'asc' ? 'desc' : 'asc'
      return
    }

    trackSortBy.value = column
    trackSortOrder.value = column === 'playedAt' ? 'desc' : 'asc'
  }

  function displayChannelLabel(channel) {
    if (!channel) return 'UKENDT KANAL'
    return channel.toUpperCase()
  }

  function formatPlayedAt(value) {
    if (!value) return 'Ukendt tidspunkt'

    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return 'Ukendt tidspunkt'

    return date.toLocaleString('da-DK', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return {
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
  }
}
