declare module 'vue/types/vue' {
    interface Vue {
      $router: VueRouter
      $route: Route,
      $log: {
        debug(...args: any[]): void;
        info(...args: any[]): void;
        warn(...args: any[]): void;
        error(...args: any[]): void;
        fatal(...args: any[]): void;
      },
    }
}
