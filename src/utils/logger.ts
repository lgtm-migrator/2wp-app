import Vue from 'vue';
import VueLogger from 'vuejs-logger';

const isProduction = process.env.NODE_ENV === 'production';

const options = {
  isEnabled: true,
  logLevel: isProduction ? 'error' : 'debug',
  stringifyArguments: false,
  showLogLevel: true,
  showMethodName: true,
  separator: '|',
  showConsoleColors: true,
};

Vue.use(VueLogger as any, options);

export const log = () => ({
  this.$log.warn('test')
});
