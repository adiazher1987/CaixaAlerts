const { getDefaultConfig } = require('expo/metro-config')
const path = require('path')

const projectRoot = __dirname
const workspaceRoot = path.resolve(projectRoot, '../..')

const config = getDefaultConfig(projectRoot)

// Permite a Metro ver todos los packages del monorepo
config.watchFolders = [workspaceRoot]

// Resuelve módulos primero en la app, luego en el root del monorepo
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
]

// Override expo-router/_ctx para web: require.context necesita string literal, no env var
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'expo-router/_ctx') {
    if (platform === 'web') {
      return {
        filePath: path.resolve(projectRoot, '_ctx.web.js'),
        type: 'sourceFile',
      }
    }
    if (platform === 'android' || platform === 'ios') {
      return {
        filePath: path.resolve(projectRoot, '_ctx.android.js'),
        type: 'sourceFile',
      }
    }
  }
  return context.resolveRequest(context, moduleName, platform)
}

module.exports = config
