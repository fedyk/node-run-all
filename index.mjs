#!/usr/bin/env node

/**
 * run.js "command -1" "command -2" "command -3"
 */
import { spawn } from "node:child_process"

const [, , ...commands] = process.argv

if (!Array.isArray(commands)) {
  throw new RangeError("`commands` is not array")
}

if (commands.length === 0) {
  throw new RangeError("`commands` is empty")
}

const abort = new AbortController()
const signal = abort.signal

process.on("exit", function () {
  abort.abort()
})

process.on("SIGINT", function () {
  abort.abort()
})

commands.forEach(function (command, index) {
  const [c, ...args] = command.split(" ")
  const process = spawn(c, args, { signal })
  const format = data => String(data).trim().replace(/^/gm, `${command}: `)

  process.stdout.on("data", function (data) {
    console.log(format(data))
  })

  process.stderr.on("data", function (data) {
    console.info(format(data))
  })

  process.on("close", function (code) {
    console.log(format(`exited with code ${code}`))
  })

  process.on("error", function (err) {
    if (err.name === "AbortError") {
      return // ignore abort errors
    }

    console.error(format(`${command}: error ${err}`))
  })
})
