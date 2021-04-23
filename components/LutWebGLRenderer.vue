<template>
  <canvas />
</template>

<script lang="ts">
import Vue from 'vue'
import LutWebGLRenderer from '@/domain/LutWebGLRenderer'

let renderer: LutWebGLRenderer

export default Vue.extend({
  props: {
    lut: {
      type: String,
      required: true
    },

    image: {
      default: undefined,
      required: false,
      type: typeof HTMLImageElement === 'function' ? HTMLImageElement : Object
    }
  },

  watch: {
    lut: 'update',
    image: 'update'
  },

  mounted () {
    renderer = new LutWebGLRenderer(this.$el as HTMLCanvasElement)

    this.update()
  },

  methods: {
    update () {
      const image = this.image as HTMLImageElement

      if (image) {
        renderer.setSize(image.clientWidth, image.clientHeight)
        renderer.update(image, this.lut)
      }
    }
  }
})
</script>
