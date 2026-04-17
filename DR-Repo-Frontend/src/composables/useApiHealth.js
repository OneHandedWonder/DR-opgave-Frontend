import { computed, ref } from 'vue'
import { getApiHealth } from '../services/HealthAPI.js'

export function useApiHealth() {
  const apiHealthStatus = ref('unknown')
  const apiHealthCheckedAt = ref(null)
  const apiHealthDetails = ref(null)
  const isHealthDrawerOpen = ref(false)

  let healthRefreshTimer = null

  const apiHealthLabel = computed(() => {
    if (apiHealthStatus.value === 'healthy') return 'API: Healthy'
    if (apiHealthStatus.value === 'degraded') return 'API: Degraded'
    if (apiHealthStatus.value === 'unhealthy') return 'API: Unhealthy'
    return 'API: Unknown'
  })

  const apiHealthClass = computed(() => {
    if (apiHealthStatus.value === 'healthy') return 'is-healthy'
    if (apiHealthStatus.value === 'degraded') return 'is-degraded'
    if (apiHealthStatus.value === 'unhealthy') return 'is-unhealthy'
    return 'is-unknown'
  })

  const healthChecks = computed(() => {
    const checks = apiHealthDetails.value?.checks
    if (!checks || typeof checks !== 'object') return []

    return Object.entries(checks)
      .map(([name, value]) => ({
        name,
        status: value?.status ?? 'Unknown',
        statusClass: toStatusClass(value?.status),
        durationMs: value?.durationMs ?? null,
        description: value?.description ?? null,
      }))
      .sort((a, b) => a.name.localeCompare(b.name))
  })

  const healthTables = computed(() => {
    const tables = apiHealthDetails.value?.tables
    if (!tables || typeof tables !== 'object') return []

    return Object.entries(tables)
      .map(([name, value]) => ({
        name,
        exists: Boolean(value?.exists),
        rowCount: value?.rowCount ?? null,
        newestRowTimestampUtc: value?.newestRowTimestampUtc ?? null,
        error: value?.error ?? null,
        status: resolveTableStatus(value),
        statusClass: resolveTableStatusClass(value),
      }))
      .sort((a, b) => a.name.localeCompare(b.name))
  })

  async function fetchApiHealthStatus() {
    try {
      const response = await getApiHealth()
      apiHealthDetails.value = response
      const status = (response?.status || '').toLowerCase()
      if (status === 'healthy' || status === 'degraded' || status === 'unhealthy') {
        apiHealthStatus.value = status
      } else {
        apiHealthStatus.value = 'unknown'
      }
    } catch {
      apiHealthStatus.value = 'unhealthy'
      apiHealthDetails.value = null
    } finally {
      apiHealthCheckedAt.value = new Date()
    }
  }

  function toggleHealthDrawer() {
    isHealthDrawerOpen.value = !isHealthDrawerOpen.value
  }

  function closeHealthDrawer() {
    isHealthDrawerOpen.value = false
  }

  function startHealthPolling() {
    if (healthRefreshTimer) return

    healthRefreshTimer = window.setInterval(() => {
      fetchApiHealthStatus()
    }, 60000)
  }

  function stopHealthPolling() {
    if (!healthRefreshTimer) return

    window.clearInterval(healthRefreshTimer)
    healthRefreshTimer = null
  }

  return {
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
  }
}

function toStatusClass(status) {
  const normalized = (status || '').toLowerCase()

  if (normalized === 'healthy') return 'is-healthy'
  if (normalized === 'degraded') return 'is-degraded'
  if (normalized === 'unhealthy') return 'is-unhealthy'
  return 'is-unknown'
}

function resolveTableStatus(table) {
  if (table?.error || !table?.exists) return 'Unhealthy'
  return 'Healthy'
}

function resolveTableStatusClass(table) {
  return table?.error || !table?.exists ? 'is-unhealthy' : 'is-healthy'
}
