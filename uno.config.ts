import { defineConfig, presetWind3,presetAttributify,presetIcons } from 'unocss'
import { presetDaisy } from "@ameinhardt/unocss-preset-daisy";
import { presetWind4 } from 'unocss';

export default defineConfig({
  presets: [
    presetWind4(),
    presetDaisy(),
    presetAttributify(),
    presetIcons(),
  ],
})

