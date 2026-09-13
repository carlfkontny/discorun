import { ConnectForm } from './connect-form'

export default async function ConnectPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string; athlete?: string }>
}) {
  const params = await searchParams

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-md px-4 py-16">
        <ConnectForm
          initialOk={params.ok === '1'}
          initialError={params.error}
          initialAthleteId={params.athlete ? Number(params.athlete) : undefined}
        />
      </div>
    </div>
  )
}
