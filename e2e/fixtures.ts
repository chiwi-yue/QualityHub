import { readFileSync } from 'fs';
import { join } from 'path';

interface FixtureUser {
  username: string;
  password: string;
  tasks: Array<{ id: number; title: string; completed: boolean }>;
}

function loadFixtures(): FixtureUser[] {
  try {
    return JSON.parse(
      readFileSync(join(process.cwd(), 'data', 'fixtures', 'seeded.json'), 'utf8')
    );
  } catch {
    return [];
  }
}

export const FIXTURE_USERS: FixtureUser[] = loadFixtures();
