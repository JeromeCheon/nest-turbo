export default async function RobotDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="flex min-h-screen items-center justify-center">
      <h1 className="text-2xl font-semibold">robots/{id}</h1>
    </div>
  );
}
