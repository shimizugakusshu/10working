import { CapabilityCard } from './CapabilityCard.js';
import { getJson } from '../api/client.js';

type Team = { _id?: string; name: string; mascot: string; members: string[] };

async function loadTeams() {
  const response = await getJson<{ teams: Team[] }>('/api/teams');
  return response.teams;
}

export default function Teams() {
  return (
    <CapabilityCard
      title="Teams"
      description="Manage teams and members."
      emptyMessage="No teams yet."
      loadItems={loadTeams}
      itemKey={(team, index) => team._id ?? `${team.name}-${index}`}
      renderItem={(team) => <>{team.name} · {team.mascot} · {team.members.length} members</>}
    />
  );
}
