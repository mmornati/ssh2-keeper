const options = {
    disabled: false,
    interactive: false,
    logLevel: 'debug',
    scope: 'custom',
    secrets: [],
    stream: process.stdout,
    types: {
        error: {
            badge: '!!',
            label: 'fatal error'
        },
        success: {
            badge: '++',
            label: 'huge success'
        }
    }
  };
  module.exports.options = options;