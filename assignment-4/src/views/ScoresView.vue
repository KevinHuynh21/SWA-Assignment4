<template>
  <div>
        <h4>Your best scores</h4>
        <div v-if="!userScores.length">
            No data
        </div>
          <ScoreCard v-for="(userScore, index) in userScores" :key="'userbestItem' + index" :score="{...userScore}"/>
        <h4>Leaderboard</h4>
        <div v-if="!totalScores.length">
            No data
        </div>
        <ScoreCard v-for="(totalScore, index) in totalScores" :key="'userbestItem' + index" :score="{...totalScore}"/>
  </div>
</template>

<script>
    import ScoreCard from '@/views/ScoreItem.vue';
    import { getGames } from '@/services/game.service';

   export default {
    data() {
      return {
        totalScores: [],
        userScores: [],
      }
    },
    components: {ScoreCard},
    methods: {
      getScoresForUser() {
        return this.games.filter((game) => {
            return game.completed && game.user === JSON.parse(localStorage.getItem(`user`)).userId;
        }).sort((a, b) => {
            return b.score - a.score;
        }).slice(0, 3);
      },
      getTotalBestScores() {
        return this.games.filter((game) => {
                return game.completed;
            }).sort((a, b) => {
                return b.score - a.score;
            }).slice(0, 10);
      }
    },
    beforeMount() {
      getGames().then((result) => {
          this.userScores = result.data.filter((game) => {
            return game.completed && game.user === JSON.parse(localStorage.getItem(`user`)).userId;
          }).sort((a, b) => {
              return b.score - a.score;
          }).slice(0, 3);

          this.totalScores = result.data.filter((game) => {
                return game.completed;
            }).sort((a, b) => {
                return b.score - a.score;
            }).slice(0, 10);
      });
    }
  }
</script>
<style>
    .title {
  text-align: center;
  font-size: 2rem;
  font-weight: 800;
}
</style>
