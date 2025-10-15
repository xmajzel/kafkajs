const { assign } = Object

const LEVELS = {
  NOTHING: 0,
  ERROR: 1,
  WARN: 2,
  NOTICE: 3,
  INFO: 4,
  DEBUG: 5,
}

const createLevel = (label, level, currentLevel, namespace, logFunction) => (
  message,
  extra = {}
) => {
  if (level > currentLevel()) return
  logFunction({
    namespace,
    level,
    label,
    log: assign(
      {
        timestamp: new Date().toISOString(),
        logger: 'kafkajs',
        message,
      },
      extra
    ),
  })
}

const evaluateLogLevel = logLevel => {
  const envLogLevel = (process.env.KAFKAJS_LOG_LEVEL || '').toUpperCase()
  return LEVELS[envLogLevel] == null ? logLevel : LEVELS[envLogLevel]
}

const createLogger = ({ level = LEVELS.INFO, logCreator } = {}) => {
  let logLevel = evaluateLogLevel(level)
  const logFunction = logCreator(logLevel)

  const createNamespace = (namespace, logLevel = null) => {
    const namespaceLogLevel = evaluateLogLevel(logLevel)
    return createLogFunctions(namespace, namespaceLogLevel)
  }

  const createLogFunctions = (namespace, namespaceLogLevel = null) => {
    const currentLogLevel = () => (namespaceLogLevel == null ? logLevel : namespaceLogLevel)
    const logger = {
      debug: createLevel('DEBUG', LEVELS.DEBUG, currentLogLevel, namespace, logFunction),
      info: createLevel('INFO', LEVELS.INFO, currentLogLevel, namespace, logFunction),
      notice: createLevel('NOTICE', LEVELS.NOTICE, currentLogLevel, namespace, logFunction),
      warn: createLevel('WARN', LEVELS.WARN, currentLogLevel, namespace, logFunction),
      error: createLevel('ERROR', LEVELS.ERROR, currentLogLevel, namespace, logFunction),
    }

    return assign(logger, {
      namespace: createNamespace,
      setLogLevel: newLevel => {
        logLevel = newLevel
      },
    })
  }

  return createLogFunctions()
}

module.exports = {
  LEVELS,
  createLogger,
}
