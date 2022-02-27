module.exports = {
  devServer: {
    proxy: 'http://localhost:3000',
    client: {
      // Set the websocket path to sockjs-node so that vue-cli-service knows
      // not to proxy the request.
      // https://github.com/vuejs/vue-cli/blob/master/packages/%40vue/cli-service/lib/util/prepareProxy.js#L53
      webSocketURL: { pathname: '/sockjs-node' }
    }
  }
}
