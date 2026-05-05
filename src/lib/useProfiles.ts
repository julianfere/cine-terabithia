'use client';
import { useState, useEffect } from 'react';
import type { ProfilesMap } from './profiles';

export type { ProfilesMap, UserProfile } from './profiles';
export { resolveUser } from './profiles';

let _promise: Promise<ProfilesMap> | null = null;
let _cache: ProfilesMap | null = null;

function load(): Promise<ProfilesMap> {
  if (!_promise) {
    _promise = fetch('/api/users/profiles')
      .then((r) => r.json())
      .then((data: ProfilesMap) => {
        _cache = data;
        return data;
      });
  }
  return _promise;
}

export function invalidateProfiles() {
  _promise = null;
  _cache = null;
}

export function useProfiles(): ProfilesMap {
  const [profiles, setProfiles] = useState<ProfilesMap>(_cache ?? {});
  useEffect(() => {
    load().then(setProfiles);
  }, []);
  return profiles;
}
