export type UserProfile = { displayName: string | null; avatar: string | null };
export type ProfilesMap = Record<string, UserProfile>;

export function resolveUser(profiles: ProfilesMap, username: string) {
  const p = profiles[username];
  return {
    name: p?.displayName ?? username,
    avatarId: p?.avatar ?? null,
  };
}
