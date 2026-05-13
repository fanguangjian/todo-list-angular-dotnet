import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { TagApi } from './tag-api';
import { TagDto } from './models';

interface DefaultTag {
  name: string;
  color: string;
}

const DEFAULT_TAGS: ReadonlyArray<DefaultTag> = [
  // Priority
  { name: 'High', color: '#ef4444' },
  { name: 'Medium', color: '#f59e0b' },
  { name: 'Low', color: '#10b981' },
  // Trade category
  { name: 'Plumbing', color: '#1e88e5' },
  { name: 'Electrical', color: '#fbc02d' },
  { name: 'HVAC', color: '#00897b' },
  { name: 'Roofing', color: '#546e7a' },
  { name: 'Restoration', color: '#8e24aa' },
  { name: 'Fire Safety', color: '#f4511e' },
];

const PRIORITY_NAMES = new Set(['high', 'medium', 'low']);

@Injectable({ providedIn: 'root' })
export class TagSession {
  private readonly tagApi = inject(TagApi);

  readonly tags = signal<TagDto[]>([]);
  readonly loading = signal(false);

  readonly tagsById = computed<ReadonlyMap<string, TagDto>>(() => {
    const map = new Map<string, TagDto>();
    for (const tag of this.tags()) {
      map.set(tag.id, tag);
    }
    return map;
  });

  readonly priorityTags = computed<TagDto[]>(() =>
    this.tags().filter((t) => TagSession.isPriorityName(t.name)),
  );

  readonly tradeTags = computed<TagDto[]>(() =>
    this.tags().filter((t) => !TagSession.isPriorityName(t.name)),
  );

  isPriorityTag(tag: TagDto): boolean {
    return TagSession.isPriorityName(tag.name);
  }

  private static isPriorityName(name: string | null | undefined): boolean {
    return PRIORITY_NAMES.has((name ?? '').trim().toLowerCase());
  }

  async loadForUser(userId: string): Promise<void> {
    this.loading.set(true);
    try {
      const existing = await firstValueFrom(this.tagApi.list(userId));
      const byName = new Set(
        existing.map((t) => (t.name ?? '').trim().toLowerCase()),
      );
      const missing = DEFAULT_TAGS.filter(
        (d) => !byName.has(d.name.toLowerCase()),
      );
      const created = await Promise.all(
        missing.map((m) => firstValueFrom(this.tagApi.create(userId, m))),
      );
      this.tags.set([...existing, ...created]);
    } finally {
      this.loading.set(false);
    }
  }

  clear(): void {
    this.tags.set([]);
  }
}
