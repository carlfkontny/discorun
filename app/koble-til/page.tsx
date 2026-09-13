import { ConnectForm } from './connect-form'

export default async function ConnectPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string; athlete?: string }>
}) {
  const params = await searchParams

  return (
    <div className="min-h-screen bg-muted/40">
      <div className="mx-auto w-full max-w-lg px-4 py-10 sm:py-16">
        <p className="mb-2 text-sm font-medium tracking-wide text-muted-foreground uppercase">
          2026
        </p>
        <h1 className="mb-6 text-2xl font-semibold tracking-tight">Årets sprekinger</h1>
        <ConnectForm
          initialOk={params.ok === '1'}
          initialError={params.error}
          initialAthleteId={params.athlete ? Number(params.athlete) : undefined}
        />
      </div>
    </div>
  )
}
