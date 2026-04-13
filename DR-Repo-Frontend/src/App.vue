<script setup>
import { ref, onMounted } from "vue";
import { getRecords } from "./servises/recordsAPI.js";

const records = ref([]);

onMounted(async () => {
  records.value = await getRecords();
});
</script>

<template>
  <header>
    <h1>Records</h1>
  </header>

  <main>
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Name</th>
          <th>Artist</th>
          <th>Genre</th>
          <th>Release Year</th>
          <th>Tracks</th>
          <th>Duration (s)</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="record in records" :key="record.id">
          <td>{{ record.id }}</td>
          <td>{{ record.name }}</td>
          <td>{{ record.artist }}</td>
          <td>{{ record.genre }}</td>
          <td>{{ record.releaseYear }}</td>
          <td>{{ record.trackCount }}</td>
          <td>{{ record.duration }}</td>
        </tr>
      </tbody>
    </table>
  </main>
</template>

<style scoped>
header {
  line-height: 1.5;
}

.logo {
  display: block;
  margin: 0 auto 2rem;
}

@media (min-width: 1024px) {
  header {
    display: flex;
    place-items: center;
    padding-right: calc(var(--section-gap) / 2);
  }

  .logo {
    margin: 0 2rem 0 0;
  }

  header .wrapper {
    display: flex;
    place-items: flex-start;
    flex-wrap: wrap;
  }
}
</style>
