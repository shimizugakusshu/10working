import { Activity, Team, User, Workout } from '../models/index.js';

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  const invalidInput = () => Object.assign(new Error('A valid userId, teamId, type, and positive minutes are required'), { status: 400 });
  const isRecord = (value: unknown): value is Record<string, unknown> =>
    value !== null && typeof value === 'object' && !Array.isArray(value);
  if (!isRecord(input)) throw invalidInput();

  const { userId, teamId, type, minutes } = input;
  const isObjectId = (value: unknown): value is string => typeof value === 'string' && /^[\da-f]{24}$/i.test(value);
  if (
    !isObjectId(userId) ||
    !isObjectId(teamId) ||
    typeof type !== 'string' ||
    !type.trim() ||
    typeof minutes !== 'number' ||
    !Number.isFinite(minutes) ||
    minutes <= 0
  ) {
    throw invalidInput();
  }

  const [user, team] = await Promise.all([
    User.exists({ _id: userId }),
    Team.exists({ _id: teamId }),
  ]);
  if (!user || !team) {
    throw Object.assign(new Error('The specified user or team does not exist'), { status: 404 });
  }

  return Activity.create({
    user: userId,
    team: teamId,
    type: type.trim(),
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  const invalidInput = () => Object.assign(new Error('A team name and mascot are required'), { status: 400 });
  const isRecord = (value: unknown): value is Record<string, unknown> =>
    value !== null && typeof value === 'object' && !Array.isArray(value);
  if (!isRecord(input)) throw invalidInput();

  const { name, mascot, members = [] } = input;
  if (
    typeof name !== 'string' ||
    !name.trim() ||
    typeof mascot !== 'string' ||
    !mascot.trim() ||
    !Array.isArray(members)
  ) {
    throw invalidInput();
  }

  const isObjectId = (value: unknown): value is string => typeof value === 'string' && /^[\da-f]{24}$/i.test(value);
  if (!members.every(isObjectId)) throw invalidInput();
  if (members.length > 0) {
    const existingUsers = await User.countDocuments({ _id: { $in: members } });
    if (existingUsers !== new Set(members).size) {
      throw Object.assign(new Error('One or more team members do not exist'), { status: 404 });
    }
  }

  return Team.create({ name: name.trim(), mascot: mascot.trim(), members });
}

export async function getLeaderboard() {
  const teams = await Team.aggregate<{ teamName: string; totalPoints: number }>([
    {
      $lookup: {
        from: Activity.collection.name,
        localField: '_id',
        foreignField: 'team',
        as: 'activities',
      },
    },
    {
      $project: {
        _id: 0,
        teamName: '$name',
        totalPoints: { $sum: '$activities.points' },
      },
    },
    { $sort: { totalPoints: -1, teamName: 1 } },
  ]);
  return teams.map((team, index) => ({ ...team, rank: index + 1 }));
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail }).lean();
  if (!user) {
    throw Object.assign(new Error('User not found'), { status: 404 });
  }

  const [workouts, recentActivities] = await Promise.all([
    Workout.find().lean(),
    Activity.find({ user: user._id }).sort({ occurredAt: -1 }).limit(5).lean(),
  ]);
  const normalize = (value: string) => value.trim().toLowerCase();
  const goal = normalize(user.fitnessGoal);
  const goalMatches = workouts.filter((workout) => normalize(workout.focus) === goal);
  const latestActivityType = recentActivities[0]?.type;
  const activityFocus = latestActivityType
    ? ['run', 'cycle', 'walk'].includes(normalize(latestActivityType))
      ? 'endurance'
      : normalize(latestActivityType)
    : undefined;
  const activityMatches = activityFocus
    ? workouts.filter((workout) => normalize(workout.focus) === activityFocus)
    : [];
  const matchedWorkouts = activityMatches.length > 0 ? activityMatches : goalMatches;
  const reason = activityMatches.length > 0
    ? `Recommended based on your recent ${latestActivityType} activity.`
    : goalMatches.length > 0
      ? `Recommended to support your ${goal} fitness goal.`
      : 'Recommended as a general workout suggestion.';

  return [
    ...matchedWorkouts.map((workout) => ({ ...workout, reason })),
    ...workouts
      .filter((workout) => !matchedWorkouts.some((match) => match._id.equals(workout._id)))
      .map((workout) => ({ ...workout, reason: 'Suggested as an additional workout.' })),
  ];
}

export { User };
