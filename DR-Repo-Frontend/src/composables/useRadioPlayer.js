import { computed, ref } from 'vue'
import { getCurrentTrack, getNowPlayingOverview } from '../services/RadioAPI.js'

const RADIO_STATIONS = [
  { label: 'P1', slug: 'p1' },
  { label: 'P2', slug: 'p2' },
  { label: 'P3', slug: 'p3' },
  { label: 'P4', slug: 'p4kbh' },
  { label: 'P5', slug: 'p5kbh' },
  { label: 'P6', slug: 'p6beat' },
]

export function useRadioPlayer() {
  const radioNowPlaying = ref([])
  const radioLoading = ref(true)
  const radioError = ref(null)
  const radioUpdatedAt = ref(null)

  const radioPlaybackError = ref(null)
  const listeningStationSlug = ref(null)
  const isStationPlaying = ref(false)
  const radioVolume = ref(80)
  const radioMuted = ref(false)

  const stationAudio = typeof Audio !== 'undefined' ? new Audio() : null

  let radioRefreshTimer = null

  const onPlay = () => {
    isStationPlaying.value = true
  }

  const onPause = () => {
    isStationPlaying.value = false
  }

  const onEnded = () => {
    isStationPlaying.value = false
    listeningStationSlug.value = null
  }

  const onError = () => {
    isStationPlaying.value = false
    radioPlaybackError.value = 'Streamen stoppede uventet. Prov igen om lidt.'
  }

  const radioCards = computed(() => {
    return RADIO_STATIONS.map((station) => {
      const item = radioNowPlaying.value.find((entry) => entry.channelSlug === station.slug)
      return {
        channelSlug: station.slug,
        channelTitle: station.label,
        programTitle: item?.programTitle || 'Ukendt program',
        currentTrack: item?.currentTrack || null,
        displayTrack: displayTrackTitle(item?.currentTrack, item?.programTitle),
        streamUrl: item?.icyStreamUrl || null,
        matchedMetadata: item?.matchedMetadata || null,
      }
    })
  })

  const currentListeningStation = computed(() => {
    if (!listeningStationSlug.value) return null
    return radioCards.value.find((station) => station.channelSlug === listeningStationSlug.value) || null
  })

  function canListenToStation(station) {
    return Boolean(station?.streamUrl)
  }

  function isStationActive(station) {
    return listeningStationSlug.value === station.channelSlug
  }

  function listenButtonLabel(station) {
    if (!canListenToStation(station)) return 'Ingen stream'
    if (isStationActive(station) && isStationPlaying.value) return 'Pause'
    if (isStationActive(station) && !isStationPlaying.value) return 'Fortsæt'
    return 'Lyt live'
  }

  async function fetchRadioNowPlaying() {
    radioLoading.value = true
    radioError.value = null

    try {
      const overview = await getNowPlayingOverview()
      const overviewMap = new Map(overview.map((item) => [item.channelSlug, item]))

      const settled = await Promise.allSettled(
        RADIO_STATIONS.map(async (station) => {
          const base = overviewMap.get(station.slug)
          const data = await getCurrentTrack(station.slug)

          return {
            channelSlug: station.slug,
            channelTitle: data?.channelTitle || base?.channelTitle || station.label,
            programTitle: data?.programTitle || base?.nowPlaying?.title || base?.programTitle || 'Ukendt program',
            icyStreamUrl: data?.icyStreamUrl || null,
            currentTrack: data?.currentTrack || null,
            matchedMetadata: data?.matchedMetadata || null,
          }
        }),
      )

      const results = settled.map((result, index) => {
        const station = RADIO_STATIONS[index]
        const base = overviewMap.get(station.slug)

        if (result.status === 'fulfilled') {
          return result.value
        }

        console.error(`Error fetching radio data for ${station.slug}:`, result.reason)
        return {
          channelSlug: station.slug,
          channelTitle: base?.channelTitle || station.label,
          programTitle: base?.nowPlaying?.title || 'Ukendt program',
          icyStreamUrl: null,
          currentTrack: null,
          matchedMetadata: null,
        }
      })

      radioNowPlaying.value = results
      radioUpdatedAt.value = new Date()
    } catch (e) {
      radioError.value = 'Kunne ikke hente aktuelle numre fra DR.'
      console.error('Error fetching radio now playing:', e)
    } finally {
      radioLoading.value = false
    }
  }

  async function toggleStationPlayback(station) {
    if (!stationAudio || !station?.streamUrl) return

    radioPlaybackError.value = null

    if (isStationActive(station)) {
      if (stationAudio.paused) {
        try {
          await stationAudio.play()
        } catch {
          radioPlaybackError.value = `Kunne ikke starte stream for ${station.channelTitle}.`
        }
        return
      }

      stationAudio.pause()
      return
    }

    listeningStationSlug.value = station.channelSlug
    stationAudio.src = station.streamUrl
    stationAudio.volume = radioVolume.value / 100
    stationAudio.muted = radioMuted.value

    try {
      await stationAudio.play()
    } catch {
      radioPlaybackError.value = `Kunne ikke starte stream for ${station.channelTitle}.`
      listeningStationSlug.value = null
    }
  }

  async function toggleGlobalPlayback() {
    if (!stationAudio || !listeningStationSlug.value) return

    radioPlaybackError.value = null
    if (stationAudio.paused) {
      try {
        await stationAudio.play()
      } catch {
        radioPlaybackError.value = 'Kunne ikke starte afspilning igen.'
      }
      return
    }

    stationAudio.pause()
  }

  function stopPlayback() {
    if (!stationAudio) return

    stationAudio.pause()
    stationAudio.src = ''
    listeningStationSlug.value = null
    isStationPlaying.value = false
  }

  function setRadioVolume(value) {
    const parsed = Number(value)
    const safe = Number.isFinite(parsed) ? Math.max(0, Math.min(100, parsed)) : 80
    radioVolume.value = safe

    if (!stationAudio) return
    stationAudio.volume = safe / 100
  }

  function toggleMute() {
    radioMuted.value = !radioMuted.value

    if (!stationAudio) return
    stationAudio.muted = radioMuted.value
  }

  function startRadioPolling() {
    if (radioRefreshTimer) return

    radioRefreshTimer = window.setInterval(() => {
      fetchRadioNowPlaying()
    }, 120000)
  }

  function stopRadioPolling() {
    if (!radioRefreshTimer) return

    window.clearInterval(radioRefreshTimer)
    radioRefreshTimer = null
  }

  function initializeAudio() {
    if (!stationAudio) return

    stationAudio.preload = 'none'
    stationAudio.volume = radioVolume.value / 100
    stationAudio.muted = radioMuted.value

    stationAudio.addEventListener('play', onPlay)
    stationAudio.addEventListener('pause', onPause)
    stationAudio.addEventListener('ended', onEnded)
    stationAudio.addEventListener('error', onError)
  }

  function disposeAudio() {
    if (!stationAudio) return

    stopPlayback()
    stationAudio.removeEventListener('play', onPlay)
    stationAudio.removeEventListener('pause', onPause)
    stationAudio.removeEventListener('ended', onEnded)
    stationAudio.removeEventListener('error', onError)
  }

  return {
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
  }
}

function displayTrackTitle(track, programTitle) {
  if (!track) return programTitle || 'Ukendt program'
  return track.replace(/^\/?\s*/, '').trim()
}
