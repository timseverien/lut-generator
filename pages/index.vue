<template>
  <main class="layout">
    <div class="layout__controls">
      <table>
        <thead>
          <tr>
            <td>&nbsp;</td>
            <th v-for="column in colorMatrixColumns" :key="column">
              {{ column.toUpperCase() }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, rowIndex) in colorMatrixRows" :key="row">
            <th>{{ row.toUpperCase() }}</th>
            <td v-for="(column, columnIndex) in colorMatrixColumns" :key="column">
              <input
                v-model.number="colorMatrix[rowIndex * 4 + columnIndex]"
                max="2"
                min="-2"
                step="0.01"
                type="number"
              >
            </td>
          </tr>
        </tbody>
      </table>

      <a
        :download="`${lutCubeName}.CUBE`"
        :href="`data:text/plain;base64,${lutEncoded}`"
      >
        Download
      </a>
    </div>
    <div class="layout__source">
      <img ref="source" src="/images/source-1.jpg" alt="" width="512" @load="updateLut">
    </div>
    <div class="layout__preview">
      <LutWebGLRenderer
        :lut="lut"
        :image="$refs.source"
      />
    </div>
  </main>
</template>

<script lang="ts">
import Vue from 'vue'

import IColorMatrix from '@/domain/IColorMatrix'
import LutCubeFactory from '@/domain/LutCubeFactory'
import LutWebGLRenderer from '../components/LutWebGLRenderer.vue'

const lutCubeFactory = new LutCubeFactory(32)

export default Vue.extend({
  components: { LutWebGLRenderer },

  data () {
    const colorMatrixColumns = ['r', 'g', 'b', 'w']
    const colorMatrixRows = ['r', 'g', 'b']

    const colorMatrix: IColorMatrix = [
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0
    ]

    const lutCubeName = 'Foo'

    return {
      colorMatrix,
      colorMatrixColumns,
      colorMatrixRows,
      lut: lutCubeFactory.create(lutCubeName, colorMatrix),
      lutEncoded: '',
      lutCubeName
    }
  },

  watch: {
    colorMatrix () {
      this.updateLut()
    }
  },

  methods: {
    updateLut () {
      const lut = lutCubeFactory.create(this.lutCubeName, this.colorMatrix)

      this.lut = lut
      this.lutEncoded = window.btoa(lut)
    }
  }
})
</script>

<style lang="postcss" scoped>
.layout {
  display: grid;
  grid-template-areas:
    'controls source'
    'controls preview'
    'result result';
  grid-template-columns: 1fr min-content;
}

.layout__controls {
  grid-area: controls;
}

.layout__controls td,
.layout__controls th {
  padding: 0.5rem;
}

.layout__preview {
  grid-area: preview;
}

.layout__result {
  grid-area: result;
}

.layout__source {
  grid-area: source;
}
</style>
