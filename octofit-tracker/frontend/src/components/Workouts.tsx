import { CapabilityCard } from './CapabilityCard.js';
import { getJson } from '../api/client.js';

type Suggestion = { _id?: string; title: string; focus: string; minutes?: number; difficulty?: string; reason?: string };

async function loadWorkoutSuggestions() {
  const response = await getJson<{ suggestions: Suggestion[] }>('/api/workouts/suggestions/mona%40example.com');
  return response.suggestions;
}

export default function Workouts() {
  return (
    <CapabilityCard
      title="Workout suggestions"
      description="Recommend workouts from activity patterns."
      emptyMessage="No workout suggestions available."
      loadItems={loadWorkoutSuggestions}
      itemKey={(suggestion, index) => suggestion._id ?? `${suggestion.title}-${index}`}
      renderItem={(suggestion) => (
        <>
          {suggestion.title} · {suggestion.focus}
          {suggestion.minutes !== undefined && <> · {suggestion.minutes} minutes</>}
          {suggestion.difficulty && <> · {suggestion.difficulty}</>}
          {suggestion.reason && <p className="mb-0">{suggestion.reason}</p>}
        </>
      )}
    />
  );
}
