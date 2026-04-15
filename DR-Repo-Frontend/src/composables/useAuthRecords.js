import { computed, reactive, ref } from 'vue'
import { login, logout } from '../services/Auth.js'
import { createRecord, deleteRecord, getRecords, updateRecord } from '../services/RecordsAPI.js'

export function useAuthRecords() {
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

  const emptyForm = () => ({
    name: '',
    artist: '',
    genre: '',
    releaseYear: '',
    trackCount: '',
    duration: '',
  })

  const form = reactive(emptyForm())

  const isSignedIn = computed(() => Boolean(token.value))

  const filteredAndSortedRecords = computed(() => {
    const text = filterText.value.trim().toLowerCase()
    const genre = filterGenre.value.trim().toLowerCase()
    const minYear = filterMinYear.value
    const maxYear = filterMaxYear.value

    const filtered = records.value.filter((record) => {
      const matchesText =
        text === '' ||
        (record.name ?? '').toLowerCase().includes(text) ||
        (record.artist ?? '').toLowerCase().includes(text)
      const matchesGenre = genre === '' || (record.genre ?? '').toLowerCase().includes(genre)
      const matchesMin = minYear == null || record.releaseYear >= minYear
      const matchesMax = maxYear == null || record.releaseYear <= maxYear
      return matchesText && matchesGenre && matchesMin && matchesMax
    })

    return [...filtered].sort((a, b) => {
      const av = a[sortBy.value] ?? ''
      const bv = b[sortBy.value] ?? ''
      const comparison = typeof av === 'string' ? av.localeCompare(bv) : av - bv
      return sortOrder.value === 'asc' ? comparison : -comparison
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

  function setSort(column) {
    if (sortBy.value === column) {
      sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
      return
    }

    sortBy.value = column
    sortOrder.value = 'asc'
  }

  function sortIndicator(column) {
    if (sortBy.value !== column) return ''
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
        const index = records.value.findIndex((record) => record.id === editingId.value)
        if (index !== -1) records.value[index] = updated
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
      records.value = records.value.filter((record) => record.id !== id)
    } catch (e) {
      console.error('Error deleting record:', e)
    }
  }

  return {
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
  }
}
