if (
  process.env.__NEXT_AGENTIC_AUTO_UPGRADE === 'future' &&
  process.env.NEXT_PRIVATE_UPGRADE_SUPERVISED !== '1' &&
  process.argv[2] === 'build'
) {
  // Config preflight can leave a handle in the prompt supervisor. The build
  // still needs to exit after its child and captured output finish.
  setInterval(() => {}, 1000)
}

module.exports = {
  experimental: {
    agenticAutoUpgrade: 'future',
  },
}
