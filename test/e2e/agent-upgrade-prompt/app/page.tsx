import { existsSync, watch, writeFileSync } from 'fs'
import { join } from 'path'
import { after, connection } from 'next/server'
import { Suspense } from 'react'

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[]>>
}) {
  if (process.env.NEXT_TEST_HOLD_UPGRADE_BUILD === '1') {
    // Keep static generation in a real build worker until the test releases it.
    // This lets the test observe Upgrade now while build work is still active.
    const release = join(process.cwd(), 'upgrade-build-release')
    await new Promise<void>((resolve) => {
      const watcher = watch(process.cwd(), () => {
        if (existsSync(release)) {
          watcher.close()
          resolve()
        }
      })
      writeFileSync(
        join(process.cwd(), 'upgrade-build-ready'),
        JSON.stringify({ workerPid: process.pid, buildPid: process.ppid })
      )
    })
    // The Skip test releases this worker after the menu appears. Its log must
    // stay behind that menu until the captured output is replayed.
    console.log('UPGRADE_BUILD_LOG')
  }
  // Cache Components builds need a boundary around runtime request data.
  return (
    <Suspense fallback={null}>
      <RequestContent searchParams={searchParams} />
    </Suspense>
  )
}

async function RequestContent({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[]>>
}) {
  await connection()

  const params = await searchParams
  if (params.hold === '1') {
    // Keep Next's real shutdown cleanup pending until the test releases it.
    after(
      () =>
        new Promise<void>((resolve) => {
          const release = join(process.cwd(), `upgrade-release-${process.pid}`)
          const watcher = watch(process.cwd(), () => {
            if (existsSync(release)) {
              watcher.close()
              resolve()
            }
          })
          writeFileSync(join(process.cwd(), `upgrade-ready-${process.pid}`), '')
        })
    )
  }
  console.log('UPGRADE_REQUEST_LOG')
  return (
    <p data-server-pid={process.pid} data-dev-pid={process.ppid}>
      hello world
    </p>
  )
}
