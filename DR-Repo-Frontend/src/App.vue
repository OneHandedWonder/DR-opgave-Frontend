<script setup>
import { ref, onMounted, computed } from 'vue'
import * as api from './services/RecordsAPI'

const records = ref([])
const loading = ref(true)
const error = ref(null)
const filterText = ref('')
const filterGenre = ref('')
const filterMinYear = ref(null)
const filterMaxYear = ref(null)
const sortBy = ref('id')
const sortOrder = ref('asc')

const filteredAndSortedRecords = computed(() => {
  const list = [...records.value]

  const filtered = list.filter((record) => {
    const text = filterText.value.trim().toLowerCase()
    const genre = filterGenre.value.trim().toLowerCase()
    const minYear = filterMinYear.value
    const maxYear = filterMaxYear.value

    const matchesText =
      text === '' ||
      (record.name ?? '').toLowerCase().includes(text) ||
      (record.artist ?? '').toLowerCase().includes(text)
        <div class="page-shell">
          <div class="grain"></div>
          <main class="records-panel">
            <header class="records-header">
              <div>
                <p class="eyebrow">Archive</p>
                <h1>Record Collection</h1>
                <p class="subtitle">Browse, filter, and sort your catalog in one place.</p>
              </div>
              <button @click="fetchRecords()" class="btn-ink">Refresh</button>
            </header>

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
              <button @click="clearFilters()" class="btn-clear">Clear filters</button>
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
                <button type="button" :class="sortOrder === 'asc' ? 'active' : ''" @click="setSortOrder('asc')">Asc</button>
                <button type="button" :class="sortOrder === 'desc' ? 'active' : ''" @click="setSortOrder('desc')">Desc</button>
              </div>
            </section>

            <div v-if="loading" class="loading">Loading records...</div>
            <div v-if="error" class="error-box">{{ error }}</div>

            <section class="table-wrap" v-if="!loading && !error">
              <table>
                <thead>
                  <tr>
                    <th>
                      <button type="button" class="th-btn" @click="setSort('id')">
                        ID {{ sortIndicator('id') }}
                      </button>
                    </th>
                    <th>
                      <button type="button" class="th-btn" @click="setSort('name')">
                        Name {{ sortIndicator('name') }}
                      </button>
                    </th>
                    <th>
                      <button type="button" class="th-btn" @click="setSort('releaseYear')">
                        Year {{ sortIndicator('releaseYear') }}
                      </button>
                    </th>
                    <th>
                      <button type="button" class="th-btn" @click="setSort('artist')">
                        Artist {{ sortIndicator('artist') }}
                      </button>
                    </th>
                    <th>
                      <button type="button" class="th-btn" @click="setSort('genre')">
                        Genre {{ sortIndicator('genre') }}
                      </button>
                    </th>
                    <th>
                      <button type="button" class="th-btn" @click="setSort('trackCount')">
                        Tracks {{ sortIndicator('trackCount') }}
                      </button>
                    </th>
                    <th>
                      <button type="button" class="th-btn" @click="setSort('duration')">
                        Duration {{ sortIndicator('duration') }}
                      </button>
                    </th>
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
                  </tr>
                </tbody>
              </table>
            </section>

            <div v-if="!loading && filteredAndSortedRecords.length === 0" class="empty-state">
              No records found
            </div>
          </main>
        </div>
      </template>

      <style scoped>
      :global(body) {
        --paper: #f7f5ef;
        --ink: #12343b;
        --slate: #2a4a51;
        --soft-line: #d6ddd9;
        --teal: #1f7a69;
        --teal-deep: #14594c;
        --card: rgba(255, 255, 255, 0.82);
        margin: 0;
        min-height: 100vh;
        color: var(--ink);
        background:
          radial-gradient(circle at 16% 18%, rgba(31, 122, 105, 0.18), transparent 32%),
          radial-gradient(circle at 84% 0%, rgba(18, 52, 59, 0.22), transparent 36%),
          linear-gradient(140deg, #f3ede1 0%, #efece3 42%, #e6efec 100%);
        font-family: "Avenir Next", "Gill Sans", "Trebuchet MS", sans-serif;
      }

      .page-shell {
        position: relative;
        padding: 2.25rem 1rem 2rem;
      }

      .grain {
        position: fixed;
        inset: 0;
        pointer-events: none;
        opacity: 0.08;
        background-image: radial-gradient(var(--ink) 0.45px, transparent 0.45px);
        background-size: 3px 3px;
      }

      .records-panel {
        position: relative;
        max-width: 1060px;
        margin: 0 auto;
        border: 1px solid rgba(18, 52, 59, 0.18);
        border-radius: 20px;
        background: var(--card);
        backdrop-filter: blur(5px);
        box-shadow: 0 20px 48px rgba(17, 44, 50, 0.18);
        overflow: hidden;
        animation: panel-in 420ms ease-out;
      }

      .records-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 1rem;
        padding: 1.75rem 1.8rem 1.25rem;
        border-bottom: 1px solid var(--soft-line);
      }

      .eyebrow {
        text-transform: uppercase;
        letter-spacing: 0.12em;
        margin: 0;
        font-size: 0.74rem;
        color: var(--teal-deep);
        font-weight: 700;
      }

      h1 {
        margin: 0.2rem 0 0.35rem;
        font-size: clamp(1.7rem, 3.4vw, 2.35rem);
        line-height: 1.1;
        color: var(--ink);
      }

      .subtitle {
        margin: 0;
        color: #406168;
        font-size: 0.95rem;
      }

      .btn-ink,
      .btn-clear,
      .segmented button,
      .th-btn {
        border: 0;
        cursor: pointer;
      }

      .btn-ink {
        padding: 0.62rem 0.95rem;
        border-radius: 999px;
        background: linear-gradient(145deg, var(--teal), var(--teal-deep));
        color: #fff;
        font-weight: 650;
        transition: transform 150ms ease, box-shadow 150ms ease;
        box-shadow: 0 8px 18px rgba(20, 89, 76, 0.3);
      }

      .btn-ink:hover {
        transform: translateY(-1px);
      }

      .control-grid {
        display: grid;
        grid-template-columns: 2fr 1.3fr 0.8fr 0.8fr auto;
        gap: 0.75rem;
        padding: 1.2rem 1.8rem 0.75rem;
        align-items: end;
      }

      .control-block {
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
      }

      .control-block span {
        font-size: 0.76rem;
        font-weight: 650;
        color: #3f6466;
        text-transform: uppercase;
        letter-spacing: 0.06em;
      }

      .control-block input,
      .sort-row select {
        height: 2.3rem;
        border-radius: 12px;
        border: 1px solid var(--soft-line);
        padding: 0.45rem 0.68rem;
        background: #fbfcfb;
        color: var(--ink);
      }

      .control-block input:focus,
      .sort-row select:focus {
        outline: 2px solid rgba(31, 122, 105, 0.2);
        border-color: var(--teal);
      }

      .btn-clear {
        height: 2.3rem;
        border-radius: 12px;
        background: #eef4f1;
        color: var(--teal-deep);
        font-weight: 650;
        border: 1px solid #d6e5df;
      }

      .sort-row {
        display: flex;
        align-items: center;
        gap: 0.55rem;
        padding: 0.45rem 1.8rem 1rem;
      }

      .sort-row label {
        font-size: 0.84rem;
        color: #3f6466;
        font-weight: 650;
      }

      .sort-row select {
        min-width: 138px;
      }

      .segmented {
        display: inline-flex;
        border-radius: 10px;
        border: 1px solid #c8d7d1;
        overflow: hidden;
      }

      .segmented button {
        padding: 0.42rem 0.78rem;
        background: #f5f8f7;
        color: #2f5559;
        font-weight: 650;
      }

      .segmented button.active {
        background: var(--teal);
        color: #fff;
      }

      .loading,
      .error-box,
      .empty-state {
        margin: 0.85rem 1.8rem 1rem;
        border-radius: 12px;
        padding: 0.85rem 0.95rem;
      }

      .loading,
      .empty-state {
        background: #f1f5f4;
        color: #406168;
      }

      .error-box {
        background: #fff1ec;
        color: #8d3e2e;
        border: 1px solid #f3c7ba;
      }

      .table-wrap {
        overflow-x: auto;
        margin: 0.5rem 1.1rem 1.25rem;
        border-radius: 16px;
        border: 1px solid #d5e1dc;
        background: #fdfdfc;
      }

      table {
        width: 100%;
        border-collapse: collapse;
        min-width: 760px;
      }

      thead th {
        background: linear-gradient(180deg, #1c6458, #14564a);
        color: #f8fffd;
        font-size: 0.8rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        border-bottom: 1px solid #2d7b6c;
        padding: 0.7rem 0.65rem;
      }

      .th-btn {
        background: transparent;
        color: inherit;
        font: inherit;
        text-transform: inherit;
        letter-spacing: inherit;
      }

      tbody td {
        padding: 0.68rem 0.6rem;
        border-bottom: 1px solid #edf2f0;
        text-align: center;
        color: #23474f;
        font-size: 0.92rem;
      }

      tbody tr {
        transition: background-color 140ms ease;
      }

      tbody tr:hover {
        background: #f2f8f5;
      }

      .genre-pill {
        display: inline-block;
        padding: 0.2rem 0.48rem;
        border-radius: 999px;
        background: #e6f2ee;
        color: #1f6256;
        font-size: 0.8rem;
        font-weight: 650;
      }

      @media (max-width: 900px) {
        .control-grid {
          grid-template-columns: 1fr 1fr;
        }

        .control-grid .small,
        .btn-clear {
          grid-column: span 1;
        }
      }

      @media (max-width: 640px) {
        .records-header {
          flex-direction: column;
          align-items: stretch;
        }

        .btn-ink {
          width: 100%;
        }

        .control-grid {
          grid-template-columns: 1fr;
        }

        .sort-row {
          flex-wrap: wrap;
        }

        .sort-row select {
          flex: 1;
          min-width: 130px;
        }
      }

      @keyframes panel-in {
        from {
          opacity: 0;
          transform: translateY(8px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
            <option value="genre">Genre</option>
            <option value="trackCount">Tracks</option>
            <option value="duration">Duration</option>
          </select>
          <button
            type="button"
            class="btn btn-sm py-0 px-2"
            :class="sortOrder === 'asc' ? 'btn-primary' : 'btn-outline-primary'"
            @click="setSortOrder('asc')"
          >
            Asc
          </button>
          <button
            type="button"
            class="btn btn-sm py-0 px-2"
            :class="sortOrder === 'desc' ? 'btn-primary' : 'btn-outline-primary'"
            @click="setSortOrder('desc')"
          >
            Desc
          </button>
        </div>

        <div class="table-responsive" v-if="!loading && !error">
          <table class="table table-striped table-hover align-middle text-center mb-0">
            <thead class="bg-success text-white">
              <tr>
                <th>
                  <button type="button" class="btn btn-link p-0 text-white text-decoration-none fw-semibold" @click="setSort('id')">
                    ID {{ sortIndicator('id') }}
                  </button>
                </th>
                <th>
                  <button type="button" class="btn btn-link p-0 text-white text-decoration-none fw-semibold" @click="setSort('name')">
                    Name {{ sortIndicator('name') }}
                  </button>
                </th>
                <th>
                  <button type="button" class="btn btn-link p-0 text-white text-decoration-none fw-semibold" @click="setSort('releaseYear')">
                    Year {{ sortIndicator('releaseYear') }}
                  </button>
                </th>
                <th>
                  <button type="button" class="btn btn-link p-0 text-white text-decoration-none fw-semibold" @click="setSort('artist')">
                    Artist {{ sortIndicator('artist') }}
                  </button>
                </th>
                <th>
                  <button type="button" class="btn btn-link p-0 text-white text-decoration-none fw-semibold" @click="setSort('genre')">
                    Genre {{ sortIndicator('genre') }}
                  </button>
                </th>
                <th>
                  <button type="button" class="btn btn-link p-0 text-white text-decoration-none fw-semibold" @click="setSort('trackCount')">
                    Tracks {{ sortIndicator('trackCount') }}
                  </button>
                </th>
                <th>
                  <button type="button" class="btn btn-link p-0 text-white text-decoration-none fw-semibold" @click="setSort('duration')">
                    Duration {{ sortIndicator('duration') }}
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="record in filteredAndSortedRecords" :key="record.id">
                <td>{{ record.id }}</td>
                <td>{{ record.name }}</td>
                <td>{{ record.releaseYear }}</td>
                <td>{{ record.artist }}</td>
                <td>{{ record.genre }}</td>
                <td>{{ record.trackCount }}</td>
                <td>{{ record.duration }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="!loading && filteredAndSortedRecords.length === 0" class="text-center text-muted py-3">
          No records found
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
:global(body) {
  background-color: #ffffff;
  margin: 0;
  min-height: 100vh;
}

.container {
  max-width: 920px;
}
</style>
