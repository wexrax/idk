import { UserProfile } from "@/components/users/user-profile";

export default async function UserProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <main className="px-4 py-6 lg:px-6">
      <UserProfile userId={id} />
    </main>
  );
}
