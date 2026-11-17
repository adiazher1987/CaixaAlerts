const path = require('path')

// Fix para monorepo: expo-router/_ctx.*.js usa process.env.EXPO_ROUTER_APP_ROOT
// que debe ser un string literal. Si el expoRouterBabelPlugin falla (problema de monorepo),
// este plugin lo reemplaza directamente.
function expoRouterCtxFix({ types: t }) {
  return {
    visitor: {
      MemberExpression(nodePath, state) {
        if (!state.filename || !state.filename.includes('expo-router/_ctx')) return
        if (!nodePath.get('object').matchesPattern('process.env')) return
        const key = nodePath.toComputedKey()
        if (!t.isStringLiteral(key)) return
        if (key.value === 'EXPO_ROUTER_APP_ROOT') {
          const relPath = path
            .relative(path.dirname(state.filename), path.resolve(__dirname, 'app'))
            .replace(/\\/g, '/')
          nodePath.replaceWith(t.stringLiteral(relPath || '.'))
        } else if (key.value === 'EXPO_ROUTER_IMPORT_MODE') {
          nodePath.replaceWith(t.stringLiteral('sync'))
        }
      },
    },
  }
}

module.exports = function (api) {
  api.cache(true)
  return {
    presets: ['babel-preset-expo'],
    plugins: [expoRouterCtxFix],
  }
}
