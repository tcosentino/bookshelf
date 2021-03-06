const path = require('path')
const cp = require('child_process')
const fs = require('fs')
const glob = require('glob')

function spawnSync(command, options) {
  const result = cp.spawnSync(command, {shell: true, stdio: 'pipe', ...options})
  result.stdout = result.stdout || ''
  result.stderr = result.stderr || ''
  if (result.status === 0) {
    return result.stdout.toString().trim()
  } else {
    throw new Error(
      `\n\nERROR CODE: ${result.status}\n\nSTDERR:\n${result.stderr}\n\nSTDOUT:\n${result.stdout}`,
    )
  }
}

function getExtraCreditNumberFromFilename(line) {
  const m = line.match(/\.extra-(?<number>\d+).js$/)
  if (!m) {
    return null
  }
  return Number(m.groups.number)
}

function getExtraCreditTitles() {
  const instructions = fs.readFileSync('INSTRUCTIONS.md', {encoding: 'utf-8'})
  return instructions
    .split('\n')
    .filter(l => l.includes('💯'))
    .map(l => l.replace(/^.*💯/, '').trim())
}

function getVariants() {
  const extraCreditTitles = getExtraCreditTitles()
  const files = glob.sync('./src/**/*.+(exercise|final|extra-)*.js')
  const filesByMaster = {}
  for (const file of files) {
    const {dir, name, base, ext} = path.parse(file)
    const exportLine = `export * from './${name}'`
    const number = getExtraCreditNumberFromFilename(base)
    const master = path.join(dir, name.replace(/\..*$/, ext))

    filesByMaster[master] = filesByMaster[master] || {extras: []}

    const info = {exportLine, number, title: extraCreditTitles[number - 1]}

    if (base.includes('.final')) filesByMaster[master].final = info
    if (base.includes('.exercise')) filesByMaster[master].exercise = info
    if (base.includes('.extra')) filesByMaster[master].extras.push(info)
  }
  return filesByMaster
}

module.exports = {spawnSync, getVariants, getExtraCreditTitles}
