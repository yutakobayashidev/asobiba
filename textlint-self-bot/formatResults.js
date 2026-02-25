module.exports = (results) => {
    const messages = results[0].messages
    let output = ''
  
    messages.forEach((message) => {
      let severity = ''
      if ((message).fatal || message.severity === 2) {
        severity = 'error'
      } else {
        severity = 'warning'
      }
      output += `[${message.line}:${message.column} ${severity}] ${message.message} (${message.ruleId})\n`
    })
    return '```\n' + `${output}` + '```\n'
  }
  