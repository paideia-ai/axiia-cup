// The backend lockfile still contains one retired private package and one public
// GitHub URL in SSH form. Bazel eagerly fetches every pin, including packages no
// longer present in the generated Package.swift. Normalize only the isolated e2e
// copy so browser tests do not mutate the backend checkout or require an SSH key.

const [resolvedPath] = Deno.args
if (!resolvedPath) {
  console.error('usage: prepare-server-copy.ts <Package.resolved>')
  Deno.exit(2)
}

interface Pin {
  identity: string
  location: string
  [key: string]: unknown
}

interface Resolved {
  pins: Pin[]
  [key: string]: unknown
}

const resolved = JSON.parse(
  await Deno.readTextFile(resolvedPath),
) as Resolved

resolved.pins = resolved.pins
  .filter((pin) => pin.identity !== 'tca26')
  .map((pin) => ({
    ...pin,
    location: pin.location.replace(
      /^git@github\.com:/,
      'https://github.com/',
    ),
  }))

await Deno.writeTextFile(
  resolvedPath,
  `${JSON.stringify(resolved, null, 2)}\n`,
)
